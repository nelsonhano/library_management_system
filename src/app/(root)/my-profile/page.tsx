import { Button } from "@/components/ui/button";
import { signOut } from "../../../../auth";
import BookList from "@/components/BookList";
import { db } from "@/database/drizzle";
import { books, borrowRecords, users } from "@/database/schema";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "../../../../auth";
import dayjs from "dayjs";

export default async function page() {
    const session = await auth();

    const [userRecord] = session?.user?.id
        ? await db
            .select({
                fullName: users.fullName,
                email: users.email,
                universityId: users.universityId,
            })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1)
        : [null];

    const latestBorrowRecords = await db
        .select({
            borrow: borrowRecords,
            book: books,
        })
        .from(borrowRecords)
        .innerJoin(books, eq(borrowRecords.bookId, books.id))
        .where(
            and(
                eq(borrowRecords.userId, session?.user?.id as string),
                eq(borrowRecords.status, "BORROWED")
            )
        )
        .orderBy(desc(borrowRecords.createdAt))
        .limit(20);

    const borrowedBooks: BooksProps[] = latestBorrowRecords.map(({ book, borrow }) => ({
        ...book,
        isLoanedBook: true,
        borrowRecordId: borrow.id,
        dueDate: borrow.dueDate,
        borrowDate: borrow.borrowDate ? dayjs(borrow.borrowDate).format("YYYY-MM-DD") : undefined,
        userName: userRecord?.fullName || session?.user?.name || undefined,
        userEmail: userRecord?.email || session?.user?.email || undefined,
        universityId: userRecord?.universityId || undefined,
    }));

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

            {borrowedBooks.length > 0 ? (
                <BookList
                    title="Borrowed Books"
                    books={borrowedBooks}
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="font-bebas-neue text-3xl text-light-100">
                        No active borrowed books
                    </p>
                    <p className="mt-2 text-sm text-light-200">
                        When you borrow a book from the library, it will show up here.
                    </p>
                </div>
            )}
        </>
    );
}
