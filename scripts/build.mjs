import { mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createLibrary, loadAppearance } from '../src/bootstrap.mjs';
import { shelfPage, readerPage } from '../src/presentation/pages.mjs';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'dist');
const library = createLibrary(join(root, 'content'));
const publication = await library.publication();
const appearance = await loadAppearance(join(root, 'content'));
// Validate every aggregate before replacing the generated publication.
if (output !== join(root, 'dist')) throw new Error('Unexpected build output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(join(output, 'index.html'), shelfPage(publication, appearance));
await writeFile(join(output, '.nojekyll'), '');
await cp(join(root, 'src/presentation/assets'), join(output, 'assets'), { recursive: true });
for (const book of publication.books) {
  await mkdir(join(output, book.id), { recursive: true });
  for (const chapter of book.chapters) {
    await writeFile(join(output, book.id, `${chapter.id}.html`), readerPage(await library.reading(book.id, chapter.id), appearance));
  }
}
console.log(`Built ${publication.books.length} books, ${publication.chapterCount} chapters in dist/`);
