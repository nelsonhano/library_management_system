import React from "react";
import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books, borrowRecords, users } from "@/database/schema";
import StatCard from "@/components/admin/StatCard";
import RecentBooks from "@/components/admin/RecentBooks";
import BookStripe from "@/components/admin/BookStripe";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
    const [
        totalBooksResult,
        totalUsersResult,
        borrowedBooksResult,
        pendingRequestsResult,
        recentBooks,
        recentBorrowRecords,
    ] = await Promise.all([
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(books),

        db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(eq(users.role, "USER")),

        db
            .select({ count: sql<number>`count(*)::int` })
            .from(borrowRecords)
            .where(eq(borrowRecords.status, "BORROWED")),

        db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(
                and(
                    eq(users.role, "USER"),
                    eq(users.status, "PENDING")
                )
            ),

        db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                genre: books.genre,
                coverColor: books.coverColor,
                coverUrl: books.coverUrl,
                createdAt: books.createdAt,
            })
            .from(books)
            .orderBy(desc(books.createdAt))
            .limit(5),

        db
            .select({
                id: borrowRecords.id,
                bookId: borrowRecords.bookId,
                status: borrowRecords.status,
                borrowDate: borrowRecords.borrowDate,
                createdAt: borrowRecords.createdAt,
                bookTitle: books.title,
                bookAuthor: books.author,
                bookGenre: books.genre,
                bookCoverColor: books.coverColor,
                bookCoverUrl: books.coverUrl,
                userName: users.fullName,
                userEmail: users.email,
            })
            .from(borrowRecords)
            .innerJoin(books, eq(borrowRecords.bookId, books.id))
            .innerJoin(users, eq(borrowRecords.userId, users.id))
            .orderBy(desc(borrowRecords.createdAt))
            .limit(6),
    ]);

    const totalBooks = totalBooksResult[0]?.count ?? 0;
    const totalUsers = totalUsersResult[0]?.count ?? 0;
    const borrowedBooks = borrowedBooksResult[0]?.count ?? 0;
    const pendingRequests = pendingRequestsResult[0]?.count ?? 0;

    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-5">
                <StatCard
                    title="Total Books"
                    count={totalBooks}
                    icon="/icons/admin/book.svg"
                    href="/admin/books"
                />
                <StatCard
                    title="Borrowed Books"
                    count={borrowedBooks}
                    icon="/icons/admin/bookmark.svg"
                    href="/admin/borrow-records"
                />
                <StatCard
                    title="Total Users"
                    count={totalUsers}
                    icon="/icons/admin/users.svg"
                    href="/admin/users"
                />
                <StatCard
                    title="Account Requests"
                    count={pendingRequests}
                    icon="/icons/admin/user.svg"
                    href="/admin/account-requests"
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:w-1/2">
                    <RecentBooks books={recentBooks} />
                </div>

                <div className="w-full lg:w-1/2 flex flex-col rounded-2xl bg-white p-7">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-dark-400">
                            Recent Borrow Requests
                        </h3>
                        <Button asChild className="view-btn">
                            <Link href="/admin/borrow-records">View All</Link>
                        </Button>
                    </div>

                    {recentBorrowRecords.length === 0 ? (
                        <div className="mt-7 flex min-h-40 flex-col items-center justify-center rounded-xl border border-light-400 bg-light-300/40 p-6 text-center">
                            <p className="font-semibold text-dark-300">
                                No recent borrow records
                            </p>
                            <p className="mt-1 text-xs text-light-500">
                                Student book loans will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-7 flex flex-col gap-3">
                            {recentBorrowRecords.map((record) => (
                                <BookStripe
                                    key={record.id}
                                    id={record.id}
                                    bookId={record.bookId}
                                    title={record.bookTitle}
                                    author={record.bookAuthor}
                                    genre={record.bookGenre}
                                    coverColor={record.bookCoverColor}
                                    coverUrl={record.bookCoverUrl}
                                    borrowDate={record.borrowDate}
                                    status={record.status}
                                    borrowerName={record.userName}
                                    borrowerEmail={record.userEmail}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
