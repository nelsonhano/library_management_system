import BookOverview from "@/components/BookOverview";
import { Button } from "@/components/ui/button";
import BookList from "@/components/BookList";
import { users } from "@/database/schema";
import { sampleBooks } from "@/constants";
import { db } from "@/database/drizzle";

export default async function Home() {
  // const usersData = await db.select().from(users);
  // console.log(usersData);
  
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
