import { Button } from "@/components/ui/button";
import { signOut } from "../../../../auth";
import BookList from "@/components/BookList";
import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { desc, eq } from "drizzle-orm";

export default async function page() {
    const latestBorrowRecords = await db
        .select({
            borrow: borrowRecords,
            book: books,
        })
        .from(borrowRecords)
        .innerJoin(books, eq(borrowRecords.bookId, books.id))
        .orderBy(desc(borrowRecords.createdAt))
        .limit(20);

return (
    <>
        <form 
            action={async () => {
                "use server";

                await signOut();
            }}
            className="mb-10"
        >
            <Button>Logout</Button>
        </form>

        <BookList
            title="Borrowed Books"
            books={latestBorrowRecords.map(record => record.book)}
            />
    </>
  )
}
