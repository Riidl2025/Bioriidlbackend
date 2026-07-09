const crypto = require('crypto');

function urlToSlug(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

function chunkPageText(url, text, maxChunkSize = 1400) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 40);
  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  if (!chunks.length && text.trim()) chunks.push(text.trim().slice(0, maxChunkSize));

  const slug = urlToSlug(url);
  return chunks.map((chunkText, index) => ({
    id: `${slug}-${index}`,
    url,
    text: chunkText,
    chunkIndex: index,
  }));
}

module.exports = { chunkPageText, urlToSlug };
