import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Book } from '../domain/book.mjs';
import { validId } from '../domain/chapter.mjs';

export async function readCatalog(contentDirectory) {
  const catalog = JSON.parse(await readFile(join(contentDirectory, 'library.json'), 'utf8'));
  if (!Array.isArray(catalog) || !catalog.length || catalog.some(entry => !validId(entry.id)) || new Set(catalog.map(entry => entry.id)).size !== catalog.length) throw new Error('Invalid library catalog');
  return catalog;
}

/** @implements {import('../domain/book-repository.mjs').BookRepository} */
export class JsonBookRepository {
  constructor(contentDirectory) { this.contentDirectory = contentDirectory; }
  async all() {
    const catalog = await readCatalog(this.contentDirectory);
    return Promise.all(catalog.map(async entry => {
      const data = JSON.parse(await readFile(join(this.contentDirectory, 'books', `${entry.id}.json`), 'utf8'));
      if (data.id !== entry.id) throw new Error(`Catalog/book identity mismatch: ${entry.id}`);
      return new Book(data);
    }));
  }
}
