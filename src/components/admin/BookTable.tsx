"use client";

import React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { Eye, Pencil } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import BookCover from "@/components/BookCover";
import DeleteBookButton from "./DeleteBookButton";

export interface BookTableItem {
    id: string;
    title: string;
    author: string;
    genre: string;
    rating: number;
    totalCopies: number;
    availableCopies: number;
    description: string;
    coverColor: string;
    coverUrl: string;
    videoUrl: string;
    summary: string;
    createdAt: Date | string | null;
}

interface BookTableProps {
    books: BookTableItem[];
}

export default function BookTable({ books }: BookTableProps) {
    if (books.length === 0) {
        return (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-light-400 bg-white p-8 text-center">
                <p className="font-semibold text-dark-300">No books found</p>
                <p className="mt-1 text-xs text-light-500">
                    No catalog titles match your search criteria. Try adjusting your query or genre filter.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-light-400 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-light-400 bg-light-300/40 hover:bg-light-300/40">
                        <TableHead className="w-16 text-dark-400">Cover</TableHead>
                        <TableHead className="min-w-48 text-dark-400">Title</TableHead>
                        <TableHead className="min-w-36 text-dark-400">Author</TableHead>
                        <TableHead className="min-w-28 text-dark-400">Genre</TableHead>
                        <TableHead className="min-w-32 text-dark-400">Stock</TableHead>
                        <TableHead className="min-w-32 text-dark-400">Date Added</TableHead>
                        <TableHead className="w-28 text-right text-dark-400">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {books.map((book) => {
                        const formattedDate = book.createdAt
                            ? dayjs(book.createdAt).format("MMM DD, YYYY")
                            : "N/A";

                        return (
                            <TableRow
                                key={book.id}
                                className="border-b border-light-400 hover:bg-light-300/20"
                            >
                                <TableCell className="py-3">
                                    <BookCover
                                        variant="extraSmall"
                                        coverColor={book.coverColor}
                                        coverImage={book.coverUrl}
                                    />
                                </TableCell>
                                <TableCell className="font-medium text-dark-500">
                                    {book.title}
                                </TableCell>
                                <TableCell className="text-dark-400">
                                    {book.author}
                                </TableCell>
                                <TableCell className="text-dark-400">
                                    <Badge variant="outline" className="text-xs font-normal">
                                        {book.genre}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-dark-500">
                                            {book.availableCopies} / {book.totalCopies}
                                        </span>
                                        {book.availableCopies === 0 ? (
                                            <Badge className="w-fit bg-rose-100 text-rose-700 text-[10px] hover:bg-rose-100">
                                                Out of stock
                                            </Badge>
                                        ) : (
                                            <Badge className="w-fit bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100">
                                                In stock
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-light-500">
                                    {formattedDate}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link
                                            href={`/books/${book.id}`}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                            title="View public page"
                                            aria-label={`View ${book.title}`}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/books/${book.id}/edit`}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                            title="Edit book"
                                            aria-label={`Edit ${book.title}`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <DeleteBookButton
                                            bookId={book.id}
                                            bookTitle={book.title}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
