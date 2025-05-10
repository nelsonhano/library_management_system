import BookOverview from "@/components/BookOverview";
import BookList from "@/components/BookList";
import { books } from "@/database/schema";
import { db } from "@/database/drizzle";
import { auth } from "../../../auth";
import { desc } from "drizzle-orm";

export default async function Home() {
  const session = await auth();

  const latestBooks = (await db
    .select()
    .from(books)
    .limit(20)
    .orderBy(desc(books.createdAt))
  ) as Book[]
  
  return (
    <main>
      <BookOverview 
        {...latestBooks[0]}
        userId={session?.user?.id as string}
      />

      <BookList 
        title="Latest Books"
        books={latestBooks.slice(1)}
        containerClassName="mt-28"
      />
    </main>
  );
}
