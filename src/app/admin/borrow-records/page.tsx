import React from "react";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books, borrowRecords, users } from "@/database/schema";
import BorrowRecordTable from "@/components/admin/BorrowRecordTable";
import BorrowRecordSearchFilter from "@/components/admin/BorrowRecordSearchFilter";
import Pagination from "@/components/admin/Pagination";

interface PageProps {
    searchParams: Promise<{
        query?: string;
        status?: string;
        page?: string;
    }>;
}

export default async function AdminBorrowRecordsPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.query?.trim() || "";
    const rawStatus = resolvedParams.status?.trim()?.toUpperCase() || "ALL";
    const status =
        rawStatus === "BORROWED" ||
        rawStatus === "RETURNED" ||
        rawStatus === "OVERDUE"
            ? rawStatus
            : "ALL";

    const rawPage = parseInt(resolvedParams.page || "1", 10);
    const requestedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const conditions = [];

    if (query) {
        const searchPattern = `%${query}%`;
        const numQuery = parseInt(query, 10);

        if (!isNaN(numQuery) && String(numQuery) === query) {
            conditions.push(
                or(
                    ilike(books.title, searchPattern),
                    ilike(books.author, searchPattern),
                    ilike(users.fullName, searchPattern),
                    ilike(users.email, searchPattern),
                    eq(users.universityId, numQuery)
                )
            );
        } else {
            conditions.push(
                or(
                    ilike(books.title, searchPattern),
                    ilike(books.author, searchPattern),
                    ilike(users.fullName, searchPattern),
                    ilike(users.email, searchPattern)
                )
            );
        }
    }

    if (status === "BORROWED") {
        conditions.push(eq(borrowRecords.status, "BORROWED"));
    } else if (status === "RETURNED") {
        conditions.push(eq(borrowRecords.status, "RETURNED"));
    } else if (status === "OVERDUE") {
        conditions.push(
            and(
                eq(borrowRecords.status, "BORROWED"),
                sql`${borrowRecords.dueDate} < CURRENT_DATE`
            )
        );
    }

    const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(borrowRecords)
        .innerJoin(books, eq(borrowRecords.bookId, books.id))
        .innerJoin(users, eq(borrowRecords.userId, users.id))
        .where(whereClause);
    const totalRecords = countResult?.count ?? 0;

    const limit = 10;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const currentPage = Math.max(1, Math.min(requestedPage, totalPages));
    const offset = (currentPage - 1) * limit;

    const rawRecords = await db
        .select({
            id: borrowRecords.id,
            borrowDate: borrowRecords.borrowDate,
            dueDate: borrowRecords.dueDate,
            returnDate: borrowRecords.returnDate,
            status: borrowRecords.status,
            createdAt: borrowRecords.createdAt,
            book: {
                id: books.id,
                title: books.title,
                author: books.author,
                genre: books.genre,
                coverUrl: books.coverUrl,
                coverColor: books.coverColor,
            },
            user: {
                id: users.id,
                fullName: users.fullName,
                email: users.email,
                universityId: users.universityId,
            },
        })
        .from(borrowRecords)
        .innerJoin(books, eq(borrowRecords.bookId, books.id))
        .innerJoin(users, eq(borrowRecords.userId, users.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(borrowRecords.borrowDate));

    return (
        <section className="w-full space-y-6 rounded-2xl bg-white p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-dark-400">
                        Borrow Records
                    </h2>
                    <p className="text-xs text-light-500">
                        Monitor all active and historical book loans, track overdue returns, and issue receipts.
                    </p>
                </div>
            </div>

            <BorrowRecordSearchFilter
                initialQuery={query}
                initialStatus={status}
            />

            <BorrowRecordTable records={rawRecords} />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalRecords}
                limit={limit}
                baseUrl="/admin/borrow-records"
                query={query}
                status={status}
                itemLabel="records"
            />
        </section>
    );
}
