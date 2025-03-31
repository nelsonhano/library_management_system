import BookList from "@/components/BookList";
import BookOverview from "@/components/BookOverview";
import { Button } from "@/components/ui/button";
import { sampleBooks } from "@/constants";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";

export default async function Home() {
  const usersData = await db.select().from(users);
  console.log(usersData);
  
  return (
    <main>
      <BookOverview {...sampleBooks[0]}/>

      <BookList 
        title="Latest Books"
        books={sampleBooks}
        containerClassName="mt-28"
      />
    </main>
  );
}
