import React from "react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import BookOverview from "@/components/BookOverview";
import BookVideo from "@/components/BookVideo";
import { books } from "@/database/schema";
import { db } from "@/database/drizzle";

import { auth } from "../../../../../auth";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const id = (await params).id;
    const session = await auth();

    // Postgres throws on a malformed uuid, so reject it before querying.
    const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) notFound();

    // Fetch data based on id
    const [bookDetails] = await db
        .select()
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

    if (!bookDetails) notFound();

    return (
        <>
            <BookOverview {...bookDetails} userId={session?.user?.id as string} />

            <div className="book-details">
                <div className="flex-[1.5]">
                    <section className="flex flex-col gap-7">
                        <h3>Video</h3>

                        <BookVideo videoUrl={bookDetails.videoUrl} />
                    </section>
                    <section className="mt-10 flex flex-col gap-7">
                        <h3>Summary</h3>

                        <div className="space-y-5 text-xl text-light-100">
                            {bookDetails.summary.split("\n").map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </section>
                </div>

                {/*  SIMILAR*/}
            </div>
        </>
    );
};
export default Page;