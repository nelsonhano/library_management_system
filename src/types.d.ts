interface BooksProps {
    id: string;
    title: string;
    author: string;
    genre: string;
    rating: number;
    totalCopies: number;
    availableCopies: number;
    description: string;
    coverColor: string;
    coverUrl: string;
    videoUrl: string;
    summary: string;
    isLoanedBook?: boolean;
    borrowRecordId?: string;
    dueDate?: string;
    borrowDate?: string;
    userName?: string;
    userEmail?: string;
    universityId?: number | string;
};

interface Book {
    id: string;
    title: string;
    author: string;
    genre: string;
    rating: number;
    totalCopies: number;
    availableCopies: number;
    description: string;
    coverColor: string;
    coverUrl: string;
    videoUrl: string;
    summary: string;
    createdAt: Date | null;
}

interface BookParams {
    title: string;
    author: string;
    genre: string;
    rating: number;
    coverUrl: string;
    coverColor: string;
    description: string;
    totalCopies: number;
    videoUrl: string;
    summary: string;
}

interface UpdateBookParams extends BookParams {
    id: string;
}

interface DeleteBookParams {
    bookId: string;
}

interface AuthCredentials{
    fullName: string;
    email: string;
    password: string;
    universityId: number;
    universityCard: string
}

interface BorrowBookParams {
    bookId: string;
    userId: string;
}

interface ReturnBookParams {
    recordId: string;
}

interface ChangeUserAccountStatusParams {
    userId: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
}