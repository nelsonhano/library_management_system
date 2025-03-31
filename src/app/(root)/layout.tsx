import Header from "@/components/Header";
import { ReactNode } from "react";

export default function layout({ children }: { children: ReactNode}) {
  return (
    <main className="root-container">
      <div className="mx-auto max-w-7xl text-white">
        <Header />
        <div className="mt-20 pd-20">{children}</div>
      </div>
    </main>
  )
}
