import { redirect } from "next/navigation";
import { ReactNode } from "react";


import Header from "@/components/Header";
import { auth } from "../../../auth";

export default async function layout({ children }: { children: ReactNode}) {
  const session = await auth();
  
  if (!session) redirect("/sign-in");
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
