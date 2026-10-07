import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createLibrary, loadAppearance } from '../src/bootstrap.mjs';
import { Book } from '../src/domain/book.mjs';
import { Chapter } from '../src/domain/chapter.mjs';
import { validateBlock } from '../src/domain/content-block.mjs';
import { JsonBookRepository } from '../src/infrastructure/json-book-repository.mjs';
import { LibraryService } from '../src/application/library-service.mjs';
import { renderBlock } from '../src/presentation/content-renderer.mjs';
import { readerPage, shelfPage } from '../src/presentation/pages.mjs';

const root = resolve(import.meta.dirname, '..');
const library = createLibrary(resolve(root, 'content'));
const publication = await library.publication();
const appearance = await loadAppearance(resolve(root, 'content'));
const books = await library.books();
const paragraph = { type: 'paragraph', spans: [{ text: 'content' }] };
const minimalChapter = () => ({ id: 'one', title: 'One', sections: [{ id: 'intro', title: 'Intro', blocks: [paragraph] }] });

test('all 60 chapters, 273 questions, 464 Java rules and 7 official sources survive normalization', () => {
  assert.deepEqual(books.map(book => book.chapters.length), [13, 8, 39]);
  assert.equal(publication.chapterCount, 60);
  const blocks = books[0].chapters.flatMap(chapter => chapter.sections.flatMap(section => section.blocks));
  assert.equal(blocks.filter(block => block.type === 'question').length, 273);
  const java = books[1].chapters.flatMap(chapter => chapter.sections.flatMap(section => section.blocks)).map(block => block.text).join('\n');
  assert.equal(new Set([...java.matchAll(/^###\s+([A-Z]{2}-\d+)/gm)].map(match => match[1])).size, 464);
  assert.ok(java.includes('# 仅展示暴露范围；仍需网络隔离及适当鉴权'));
  assert.ok(java.includes('# 示例路径和端口必须由应用实际提供。'));
  const spans = books[2].chapters.flatMap(chapter => chapter.sections.flatMap(section => section.blocks.flatMap(block => block.spans || [])));
  assert.equal(spans.filter(span => span.href).length, 7);
  assert.equal(books[2].validThrough, '2027-03-31');
  assert.ok(books[2].chapters.some(chapter => chapter.group === '工業簿記'));
  const heapQuestion = blocks.find(block => block.id === 'ch3-question-13');
  assert.ok(heapQuestion.options.find(option => option.id === heapQuestion.correctOptionId).zh.includes('4GiB'));
  assert.ok(heapQuestion.explanation.includes('4,294,967,296'));
});

test('application DTOs keep appearance outside the domain and preserve navigation for every chapter', async () => {
  assert.ok(books.every(book => !Object.hasOwn(book, 'color') && !Object.hasOwn(book, 'theme')));
  for (const book of publication.books) {
    for (const [index, chapter] of book.chapters.entries()) {
      const view = await library.reading(book.id, chapter.id);
      assert.deepEqual(view.previous, book.chapters[index - 1]);
      assert.deepEqual(view.next, book.chapters[index + 1]);
      assert.equal(view.position, index + 1);
      assert.ok(!(view.chapter instanceof Chapter));
      const html = readerPage(view, appearance);
      assert.equal((html.match(/<h1>/g) || []).length, 1);
      assert.ok(html.includes('aria-current="page"'));
    }
  }
  const oneBookShelf = shelfPage({ books: [publication.books[0]], chapterCount: 13 }, appearance);
  assert.ok(oneBookShelf.includes('<strong>01</strong>'));
  await assert.rejects(library.reading('missing', 'one'), /Book not found/);
  await assert.rejects(library.reading('computer', 'missing'), /Chapter not found/);
});

test('domain rejects broken identities, answers, table dimensions and dates; aggregates are immutable', () => {
  assert.throws(() => new Book({ id: '../escape', title: 'Invalid', chapters: [minimalChapter()] }), /Invalid book/);
  assert.throws(() => new Book({ id: 'test', title: 'Test', chapters: [minimalChapter(), minimalChapter()] }), /Duplicate chapter/);
  assert.throws(() => new Book({ id: 'test', title: 'Test', validThrough: '2027-02-30', chapters: [minimalChapter()] }), /Invalid validity/);
  assert.throws(() => validateBlock({ type: 'table', headers: ['A', 'B'], rows: [['A']] }), /table dimensions/);
  const question = { type: 'question', id: 'q', prompt: { ja: 'Q', zh: 'Q' }, options: [{ id: 'a', ja: 'A', zh: 'A' }, { id: 'b', ja: 'B', zh: 'B' }], correctOptionId: 'missing', explanation: 'reason' };
  assert.throws(() => validateBlock(question), /question answer/);
  const chapter = minimalChapter();
  chapter.sections[0].blocks.push({ ...question, topicId: 'missing', correctOptionId: 'a' });
  assert.throws(() => new Chapter(chapter), /Unknown question topic/);
  assert.throws(() => { books[0].chapters[0].sections[0].blocks[0].spans[0].text = 'changed'; }, TypeError);
});

test('repositories validate catalog paths and book identity; application can use an in-memory repository', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'library-test-'));
  try {
    await writeFile(join(directory, 'library.json'), JSON.stringify([{ id: '../escape' }]));
    await assert.rejects(new JsonBookRepository(directory).all(), /Invalid library catalog/);
    await writeFile(join(directory, 'library.json'), JSON.stringify([{ id: 'test' }]));
    await mkdir(join(directory, 'books'));
    await writeFile(join(directory, 'books/test.json'), JSON.stringify({ id: 'other' }));
    await assert.rejects(new JsonBookRepository(directory).all(), /identity mismatch/);
  } finally { await rm(directory, { recursive: true, force: true }); }
  let reads = 0;
  const service = new LibraryService({ all: async () => { reads++; return [books[0]]; } });
  assert.equal((await service.publication()).books.length, 1);
  await service.reading('computer', 'ch1');
  assert.equal(reads, 1);
});

test('Markdown and structured content escape active HTML and unsafe URL schemes', () => {
  const unsafe = '<script>alert(1)</script>';
  assert.equal(renderBlock({ type: 'paragraph', spans: [{ text: unsafe }] }), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  const html = renderBlock({ type: 'markdown', text: `${unsafe}\n\n[x](javascript:alert%281%29)\n\n![x](data:text/html,test)\n\n<img src=x onerror=alert(1)>` });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('href="javascript:'));
  const reference = renderBlock({ type: 'paragraph', spans: [{ text: 'source', bold: true, href: 'https://www.kentei.ne.jp/bookkeeping/35697-2' }] });
  assert.ok(reference.includes('<a href="https://www.kentei.ne.jp/bookkeeping/35697-2"'));
  assert.ok(reference.includes('<strong>source</strong>'));
});

test('all pages, local assets and anchors resolve under the GitHub Pages repository path', async () => {
  const origin = 'https://lijinze0715-hub.github.io';
  const mount = '/certification-exam-prep-books/';
  const pages = new Map([['index.html', shelfPage(publication, appearance)]]);
  for (const book of publication.books) {
    for (const chapter of book.chapters) pages.set(`${book.id}/${chapter.id}.html`, readerPage(await library.reading(book.id, chapter.id), appearance));
  }
  const assets = await readdir(resolve(root, 'src/presentation/assets'));
  const available = new Set([...pages.keys(), ...assets.map(name => `assets/${name}`)]);
  for (const [path, html] of pages) {
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const target = new URL(match[1].replaceAll('&amp;', '&'), new URL(mount + path, origin));
      if (target.origin !== origin) continue;
      assert.ok(target.pathname.startsWith(mount), `${path}: escapes repository path`);
      const relativePath = decodeURIComponent(target.pathname.slice(mount.length));
      assert.ok(available.has(relativePath), `${path}: missing ${relativePath}`);
      if (target.hash && pages.has(relativePath)) assert.ok(pages.get(relativePath).includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `${path}: missing anchor ${target.hash}`);
    }
  }
  const bibliography = pages.get('boki/appendix-e.html');
  assert.equal((bibliography.match(/>打开官方原文<\/a>/g) || []).length, 7);
});

test('domain and application imports do not depend on file IO, presentation or third-party libraries', async () => {
  for (const layer of ['domain', 'application']) {
    for (const filename of await readdir(resolve(root, 'src', layer))) {
      const source = await readFile(resolve(root, 'src', layer, filename), 'utf8');
      const imports = [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
      assert.ok(imports.every(path => path.startsWith('./') || path.startsWith('../domain/')), `${layer}/${filename}: invalid dependency direction`);
    }
  }
});
