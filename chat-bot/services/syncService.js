const { performScrapeJob } = require('./scraperService');
const { createEmbeddings } = require('./embeddingService');
const { chunkPageText } = require('./chunkUtils');
const { replaceAllChunks } = require('./chromaService');
const { startChromaServer } = require('./chromaServer');


async function runFullSync() {
  console.log(`[${new Date().toISOString()}] SYNC STARTED: scrape → embed → ChromaDB`);
  try {
    await startChromaServer();
    const pages = await performScrapeJob();
    agentLog({
      runId: 'chroma-sync',
      hypothesisId: 'D',
      location: 'syncService.js:runFullSync',
      message: 'Scrape complete',
      data: { pageCount: pages.length },
    });

    const allChunks = [];
    for (const page of pages) {
      const chunks = chunkPageText(page.url, page.text);
      for (const chunk of chunks) {
        const embedding = await createEmbeddings(chunk.text);
        allChunks.push({ ...chunk, embedding });
      }
    }

    const indexed = await replaceAllChunks(allChunks);
    console.log(`[Sync] SUCCESS: ${indexed} chunks indexed in ChromaDB from ${pages.length} pages.`);
  } catch (err) {
    console.error('[Sync] FAILED:', err.message);
    agentLog({
      runId: 'chroma-sync',
      hypothesisId: 'E',
      location: 'syncService.js:runFullSync',
      message: 'Sync failed',
      data: { error: err.message },
    });
    // #endregion
    throw err;
  }
}

module.exports = { runFullSync };
