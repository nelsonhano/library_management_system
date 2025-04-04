import { SessionProvider} from "next-auth/react";
import localFont from "next/font/local";
import type { Metadata } from "next";
 
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { auth } from "../../auth";


const ibmPlexSans = localFont({
  src:[
    { path: "/fonts/IBMPlexSans-Bold.ttf", weight: "400", style: "normal" },
    { path: "/fonts/IBMPlexSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "/fonts/IBMPlexSans-Regular.ttf", weight: "600", style: "normal" },
    { path: "/fonts/IBMPlexSans-SemiBold.ttf", weight: "700", style: "normal" },
  ],
});


const babasNeue = localFont({
  src:[
    { path: "/fonts/BebasNeue-Regular.ttf", weight: "700", style: "normal" },
  ],
  variable: "--bebas-neue",
}); 

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <html lang="en">  
      <SessionProvider session={session}>
        <body className={`${ibmPlexSans.className} ${babasNeue.variable} antialiased`}>
          <main>{children}</main>
          <Toaster />
        </body>
      </SessionProvider>
    </html>
  );
}




