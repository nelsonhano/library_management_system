import React from "react";
import Link from "next/link";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { Button } from "@/components/ui/button";
import BookTable from "@/components/admin/BookTable";
import BookSearchFilter from "@/components/admin/BookSearchFilter";
import BookPagination from "@/components/admin/BookPagination";

interface PageProps {
    searchParams: Promise<{
        query?: string;
        genre?: string;
        page?: string;
    }>;
}

export default async function AdminBooksPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.query?.trim() || "";
    const genre = resolvedParams.genre?.trim() || "ALL";
    const rawPage = parseInt(resolvedParams.page || "1", 10);
    const requestedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const genreRecords = await db
        .selectDistinct({ genre: books.genre })
        .from(books)
        .orderBy(books.genre);
    const genres = genreRecords
        .map((r) => r.genre)
        .filter((g): g is string => Boolean(g));

    const conditions = [];
    if (query) {
        const searchPattern = `%${query}%`;
        conditions.push(
            or(
                ilike(books.title, searchPattern),
                ilike(books.author, searchPattern)
            )
        );
    }
    if (genre && genre !== "ALL") {
        conditions.push(eq(books.genre, genre));
    }

    const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(books)
        .where(whereClause);
    const totalBooks = countResult?.count ?? 0;

    const limit = 10;
    const totalPages = Math.max(1, Math.ceil(totalBooks / limit));
    const currentPage = Math.max(1, Math.min(requestedPage, totalPages));
    const offset = (currentPage - 1) * limit;

    const bookList = await db
        .select()
        .from(books)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(books.createdAt));

    return (
        <section className="w-full space-y-6 rounded-2xl bg-white p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-dark-400">All Books</h2>
                    <p className="text-xs text-light-500">
                        Manage your library catalog, monitor stock levels, and edit book details.
                    </p>
                </div>

                <Button className="bg-primary-admin hover:bg-primary-admin/90" asChild>
                    <Link href="/admin/books/new">+ Create a New Book</Link>
                </Button>
            </div>

            <BookSearchFilter
                initialQuery={query}
                initialGenre={genre}
                genres={genres}
            />

            <BookTable books={bookList} />

            <BookPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalBooks={totalBooks}
                limit={limit}
                query={query}
                genre={genre}
            />
        </section>
    );
}
