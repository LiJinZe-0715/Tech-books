import { Chapter, validId } from './chapter.mjs';

// Aggregate root: publication rules belong here; themes and HTML do not.
export class Book {
  constructor({ id, title, subtitle = '', description = '', category = '', edition = '', examYear, validThrough, chapters }) {
    if (!validId(id) || typeof title !== 'string' || !title.trim() || !Array.isArray(chapters) || !chapters.length) throw new Error(`Invalid book: ${id}`);
    for (const value of [subtitle, description, category, edition]) if (typeof value !== 'string') throw new Error(`Invalid book metadata: ${id}`);
    if (examYear !== undefined && (!Number.isInteger(examYear) || examYear < 2000)) throw new Error(`Invalid exam year: ${id}`);
    if (validThrough !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(validThrough) || Number.isNaN(Date.parse(validThrough)) || new Date(validThrough).toISOString().slice(0, 10) !== validThrough)) throw new Error(`Invalid validity date: ${id}`);
    const entities = chapters.map(chapter => new Chapter(chapter));
    if (new Set(entities.map(chapter => chapter.id)).size !== entities.length) throw new Error(`Duplicate chapter in ${id}`);
    Object.assign(this, { id, title, subtitle, description, category, edition, examYear, validThrough, chapters: Object.freeze(entities) });
    Object.freeze(this);
  }

  reading(chapterId) {
    const index = this.chapters.findIndex(chapter => chapter.id === chapterId);
    if (index < 0) throw new Error(`Chapter not found: ${chapterId}`);
    return { chapter: this.chapters[index], previous: this.chapters[index - 1], next: this.chapters[index + 1], position: index + 1 };
  }
}
