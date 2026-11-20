"use client";

import React, { useState } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";

interface BorrowReceiptProps {
    bookId: string;
    title: string;
    author: string;
    genre: string;
    borrowRecordId?: string;
    dueDate?: string;
    borrowDate?: string;
    userName?: string;
    userEmail?: string;
    universityId?: number | string;
    trigger?: React.ReactNode;
}

export default function BorrowReceipt({
    bookId,
    title,
    author,
    genre,
    borrowRecordId,
    dueDate,
    borrowDate,
    userName,
    userEmail,
    universityId,
    trigger,
}: BorrowReceiptProps) {
    const [open, setOpen] = useState(false);

    const now = dayjs().startOf("day");
    const due = dueDate ? dayjs(dueDate).startOf("day") : null;
    const daysLeft = due ? due.diff(now, "day") : null;

    const formattedBorrowDate = borrowDate ? dayjs(borrowDate).format("MMMM D, YYYY") : "N/A";
    const formattedDueDate = dueDate ? dayjs(dueDate).format("MMMM D, YYYY") : "N/A";

    const isOverdue = daysLeft !== null && daysLeft < 0;
    const loanStatusText = isOverdue
        ? `${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? "day" : "days"} overdue`
        : daysLeft === 0
        ? "Due today"
        : daysLeft !== null
        ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} remaining`
        : "Active Loan";

    const handleDownloadText = () => {
        const textContent = [
            "============================================================",
            "                  BOOKWISE LIBRARY RECEIPT                  ",
            "============================================================",
            `Receipt ID:     ${borrowRecordId || "N/A"}`,
            `Issued Date:    ${formattedBorrowDate}`,
            `Due Date:       ${formattedDueDate}`,
            `Status:         ${loanStatusText.toUpperCase()}`,
            "------------------------------------------------------------",
            "BOOK DETAILS:",
            `Title:          ${title}`,
            `Author:         ${author}`,
            `Genre:          ${genre}`,
            `Book ID:        ${bookId}`,
            "------------------------------------------------------------",
            "BORROWER DETAILS:",
            `Name:           ${userName || "Student"}`,
            `Email:          ${userEmail || "N/A"}`,
            `University ID:  ${universityId ? String(universityId) : "N/A"}`,
            "============================================================",
            "Please return borrowed materials on or before the due date.",
            "Thank you for reading with BookWise Library!",
            "============================================================",
        ].join("\n");

        const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        link.download = `receipt-${sanitizedTitle || "book"}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="book-btn flex items-center justify-center gap-2">
                        <Image
                            src="/icons/receipt.svg"
                            alt="receipt"
                            width={16}
                            height={16}
                            className="object-contain"
                        />
                        <span>Download receipt</span>
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-md border-dark-400 bg-dark-200 text-white sm:rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-bebas-neue text-2xl tracking-wide text-primary">
                        <Image
                            src="/icons/receipt.svg"
                            alt="receipt"
                            width={22}
                            height={22}
                            className="object-contain"
                        />
                        <span>Borrowing Receipt</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-light-200">
                        Official confirmation for your library loan record.
                    </DialogDescription>
                </DialogHeader>

                <div
                    id="book-receipt-printable"
                    className="mt-2 space-y-4 rounded-lg border border-light-100/10 bg-dark-300 p-4"
                >
                    <div className="border-b border-light-100/10 pb-3">
                        <p className="text-xs uppercase tracking-wider text-light-700">Book Title</p>
                        <p className="mt-1 font-semibold text-white">{title}</p>
                        <p className="text-xs text-light-200">by {author} • {genre}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md border border-light-100/10 bg-dark-200 p-2.5">
                            <p className="text-light-700">Issued On</p>
                            <p className="mt-1 font-medium text-white">{formattedBorrowDate}</p>
                        </div>

                        <div className="rounded-md border border-light-100/10 bg-dark-200 p-2.5">
                            <p className="text-light-700">Due Date</p>
                            <p className="mt-1 font-medium text-white">{formattedDueDate}</p>
                        </div>

                        <div className="rounded-md border border-light-100/10 bg-dark-200 p-2.5">
                            <p className="text-light-700">Status</p>
                            <p
                                className={`mt-1 font-medium ${
                                    isOverdue
                                        ? "text-red-400"
                                        : daysLeft === 0
                                        ? "text-amber-400"
                                        : "text-emerald-400"
                                }`}
                            >
                                {loanStatusText}
                            </p>
                        </div>

                        <div className="rounded-md border border-light-100/10 bg-dark-200 p-2.5">
                            <p className="text-light-700">Receipt Ref</p>
                            <p className="mt-1 font-mono text-xs text-white truncate" title={borrowRecordId}>
                                {borrowRecordId ? borrowRecordId.slice(0, 8).toUpperCase() : "N/A"}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-md border border-light-100/10 bg-dark-200 p-3 text-xs">
                        <p className="text-light-700">Borrower Information</p>
                        <p className="mt-1 font-medium text-white">{userName || "Student"}</p>
                        {userEmail && <p className="text-light-200">{userEmail}</p>}
                        {universityId && (
                            <p className="mt-1 text-light-700">
                                Student ID: <span className="text-light-100">{universityId}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        onClick={handleDownloadText}
                        className="bg-primary text-dark-100 hover:bg-primary/90 text-xs font-semibold"
                    >
                        Download Text Receipt
                    </Button>

                    <Button
                        type="button"
                        onClick={handlePrint}
                        variant="outline"
                        className="border-dark-400 text-light-100 hover:bg-dark-300 text-xs"
                    >
                        Print / Save PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
