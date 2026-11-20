import React from "react";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import BookCover from "@/components/BookCover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

export interface BookStripeProps {
    id: string;
    bookId: string;
    title: string;
    author: string;
    genre: string;
    coverColor: string;
    coverUrl: string;
    borrowDate: Date | string | null;
    status: "BORROWED" | "RETURNED";
    borrowerName: string;
    borrowerEmail?: string;
}

export default function BookStripe({
    bookId,
    title,
    author,
    genre,
    coverColor,
    coverUrl,
    borrowDate,
    status,
    borrowerName,
}: BookStripeProps) {
    const formattedDate = borrowDate
        ? dayjs(borrowDate).format("MMM DD, YYYY")
        : "N/A";
    const initials = getInitials(borrowerName || "Unknown") || "UN";

    return (
        <div className="book-stripe items-start justify-between">
            <div className="flex flex-row items-start gap-4 flex-1 min-w-0">
                <Link href={`/books/${bookId}`} className="shrink-0">
                    <BookCover
                        variant="extraSmall"
                        coverColor={coverColor}
                        coverImage={coverUrl}
                    />
                </Link>

                <div className="flex flex-col flex-1 min-w-0">
                    <Link
                        href={`/books/${bookId}`}
                        className="title hover:underline"
                        title={title}
                    >
                        {title}
                    </Link>

                    <div className="author">
                        <p>{author}</p>
                        <div />
                        <p>{genre}</p>
                    </div>

                    <div className="user">
                        <div className="avatar">
                            <Avatar className="size-5 bg-primary-admin text-[10px] text-white">
                                <AvatarFallback className="bg-primary-admin text-[10px] text-white">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <p>{borrowerName}</p>
                        </div>

                        <div className="borrow-date">
                            <Image
                                src="/icons/admin/calendar.svg"
                                alt="calendar"
                                width={14}
                                height={14}
                                className="object-contain"
                            />
                            <p>{formattedDate}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="shrink-0 pt-0.5">
                {status === "BORROWED" ? (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-normal">
                        Borrowed
                    </Badge>
                ) : (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-normal">
                        Returned
                    </Badge>
                )}
            </div>
        </div>
    );
}
