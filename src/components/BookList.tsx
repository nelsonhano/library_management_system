import { cn } from '@/lib/utils';
import React from 'react'
import BookCard from './BookCard';

interface BookListProps {
  title: string,
  books: BooksProps[],
  containerClassName?: string
}

export default function BookList(
  { title, books, containerClassName }: 
  BookListProps
) {
  if (books.length < 2) return;
  
  return (
    <section className={cn(containerClassName)}>
      <h2 className='font-bebas-neue text-4xl text-light-100'>{title}</h2>

      <ul className='book-list'>
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            {...book}
          />
        ))}
      </ul>
    </section>
  );
};
