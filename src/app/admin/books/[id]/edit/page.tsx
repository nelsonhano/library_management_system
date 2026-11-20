import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { Button } from "@/components/ui/button";
import BookForm from "@/components/admin/forms/BookForm";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: PageProps) {
    const { id } = await params;

    const isValidUuid = z.string().uuid().safeParse(id).success;
    if (!isValidUuid) {
        notFound();
    }

    const [book] = await db
        .select()
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

    if (!book) {
        notFound();
    }

    return (
        <>
            <Button asChild className="back-btn">
                <Link href="/admin/books">Go Back</Link>
            </Button>

            <section className="w-full max-w-2xl">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-dark-400">
                        Edit Book
                    </h2>
                    <p className="text-xs text-light-500">
                        Update metadata, adjust copy counts, or replace cover assets.
                    </p>
                </div>

                <BookForm type="update" book={book} />
            </section>
        </>
    );
}
