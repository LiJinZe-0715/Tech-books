import { Marked } from 'marked';

export const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
function safeUrl(value) {
  try {
    const parsed = new URL(value, 'https://library.invalid/');
    return ['http:', 'https:'].includes(parsed.protocol) ? escape(value) : null;
  } catch { return null; }
}
function link(href, html, title) {
  const destination = safeUrl(href);
  if (!destination) return html;
  const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${destination}"${title ? ` title="${escape(title)}"` : ''}${external}>${html}</a>`;
}
const markdown = new Marked({
  gfm: true,
  async: false,
  renderer: {
    html({ text }) { return escape(text); },
    link({ href, title, tokens }) { return link(href, this.parser.parseInline(tokens), title); },
    image({ href, title, text }) {
      const source = safeUrl(href);
      return source ? `<img src="${source}" alt="${escape(text)}"${title ? ` title="${escape(title)}"` : ''}>` : escape(text);
    },
    heading({ depth, tokens }) {
      const level = Math.max(2, depth);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    }
  }
});

function renderQuestion(question) {
  const answerIndex = question.options.findIndex(option => option.id === question.correctOptionId);
  if (answerIndex < 0) throw new Error(`Question has no answer: ${question.id}`);
  const options = question.options.map(option => `<li>${escape(option.zh)}${option.ja !== option.zh ? `<span class="secondary"> · ${escape(option.ja)}</span>` : ''}</li>`).join('');
  return `<div class="question">
    <span class="eyebrow">${escape(question.typeLabel || '练习')}</span>
    <h3>${escape(question.prompt.zh)}</h3><p class="secondary">${escape(question.prompt.ja)}</p>
    <ol type="A">${options}</ol>
    <details><summary>查看答案与解析</summary><div class="answer">
      <strong>答案：${String.fromCharCode(65 + answerIndex)} · ${escape(question.options[answerIndex].zh)}</strong>
      <p>${escape(question.explanation)}</p>
    </div></details>
  </div>`;
}

export function renderBlock(block) {
  switch (block.type) {
    case 'paragraph': return `<p>${block.spans.map(span => {
      const text = span.bold ? `<strong>${escape(span.text)}</strong>` : escape(span.text);
      return span.href ? link(span.href, text) : text;
    }).join('')}</p>`;
    case 'code': return `<pre><code>${escape(block.text)}</code></pre>`;
    case 'markdown': return markdown.parse(block.text);
    case 'callout': return `<aside class="callout"><strong>${escape(block.label)}</strong><p>${escape(block.text)}</p></aside>`;
    case 'table': return `<div class="table-scroll" tabindex="0" role="region" aria-label="内容表格"><table>
      <thead><tr>${block.headers.map(header => `<th scope="col">${escape(header)}</th>`).join('')}</tr></thead>
      <tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
    case 'link': return `<p>${link(block.url, escape(block.text))}</p>`;
    case 'question': return renderQuestion(block);
    default: throw new Error(`Unsupported block type: ${block.type}`);
  }
}
