const fs = require('fs');
const path = require('path');
const { riidlFacts, bioriidlFacts, config } = require('../data/loader');
const { queryRelevantChunks } = require('../services/chromaService');
const { createEmbeddings } = require('../services/embeddingService');
const { generateLLMResponse } = require('../services/llmService');
const DEBUG_LOG_PATH = path.join(__dirname, '../../../debug-0d705f.log');

function agentLog(payload) {
  const line = JSON.stringify({ sessionId: '0d705f', ...payload, timestamp: Date.now() }) + '\n';
  try { fs.appendFileSync(DEBUG_LOG_PATH, line); } catch (_) {}
  fetch('http://127.0.0.1:7788/ingest/333fa7c1-de84-45f4-9326-e086d2e5c393',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0d705f'},body:JSON.stringify({sessionId:'0d705f',...payload,timestamp:Date.now()})}).catch(()=>{});
}

function buildFactsContext() {
  const bioriidlSection = `Source: https://www.bioriidl.org/ (Official Bioriidl Facts)\nContent: ${JSON.stringify(bioriidlFacts, null, 2)}`;
  const riidlSection = `Source: https://riidl.org/ (Official riidl Facts)\nContent: ${JSON.stringify(riidlFacts, null, 2)}`;
  return `${bioriidlSection}\n\n${riidlSection}`;
}

async function handleChat(req, res) {
  const { message } = req.body;
  try {
    const queryEmbedding = await createEmbeddings(message);
    const factsContext = buildFactsContext();
    const matches = await queryRelevantChunks(
      queryEmbedding,
      config.retrieval_limit,
      config.similarity_threshold
    );

    agentLog({ runId: 'chroma-chat', location: 'chatcontroller.js:handleChat', message: 'Retrieval results', data: { matchCount: matches.length, topScore: matches[0]?.score ?? null, retrievalLimit: config.retrieval_limit, threshold: config.similarity_threshold, factsContextLength: factsContext.length }, hypothesisId: 'B-C' });
    const scrapedContext = matches.map(m => `Source: ${m.url}\nContent: ${m.text}`).join("\n\n");
    const context = `${factsContext}\n\n${scrapedContext}`;
    agentLog({ runId: 'chroma-chat', location: 'chatcontroller.js:handleChat', message: 'Context assembled', data: { totalContextLength: context.length, scrapedChunkCount: matches.length, factsIncluded: true, query: message.slice(0, 80) }, hypothesisId: 'A-B' });
    const aiReply = await generateLLMResponse(message, context);
    agentLog({ runId: 'chroma-chat', location: 'chatcontroller.js:handleChat', message: 'Reply generated', data: { replyLength: aiReply.length, hasEquipment: /HPLC|PCR|Fermentor/i.test(aiReply), hasLinks: /bioriidl\.org|riidl\.org/i.test(aiReply) }, hypothesisId: 'E' });
    res.json({
        reply: aiReply,
        sources: [
          'https://www.bioriidl.org/',
          'https://riidl.org/',
          ...matches.map(m => m.url)
        ]
    });

  } catch (error) {
    console.error("Chat Controller Error:", error);
    agentLog({ runId: 'chroma-chat', location: 'chatcontroller.js:handleChat', message: 'Chat error', data: { error: error.message }, hypothesisId: 'E' });
    res.status(500).json({ error: "System temporarily unavailable." });
  }
}

module.exports = { handleChat };

