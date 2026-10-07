const chapterSummary = chapter => chapter && ({ id: chapter.id, title: chapter.title, group: chapter.group });
const bookSummary = book => ({
  id: book.id, title: book.title, subtitle: book.subtitle, description: book.description,
  category: book.category, edition: book.edition, examYear: book.examYear, validThrough: book.validThrough,
  chapters: book.chapters.map(chapterSummary)
});

export class LibraryService {
  /** @param {import('../domain/book-repository.mjs').BookRepository} repository */
  constructor(repository) { this.repository = repository; }
  async books() {
    this.loadedBooks ??= this.repository.all().then(books => {
      if (new Set(books.map(book => book.id)).size !== books.length) throw new Error('Duplicate book ID');
      return books;
    });
    return this.loadedBooks;
  }
  async publication() {
    const books = await this.books();
    return { books: books.map(bookSummary), chapterCount: books.reduce((count, book) => count + book.chapters.length, 0) };
  }
  async reading(bookId, chapterId) {
    const book = (await this.books()).find(book => book.id === bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);
    const reading = book.reading(chapterId);
    return {
      book: bookSummary(book),
      chapter: { ...chapterSummary(reading.chapter), intro: reading.chapter.intro, sections: reading.chapter.sections },
      position: reading.position,
      previous: chapterSummary(reading.previous), next: chapterSummary(reading.next)
    };
  }
}
