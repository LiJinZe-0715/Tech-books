const fail = message => { throw new Error(`Invalid content: ${message}`); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const safeLink = value => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
};

export function validateBlock(block) {
  if (!block || typeof block !== 'object') fail('expected a block object');
  switch (block.type) {
    case 'paragraph':
      if (!Array.isArray(block.spans) || !block.spans.length || block.spans.some(span => typeof span.text !== 'string' || (span.href && !safeLink(span.href)))) fail('paragraph spans');
      break;
    case 'code': case 'markdown':
      if (!text(block.text)) fail(`${block.type} text`);
      break;
    case 'callout':
      if (!text(block.label) || !text(block.text)) fail('callout label or text');
      break;
    case 'table':
      if (!Array.isArray(block.headers) || !block.headers.length || block.headers.some(header => !text(header)) || !Array.isArray(block.rows) || block.rows.some(row => !Array.isArray(row) || row.length !== block.headers.length || row.some(cell => typeof cell !== 'string'))) fail('table dimensions');
      break;
    case 'link':
      if (!text(block.text) || !safeLink(block.url)) fail('reference link');
      break;
    case 'question': {
      if (!text(block.id) || !text(block.prompt?.zh) || !text(block.prompt?.ja) || !text(block.explanation) || !Array.isArray(block.options) || block.options.length < 2) fail('question fields');
      const ids = new Set();
      for (const option of block.options) {
        if (!text(option.id) || ids.has(option.id) || !text(option.zh) || !text(option.ja)) fail(`question options: ${block.id}`);
        ids.add(option.id);
      }
      if (!ids.has(block.correctOptionId)) fail(`question answer: ${block.id}`);
      break;
    }
    default: fail(`unknown block type ${block.type}`);
  }
}

export function immutable(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(immutable);
    Object.freeze(value);
  }
  return value;
}
