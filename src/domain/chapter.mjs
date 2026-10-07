import { validateBlock, immutable } from './content-block.mjs';

export const validId = value => typeof value === 'string' && /^[a-z0-9-]+$/.test(value);

export class Chapter {
  constructor({ id, title, group = '', intro = '', sections }) {
    if (!validId(id) || typeof title !== 'string' || !title.trim() || typeof group !== 'string' || typeof intro !== 'string' || !Array.isArray(sections) || !sections.length) throw new Error(`Invalid chapter: ${id}`);
    const sectionIds = new Set();
    const questionIds = new Set();
    for (const section of sections) {
      if (!validId(section.id) || sectionIds.has(section.id) || typeof section.title !== 'string' || !Array.isArray(section.blocks) || !section.blocks.length) throw new Error(`Invalid section: ${section.id}`);
      sectionIds.add(section.id);
      for (const block of section.blocks) {
        validateBlock(block);
        if (block.type === 'question') {
          if (questionIds.has(block.id)) throw new Error(`Duplicate question: ${block.id}`);
          questionIds.add(block.id);
        }
      }
    }
    for (const block of sections.flatMap(section => section.blocks)) {
      if (block.type === 'question' && block.topicId && !sectionIds.has(block.topicId)) throw new Error(`Unknown question topic: ${block.topicId}`);
    }
    Object.assign(this, { id, title, group, intro, sections: immutable(structuredClone(sections)) });
    Object.freeze(this);
  }
}
