require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { runFullSync } = require('../services/syncService');

async function refreshKnowledgeBase() {
    console.log("Starting ChromaDB refresh...");
    await runFullSync();
    console.log("ChromaDB knowledge base updated.");
}

if (require.main === module) {
    refreshKnowledgeBase().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { refreshKnowledgeBase };
