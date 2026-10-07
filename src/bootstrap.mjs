import { JsonBookRepository, readCatalog } from './infrastructure/json-book-repository.mjs';
import { LibraryService } from './application/library-service.mjs';

export function createLibrary(contentDirectory) {
  return new LibraryService(new JsonBookRepository(contentDirectory));
}

export async function loadAppearance(contentDirectory) {
  const catalog = await readCatalog(contentDirectory);
  for (const entry of catalog) {
    if (!['blue', 'orange', 'green'].includes(entry.theme) || typeof entry.monogram !== 'string' || !entry.monogram.trim()) throw new Error(`Invalid appearance: ${entry.id}`);
  }
  return Object.fromEntries(catalog.map(({ id, theme, monogram }) => [id, { theme, monogram }]));
}
