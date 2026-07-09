const { ChromaClient } = require('chromadb');
const { startChromaServer } = require('./chromaServer');

const COLLECTION_NAME = 'bioriidl_knowledge';

let client = null;
let collection = null;

function agentLog(payload) {
  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/333fa7c1-de84-45f4-9326-e086d2e5c393', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0d705f' },
    body: JSON.stringify({ sessionId: '0d705f', timestamp: Date.now(), ...payload }),
  }).catch(() => {});
  // #endregion
}

function getClient() {
  if (!client) {
    client = new ChromaClient({
      host: process.env.CHROMA_HOST || '127.0.0.1',
      port: parseInt(process.env.CHROMA_PORT || '8100', 10),
    });
  }
  return client;
}

async function ensureReady() {
  await startChromaServer();
}

async function getCollection() {
  await ensureReady();
  if (!collection) {
    collection = await getClient().getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: null,
      configuration: { hnsw: { space: 'cosine' } },
    });
  }
  return collection;
}

async function replaceAllChunks(chunks) {
  const chroma = getClient();

  try {
    await chroma.deleteCollection({ name: COLLECTION_NAME });
  } catch (_) {
    // collection may not exist on first run
  }

  collection = await chroma.createCollection({
    name: COLLECTION_NAME,
    embeddingFunction: null,
    configuration: { hnsw: { space: 'cosine' } },
  });

  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await collection.add({
      ids: batch.map((c) => c.id),
      embeddings: batch.map((c) => c.embedding),
      documents: batch.map((c) => c.text),
      metadatas: batch.map((c) => ({ url: c.url, chunkIndex: c.chunkIndex })),
    });
  }

  // #region agent log
  agentLog({
    runId: 'chroma-sync',
    hypothesisId: 'A',
    location: 'chromaService.js:replaceAllChunks',
    message: 'Chunks indexed in ChromaDB',
    data: { chunkCount: chunks.length, collection: COLLECTION_NAME },
  });
  // #endregion

  return chunks.length;
}

async function queryRelevantChunks(queryEmbedding, limit = 5, threshold = 0) {
  const col = await getCollection();
  const count = await col.count();

  if (count === 0) {
    // #region agent log
    agentLog({
      runId: 'chroma-query',
      hypothesisId: 'B',
      location: 'chromaService.js:queryRelevantChunks',
      message: 'Collection empty',
      data: { count: 0 },
    });
    // #endregion
    return [];
  }

  const results = await col.query({
    queryEmbeddings: [queryEmbedding],
    nResults: Math.min(limit, count),
    include: ['documents', 'metadatas', 'distances'],
  });

  const matches = results.ids[0].map((id, i) => {
    const distance = results.distances[0][i] ?? 1;
    return {
      id,
      text: results.documents[0][i],
      url: results.metadatas[0][i]?.url || '',
      score: 1 - distance,
    };
  }).filter((m) => m.score >= threshold);

  // #region agent log
  agentLog({
    runId: 'chroma-query',
    hypothesisId: 'B-C',
    location: 'chromaService.js:queryRelevantChunks',
    message: 'Query results',
    data: {
      totalInCollection: count,
      rawResultCount: results.ids[0].length,
      afterThreshold: matches.length,
      topScore: matches[0]?.score ?? null,
      threshold,
    },
  });
  // #endregion

  return matches;
}

function resetClient() {
  client = null;
  collection = null;
}

module.exports = {
  getCollection,
  replaceAllChunks,
  queryRelevantChunks,
  resetClient,
};
