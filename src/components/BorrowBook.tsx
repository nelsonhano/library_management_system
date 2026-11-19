"use client";

import Image from 'next/image'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { borrowBook } from '@/lib/action/book';

interface Props {
    bookId: string;
    userId: string;
    borrowingEligibility: {
        isEligible: boolean;
        message: string
    };
}
export default function BorrowBook({
    bookId,
    borrowingEligibility:
    { isEligible, message }
}: Props) {
    const router = useRouter();
    const [ borrowing, setBorrowing ] = useState(false);

    const handleBorrow = async () => {
        if (!isEligible) {
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });

            return;
        };

        setBorrowing(true);

        try {
            const result = await borrowBook({ bookId });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Book borrowed successfully"
                });

                router.push("/my-profile");
            } else {
                toast({
                    title: "Error",
                    description: result.error ?? "An error occurred while borrowing the book",
                    variant: "destructive"
                });
            };

        } catch {
            toast({
                title: "Error",
                description: "An error occurred while borrowing the book",
                variant: "destructive"
            });
        } finally {
            setBorrowing(false);
        }
    }
  return (
    <Button 
        className="book-overview_btn"
        onClick={handleBorrow}
        disabled={borrowing}
    >
        <Image 
          src="/icons/book.svg"
          alt="book"
          width={20}
          height={20}
        />
          <p 
            className="font-bebas-neue text-xl text-dark-100"
          >{borrowing ? "Borrowing ..." : "Borrow Book"}</p>
     </Button>
  )
}
