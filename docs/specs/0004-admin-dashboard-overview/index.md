# 0004. Admin dashboard overview and analytics

**Date**: 2026-11-20
**Status**: Accepted

## Summary

This decision defines how administrators monitor library operations from the central dashboard at `/admin`. The current empty placeholder page is replaced with an interactive administration overview featuring key metric cards and recent activity feeds. Four primary summary cards track Total Books, Active Borrowed Books, Total Users, and Pending Account Requests, each serving as an interactive deep link to its respective management section. Below the metrics, a two column responsive layout displays Recently Added Books with an Add New Book banner and View All link on the left, and Recent Borrow Records with student details, loan status badges, and View All link on the right.

## Requirements

**User stories**:
* As an administrator, I want to see summary counts of total books, active loans, registered students, and pending account requests so that I understand current library usage at a glance.
* As an administrator, I want summary metric cards to link directly to their corresponding management sections so that I can drill into details quickly.
* As an administrator, I want to see recently added books alongside a quick action to add new books so that I can track catalog growth and manage additions efficiently.
* As an administrator, I want to see the latest borrowing activity showing book covers, borrower names, and dates so that I can monitor active student loans.

**Acceptance criteria**:
* **AC-1**: An authenticated administrator accessing `/admin` views top level summary metric cards for Total Books, Borrowed Books, Total Users, and Pending Account Requests, with numeric counts queried from the database.
* **AC-2**: Each summary metric card acts as an interactive deep link navigating to its designated administrative section: Total Books links to `/admin/books`, Borrowed Books links to `/admin/borrow-records`, Total Users links to `/admin/users`, and Pending Account Requests links to `/admin/account-requests`.
* **AC-3**: The dashboard renders a two column responsive layout below the metric cards, placing Recently Added Books on the left and Recent Borrow Records on the right.
* **AC-4**: The Recently Added Books section displays up to 5 recently added books with cover thumbnails, title, author, genre, creation date, a quick action banner to "+ Add New Book" linking to `/admin/books/new`, and a "View All" link pointing to `/admin/books`.
* **AC-5**: The Recent Borrow Records section displays a feed of up to 6 recent borrowing events showing book cover thumbnail, title, author, borrower student name, avatar initials derived via `getInitials(user.fullName)` with fallback to `"UN"`, borrow date formatted as `MMM DD, YYYY`, and loan status badge (`BORROWED` in amber `bg-amber-100 text-amber-800` and `RETURNED` in emerald `bg-emerald-100 text-emerald-800`).
* **AC-6**: The Recent Borrow Records section provides a "View All" link directing the administrator to `/admin/borrow-records`.
* **AC-7**: When catalog counts or borrow records are zero, cards display `0` and feeds display clean empty state messaging: `"No books in catalog yet"` for books with an Add Book button, and `"No recent borrow records"` with subtitle `"Student book loans will appear here."` for borrow records.
* **AC-8**: All dashboard counts and feeds are loaded on the server via parallel database queries using `Promise.all` with typed integer counts `sql<number>count(*)::int` without client side fetching waterfalls.
* **AC-9**: Route level access control is enforced at the admin layout boundary (`src/app/admin/layout.tsx`), redirecting unauthenticated users to `/sign-in` and non admin accounts to `/`.
* **AC-10**: An administrative error boundary at `src/app/admin/error.tsx` catches unexpected query failures using `.error-fallback` styling, providing a retry button.

## Decision

**Chosen option**: Option 1: Server rendered composite dashboard with parallel database aggregation and deep link metric cards.

We will build the admin dashboard at `src/app/admin/page.tsx` as an authenticated Server Component executing parallel queries across `books`, `users`, and `borrow_records`, utilizing `StatCard.tsx`, `BookStripe.tsx`, `RecentBooks.tsx`, and an administrative error boundary `src/app/admin/error.tsx`.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:
Reuses existing database tables without schema modifications:
* `books`: `id`, `title`, `author`, `genre`, `coverUrl`, `coverColor`, `totalCopies`, `availableCopies`, `createdAt`.
* `borrow_records`: `id`, `bookId`, `userId`, `status`, `borrowDate`, `createdAt`.
* `users`: `id`, `fullName`, `email`, `role`, `status`, `createdAt`.

**Component interfaces**:
```ts
export interface StatCardProps {
    title: string;
    count: number;
    icon: string;
    href?: string;
}

export interface BookStripeProps {
    id: string;
    bookId: string;
    title: string;
    author: string;
    genre: string;
    coverColor: string;
    coverUrl: string;
    borrowDate: Date | string | null;
    status: "BORROWED" | "RETURNED";
    borrowerName: string;
    borrowerEmail?: string;
}

export interface RecentBooksProps {
    books: {
        id: string;
        title: string;
        author: string;
        genre: string;
        coverColor: string;
        coverUrl: string;
        createdAt: Date | string | null;
    }[];
}
```

**API surface**:
| Endpoint / Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/admin` | GET (Page) | Session cookie | HTML containing 4 metric cards, Recent Books list, and Recent Borrow Records feed | Authenticated ADMIN | 401 Unauthorized (redirect to `/sign-in`), 403 Forbidden (redirect to `/`) |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| `/admin` | Total Books count | Database query `select({ count: sql<number>count(*)::int }).from(books)` with icon `/icons/admin/book.svg` |
| `/admin` | Borrowed Books count | Database query `select({ count: sql<number>count(*)::int }).from(borrowRecords).where(eq(borrowRecords.status, 'BORROWED'))` with icon `/icons/admin/bookmark.svg` |
| `/admin` | Total Users count | Database query `select({ count: sql<number>count(*)::int }).from(users).where(eq(users.role, 'USER'))` with icon `/icons/admin/users.svg` |
| `/admin` | Pending Account Requests count | Database query `select({ count: sql<number>count(*)::int }).from(users).where(and(eq(users.role, 'USER'), eq(users.status, 'PENDING')))` with icon `/icons/admin/user.svg` |
| `/admin` | Recently Added Books list | Database query on `books` ordered by `desc(books.createdAt)` with `limit(5)` |
| `/admin` | Recent Borrow Records feed | Database join between `borrowRecords`, `books`, and `users`, ordered by `desc(borrowRecords.createdAt)` with `limit(6)` |

**Key invariants**:
* Only users with `role === 'ADMIN'` can access the dashboard route, enforced at layout level.
* Metric counts never display negative numbers or null states (fallback to 0).
* Recent borrow records correctly associate book metadata and student names through relational joins.
* Dates are consistently formatted as `MMM DD, YYYY`.
* In transient query failures, `src/app/admin/error.tsx` renders a graceful recovery view with retry button.

**Security model**:
* Protected at route level by `src/app/admin/layout.tsx`. Unauthenticated users are redirected to `/sign-in` and non admin accounts are redirected to `/`.

**Critical test scenarios**:
* Happy path dashboard overview: Administrator accesses `/admin` and sees all 4 metric cards with accurate numbers and recent feeds populated, verifies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-8**.
* Metric card deep link navigation: Clicking on each metric card navigates to the correct target URL, verifies **AC-2**.
* Quick action book creation: Clicking "+ Add New Book" navigates to `/admin/books/new`, verifies **AC-4**.
* View all navigation: Clicking "View All" on recent books navigates to `/admin/books`, and on borrow records navigates to `/admin/borrow-records`, verifies **AC-4**, **AC-6**.
* Zero state handling: When database contains zero records, cards display 0 and feeds display friendly empty messages, verifies **AC-7**.
* Error boundary fallback: When an unhandled error occurs during rendering, `src/app/admin/error.tsx` displays error styling and retry option, verifies **AC-10**.
* Unauthorized protection: Non admin or anonymous callers are redirected away, verifies **AC-9**.

## Build plan

1. Create `StatCard.tsx` component in `src/components/admin/StatCard.tsx` rendering title, count, icon, and optional navigation link wrapper, satisfies **AC-1**, **AC-2**.
2. Create `BookStripe.tsx` component in `src/components/admin/BookStripe.tsx` rendering book details, cover thumbnail, student borrower metadata, borrow date, and loan status badge, satisfies **AC-5**.
3. Create `RecentBooks.tsx` component in `src/components/admin/RecentBooks.tsx` with "+ Add New Book" CTA banner, compact catalog items, and "View All" link, satisfies **AC-4**.
4. Create admin error boundary in `src/app/admin/error.tsx` using `.error-fallback` styling and retry trigger, satisfies **AC-10**.
5. Assemble `/admin` server component in `src/app/admin/page.tsx` with parallel typed database queries (`Promise.all`), two column responsive layout, empty states, and view all links, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.
6. Write unit and component tests in `src/components/admin/StatCard.test.tsx`, `src/components/admin/BookStripe.test.tsx`, `src/components/admin/RecentBooks.test.tsx`, and `src/app/admin/page.test.tsx`, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-7**, **AC-10**.

## Consequences

**Positive**:
* Administrators gain an immediate operational pulse over library books, students, and active loans.
* Reuses existing CSS classes in `src/styles/admin.css` for instant visual polish.
* Server side parallel execution guarantees zero layout shifts and fast load times.
* Summary cards double as navigation shortcuts across management sections.
* Dedicated error boundary prevents transient database blips from unmounting the admin layout.

**Negative / tradeoffs**:
* Real time updates require page refresh or navigation (no automatic websocket polling in initial release).

**Neutral**:
* The dashboard depends on `src/app/admin/layout.tsx` for layout framing and session authorization.
