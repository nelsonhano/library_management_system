"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { returnBook } from "@/lib/action/book";

interface Props {
    recordId: string;
    className?: string;
    buttonText?: string;
}

export default function ReturnBook({
    recordId,
    className,
    buttonText = "Return Book",
}: Props) {
    const router = useRouter();
    const [returning, setReturning] = useState(false);

    const handleReturn = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setReturning(true);

        try {
            const result = await returnBook({ recordId });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Book returned successfully",
                });

                router.refresh();
            } else {
                toast({
                    title: "Error returning book",
                    description: result.error ?? "Failed to return book",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error returning book",
                description: "An unexpected error occurred while returning the book",
                variant: "destructive",
            });
        } finally {
            setReturning(false);
        }
    };

    return (
        <Button
            onClick={handleReturn}
            disabled={returning}
            className={
                className ||
                "book-btn mt-2 bg-dark-600 text-light-100 hover:bg-dark-500 w-full"
            }
        >
            {returning ? "Returning..." : buttonText}
        </Button>
    );
}
