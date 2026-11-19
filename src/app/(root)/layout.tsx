import { redirect } from "next/navigation";
import { after } from "next/server";
import { ReactNode } from "react";
import { eq } from "drizzle-orm";
import dayjs from "dayjs";


import Header from "@/components/Header";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { auth } from "../../../auth";

export default async function layout({ children }: { children: ReactNode}) {
  const session = await auth();

  if (!session) redirect("/sign-in");

  // Keep lastActivityDate current (the onboarding workflow reads it),
  // at most one write per user per day, after the response is sent.
  after(async () => {
    if (!session?.user?.id) return;

    const today = dayjs().format("YYYY-MM-DD");

    const [user] = await db
      .select({ lastActivityDate: users.lastActivityDate })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || user.lastActivityDate === today) return;

    await db
      .update(users)
      .set({ lastActivityDate: today })
      .where(eq(users.id, session.user.id));
  });

  return (
    <main className="root-container">
      <div className="mx-auto max-w-7xl text-white">
        <Header
          session={session}
        />
        <div className="mt-20 pd-20">{children}</div>
      </div>
    </main>
  )
}
