"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { deleteBook } from "@/lib/admin/actions/book";
import { Trash2 } from "lucide-react";

interface DeleteBookButtonProps {
    bookId: string;
    bookTitle: string;
}

export default function DeleteBookButton({
    bookId,
    bookTitle,
}: DeleteBookButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteBook({ bookId });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Book deleted successfully",
                });
                setOpen(false);
                router.refresh();
            } else {
                toast({
                    title: "Delete failed",
                    description:
                        result.error || result.message || "Failed to delete book",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Unexpected error",
                description: "An unexpected error occurred while deleting the book",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    aria-label={`Delete ${bookTitle}`}
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Book</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{bookTitle}&quot;? This action
                        cannot be undone. Books with active student loans cannot be deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-rose-600 text-white hover:bg-rose-700"
                    >
                        {isDeleting ? "Deleting..." : "Delete Book"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
