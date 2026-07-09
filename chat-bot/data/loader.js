const fs = require('fs');
const path = require('path');

function loadFactsFolder(folderPath) {
  const merged = {};
  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const key = path.basename(file, '.json');
    merged[key] = JSON.parse(fs.readFileSync(path.join(folderPath, file), 'utf-8'));
  }
  return merged;
}

module.exports = {
  bioriidlFacts: loadFactsFolder(path.join(__dirname, 'facts', 'bioriidlFacts')),
  config: JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'))
};