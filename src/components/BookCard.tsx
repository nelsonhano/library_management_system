import Link from 'next/link'
import React from 'react'
import BookCover from './BookCover'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import dayjs from 'dayjs'
import ReturnBook from './ReturnBook'
import BorrowReceipt from './BorrowReceipt'

export default function BookCard({
  id,
  title,
  author,
  genre,
  coverColor,
  coverUrl,
  isLoanedBook = false,
  borrowRecordId,
  dueDate,
  borrowDate,
  userName,
  userEmail,
  universityId,
}: BooksProps) {
  const now = dayjs().startOf('day');
  const due = dueDate ? dayjs(dueDate).startOf('day') : null;
  const daysLeft = due ? due.diff(now, 'day') : null;

  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isDueToday = daysLeft === 0;

  const statusLabel =
    daysLeft !== null
      ? daysLeft > 0
        ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to return`
        : isDueToday
        ? 'Due today'
        : `${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'day' : 'days'} overdue`
      : '7 days left to return';

  return (
    <li className={cn(isLoanedBook && "xs:w-52 w-full")}>
      <div className={cn(isLoanedBook && "w-full flex flex-col items-center")}>
        <Link href={`/books/${id}`} className="w-full flex flex-col items-center">
          <BookCover 
            coverColor={coverColor} 
            coverImage={coverUrl} 
          />

          <div 
            className={
              cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")
              }>
            <p className='book-title'>{title}</p>
            <p className='book-genre'>{genre}</p>
          </div>
        </Link>

        {isLoanedBook && (
          <div className='mt-3 w-full space-y-2'>
            <div className='book-loaned'>
              <Image
                src={isOverdue ? '/icons/warning.svg' : '/icons/calendar.svg'}
                alt={isOverdue ? 'warning' : 'calendar'}
                width={18}
                height={18}
                className="object-contain"
              />

              <p
                className={cn(
                  'text-xs',
                  isOverdue
                    ? 'text-red-400 font-semibold'
                    : isDueToday
                    ? 'text-amber-400 font-semibold'
                    : 'text-light-100'
                )}
              >
                {statusLabel}
              </p>
            </div>

            <div className="flex flex-col gap-1 w-full">
              <BorrowReceipt
                bookId={id}
                title={title}
                author={author}
                genre={genre}
                borrowRecordId={borrowRecordId}
                dueDate={dueDate}
                borrowDate={borrowDate}
                userName={userName}
                userEmail={userEmail}
                universityId={universityId}
              />

              {borrowRecordId && <ReturnBook recordId={borrowRecordId} />}
            </div>
          </div>
        )}
      </div>
    </li>
  )
}
