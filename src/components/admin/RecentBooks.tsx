import React from "react";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BookCover from "@/components/BookCover";

export interface RecentBookItem {
    id: string;
    title: string;
    author: string;
    genre: string;
    coverColor: string;
    coverUrl: string;
    createdAt: Date | string | null;
}

export interface RecentBooksProps {
    books: RecentBookItem[];
}

export default function RecentBooks({ books }: RecentBooksProps) {
    return (
        <div className="flex flex-col rounded-2xl bg-white p-7">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-dark-400">
                    Recently Added Books
                </h3>
                <Button asChild className="view-btn">
                    <Link href="/admin/books">View All</Link>
                </Button>
            </div>

            <Link href="/admin/books/new" className="add-new-book_btn">
                <div>
                    <Image
                        src="/icons/admin/plus.svg"
                        alt="Add book"
                        width={20}
                        height={20}
                    />
                </div>
                <div>
                    <p>Add a New Book</p>
                    <p className="text-xs text-light-500">
                        Expand your library catalog with fresh titles
                    </p>
                </div>
            </Link>

            {books.length === 0 ? (
                <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-light-400 bg-light-300/40 p-6 text-center">
                    <p className="font-semibold text-dark-300">
                        No books in catalog yet
                    </p>
                    <p className="mt-1 text-xs text-light-500">
                        Click the button above to add your first book to the library.
                    </p>
                </div>
            ) : (
                <div className="mt-4 flex flex-col gap-3">
                    {books.map((book) => {
                        const formattedDate = book.createdAt
                            ? dayjs(book.createdAt).format("MMM DD, YYYY")
                            : "N/A";

                        return (
                            <div
                                key={book.id}
                                className="flex items-center justify-between rounded-lg border border-light-400 p-3 transition-colors hover:bg-light-300/30"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Link href={`/books/${book.id}`} className="shrink-0">
                                        <BookCover
                                            variant="extraSmall"
                                            coverColor={book.coverColor}
                                            coverImage={book.coverUrl}
                                        />
                                    </Link>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <Link
                                            href={`/books/${book.id}`}
                                            className="text-sm font-semibold text-dark-400 hover:underline line-clamp-1"
                                            title={book.title}
                                        >
                                            {book.title}
                                        </Link>
                                        <p className="text-xs text-light-500 line-clamp-1">
                                            {book.author}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] font-normal"
                                    >
                                        {book.genre}
                                    </Badge>
                                    <span className="text-[10px] text-light-500">
                                        {formattedDate}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
