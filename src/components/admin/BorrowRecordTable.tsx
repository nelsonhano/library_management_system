"use client";

import React from "react";
import dayjs from "dayjs";
import Image from "next/image";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import BookCover from "@/components/BookCover";
import BorrowReceipt from "@/components/BorrowReceipt";
import ReturnBook from "@/components/ReturnBook";
import { getInitials } from "@/lib/utils";

export interface AdminBorrowRecord {
    id: string;
    borrowDate: Date | string;
    dueDate: string;
    returnDate: string | null;
    status: "BORROWED" | "RETURNED";
    createdAt: Date | string | null;
    book: {
        id: string;
        title: string;
        author: string;
        genre: string;
        coverUrl: string;
        coverColor: string;
    };
    user: {
        id: string;
        fullName: string;
        email: string;
        universityId: number;
    };
}

interface BorrowRecordTableProps {
    records: AdminBorrowRecord[];
}

export default function BorrowRecordTable({ records }: BorrowRecordTableProps) {
    if (records.length === 0) {
        return (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-light-400 bg-white p-8 text-center">
                <p className="font-semibold text-dark-300">No borrow records found</p>
                <p className="mt-1 text-xs text-light-500">
                    Try adjusting your search query or status filter to see more borrow records.
                </p>
            </div>
        );
    }

    const today = dayjs().startOf("day");

    const renderStatusBadge = (
        status: "BORROWED" | "RETURNED",
        dueDate: string
    ) => {
        if (status === "RETURNED") {
            return (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Returned
                </Badge>
            );
        }

        const isOverdue = dayjs(dueDate).startOf("day").isBefore(today);

        if (isOverdue) {
            return (
                <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                    Overdue
                </Badge>
            );
        }

        return (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Borrowed
            </Badge>
        );
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-light-400">
            <Table>
                <TableHeader className="bg-light-300">
                    <TableRow>
                        <TableHead className="font-semibold text-dark-400">Book</TableHead>
                        <TableHead className="font-semibold text-dark-400">Borrower</TableHead>
                        <TableHead className="font-semibold text-dark-400">Borrow Date</TableHead>
                        <TableHead className="font-semibold text-dark-400">Due Date</TableHead>
                        <TableHead className="font-semibold text-dark-400">Return Date</TableHead>
                        <TableHead className="font-semibold text-dark-400">Status</TableHead>
                        <TableHead className="text-right font-semibold text-dark-400">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record) => {
                        const formattedBorrowDate = record.borrowDate
                            ? dayjs(record.borrowDate).format("MMM DD, YYYY")
                            : "N/A";
                        const formattedDueDate = record.dueDate
                            ? dayjs(record.dueDate).format("MMM DD, YYYY")
                            : "N/A";
                        const formattedReturnDate = record.returnDate
                            ? dayjs(record.returnDate).format("MMM DD, YYYY")
                            : "—";

                        const isOverdue =
                            record.status === "BORROWED" &&
                            dayjs(record.dueDate).startOf("day").isBefore(today);

                        return (
                            <TableRow key={record.id} className="hover:bg-light-300/40">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="shrink-0">
                                            <BookCover
                                                coverColor={record.book.coverColor}
                                                coverImage={record.book.coverUrl}
                                                variant="extraSmall"
                                            />
                                        </div>
                                        <div className="min-w-0 max-w-[200px]">
                                            <p className="truncate font-medium text-dark-400">
                                                {record.book.title}
                                            </p>
                                            <p className="truncate text-xs text-light-500">
                                                {record.book.author} • {record.book.genre}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-light-400">
                                            <AvatarFallback className="bg-amber-100 text-xs font-semibold text-blue-900">
                                                {getInitials(record.user.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-dark-400">
                                                {record.user.fullName}
                                            </p>
                                            <p className="truncate text-xs text-light-500">
                                                {record.user.email} (ID: {record.user.universityId})
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="text-sm text-dark-300">
                                    {formattedBorrowDate}
                                </TableCell>

                                <TableCell>
                                    <span
                                        className={
                                            isOverdue
                                                ? "text-sm font-semibold text-rose-600"
                                                : "text-sm text-dark-300"
                                        }
                                    >
                                        {formattedDueDate}
                                    </span>
                                </TableCell>

                                <TableCell className="text-sm text-dark-300">
                                    {formattedReturnDate}
                                </TableCell>

                                <TableCell>
                                    {renderStatusBadge(record.status, record.dueDate)}
                                </TableCell>

                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <BorrowReceipt
                                            bookId={record.book.id}
                                            title={record.book.title}
                                            author={record.book.author}
                                            genre={record.book.genre}
                                            borrowRecordId={record.id}
                                            dueDate={record.dueDate}
                                            borrowDate={String(record.borrowDate)}
                                            userName={record.user.fullName}
                                            userEmail={record.user.email}
                                            universityId={record.user.universityId}
                                            trigger={
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-1.5 border-light-400 px-2.5 text-xs text-dark-300 hover:bg-light-300"
                                                >
                                                    <Image
                                                        src="/icons/receipt.svg"
                                                        alt="receipt"
                                                        width={14}
                                                        height={14}
                                                    />
                                                    Receipt
                                                </Button>
                                            }
                                        />

                                        {record.status === "BORROWED" && (
                                            <ReturnBook
                                                recordId={record.id}
                                                className="h-8 border border-emerald-500 bg-white px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                                buttonText="Return"
                                            />
                                        )}
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
