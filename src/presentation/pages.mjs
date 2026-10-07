import { escape as e, renderBlock } from './content-renderer.mjs';

const padded = number => String(number).padStart(2, '0');
function shell({ title, base = '.', body, className = '' }) {
  return `<!doctype html>
<html lang="zh-CN"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="计算机基础、Java 后端工程与日商簿记的统一学习书架">
  <title>${e(title)} · 知识书架</title>
  <link rel="icon" href="${base}/assets/favicon.svg"><link rel="stylesheet" href="${base}/assets/library.css">
  <script type="module" src="${base}/assets/reader.mjs"></script>
</head><body class="${className}">
  <a class="skip-link" href="#main">跳转到正文</a>
  <header class="site-header">
    <a class="brand" href="${base}/index.html"><span class="brand-mark" aria-hidden="true">▥</span>知识书架<span class="brand-en">STUDY LIBRARY</span></a>
    <span class="header-note">读懂知识，建立自己的体系</span>
  </header>
  ${body}
  <footer class="site-footer"><span>知识书架</span><span>计算机 · 工程 · 簿记</span></footer>
</body></html>`;
}

function bookCard(book, index, { theme, monogram }) {
  return `<a class="book-card ${e(theme)}" href="${book.id}/${book.chapters[0].id}.html">
    <div class="book-cover">
      <div class="cover-top"><span>${e(book.subtitle)}</span><span>VOL. ${padded(index + 1)}</span></div>
      <div class="cover-title"><span class="cover-rule"></span><h3>${e(book.title)}</h3><span class="cover-category">${e(book.category)}</span></div>
      <div class="cover-bottom"><span>${book.chapters.length} CHAPTERS</span><span class="cover-monogram" aria-hidden="true">${e(monogram)}</span></div>
    </div>
    <div class="book-info">
      <span class="book-tag">${e(book.category)}</span><h3>${e(book.title)}</h3><p>${e(book.description)}</p>
      <div class="book-meta"><span>${book.chapters.length} 个章节与附录</span><strong>打开阅读</strong></div>
    </div>
  </a>`;
}

export function shelfPage({ books, chapterCount }, appearance) {
  return shell({ title: '我的书架', body: `<main id="main" class="shelf">
    <div class="shelf-heading">
      <div><p class="eyebrow">YOUR PERSONAL LIBRARY</p><h1>我的书架<span class="heading-dot">.</span></h1><p class="shelf-intro">选一本书，从感兴趣的章节开始。</p></div>
      <div class="library-count"><strong>${padded(books.length)}</strong><span>本书 / ${chapterCount} 个章节与附录</span></div>
    </div>
    <div class="shelf-toolbar"><h2>全部书籍 <span>${books.length}</span></h2><span>学习资料集</span></div>
    <div class="book-grid">${books.map((book, index) => bookCard(book, index, appearance[book.id])).join('\n')}</div>
    <div class="shelf-footnote"><span class="footnote-line"></span><p>从基础到实践，每一章都是下一步的起点。</p></div>
  </main>` });
}

function chapterNavigation(book, currentId) {
  return book.chapters.map((chapter, index) => {
    const group = index === 0 || chapter.group !== book.chapters[index - 1].group ? `<p class="nav-group">${e(chapter.group || '章节')}</p>` : '';
    return `${group}<a href="${chapter.id}.html" ${chapter.id === currentId ? 'aria-current="page"' : ''}><span>${padded(index + 1)}</span>${e(chapter.title)}</a>`;
  }).join('\n');
}
function paginationLink(chapter, label) {
  return `<a href="${chapter.id}.html"><span>${label}</span><strong>${e(chapter.title)}</strong></a>`;
}

export function readerPage({ book, chapter, position, previous, next }, appearance) {
  const sections = chapter.sections.map(section => ({ ...section, html: section.blocks.map(renderBlock).join('\n') }));
  const edition = book.edition ? `<p>${e(book.edition)}</p>` : '';
  const applicability = book.examYear ? `<p class="edition-note">适用 ${book.examYear} 年度考试${book.validThrough ? `（至 ${e(book.validThrough)}）` : ''}</p>` : '';
  return shell({ title: `${chapter.title} · ${book.title}`, base: '..', className: `reader-page ${e(appearance[book.id].theme)}`, body: `
    <div class="reader-toolbar"><a href="../index.html">全部书籍</a><span>/</span><span>${e(book.title)}</span><button class="toc-toggle" aria-expanded="false" aria-controls="chapter-nav">章节目录</button></div>
    <div class="reader-layout">
      <aside class="chapter-nav" id="chapter-nav">
        <div class="nav-book-title"><span class="eyebrow">${e(book.subtitle)}</span><h2>${e(book.title)}</h2>${edition}${applicability}<span>${book.chapters.length} 个章节与附录</span></div>
        <nav aria-label="章节目录">${chapterNavigation(book, chapter.id)}</nav>
      </aside>
      <main id="main" class="reader-main">
        <div class="chapter-heading"><p class="eyebrow">${e(book.category)} · ${position} / ${book.chapters.length}</p><h1>${e(chapter.title)}</h1>${chapter.intro ? `<p>${e(chapter.intro)}</p>` : ''}${applicability}</div>
        <article class="reading-content">${sections.map(section => `<section id="${e(section.id)}">${section.title ? `<h2>${e(section.title)}</h2>` : ''}${section.html}</section>`).join('\n')}</article>
        <nav class="chapter-pagination" aria-label="前后章节">
          ${previous ? paginationLink(previous, '上一章') : '<div></div>'}
          ${next ? paginationLink(next, '下一章') : '<a href="../index.html"><span>阅读结束</span><strong>返回书架</strong></a>'}
        </nav>
      </main>
      <aside class="section-nav">
        <span class="eyebrow">本章目录</span><nav aria-label="本章小节">${sections.filter(section => section.title).map(section => `<a href="#${e(section.id)}">${e(section.title)}</a>`).join('')}</nav>
        <a class="back-top" href="#main">回到顶部</a>
      </aside>
    </div>` });
}
