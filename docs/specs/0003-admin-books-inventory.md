# 0003. Admin books inventory table and catalog management

**Date**: 2026-11-20
**Status**: Accepted

## Summary

This decision defines how administrators inspect, search, paginate, edit, and delete library books at `/admin/books`. The current placeholder text is replaced with an interactive inventory table displaying book covers, metadata, stock levels, and administrative actions. Server side pagination and search controls allow librarians to filter titles by text query and genre. Each title supports direct links to view the public book page, edit metadata at `/admin/books/[id]/edit`, and delete the record with confirmation, protected by a safety invariant preventing deletion of books with active student loans and handling historical returned loan records cleanly in an atomic transaction.

## Context

BookWise allows administrators to add new books at `/admin/books/new`. However, once created, the inventory index at `/admin/books` renders only a placeholder paragraph, preventing librarians from browsing the catalog, checking available versus total copies, modifying incorrect metadata, or removing decommissioned books.

Furthermore, book deletion must be carefully managed. If an administrator deletes a book that is currently borrowed by students, foreign key constraints in the database or student profile references will fail. Additionally, historical borrow records referencing returned books must be cleanly handled so database foreign key violations do not crash the application. The system needs an inventory management interface with server side pagination, search filtering, edit capabilities, and safe mutation actions.

## Requirements

**User stories**:
- As an administrator, I want to view all catalog books in an organized table so that I can monitor stock levels and copy availability across the library.
- As an administrator, I want to search books by title or author and filter by genre so that I can quickly find specific titles in a growing catalog.
- As an administrator, I want to edit existing book information so that I can adjust descriptions, total copies, or cover assets without re-creating titles.
- As an administrator, I want to safely delete decommissioned books while being protected against deleting books with active student loans.

**Acceptance criteria**:
- **AC-1**: An authenticated administrator can view the library books inventory at `/admin/books`, with table columns displaying book cover thumbnail, title, author, genre, stock levels (available versus total copies), creation date formatted as `MMM DD, YYYY`, and administrative action buttons.
- **AC-2**: The inventory table supports server side pagination displaying 10 books per page with Previous and Next controls driven by URL query parameter `?page=N`, clamping out of bounds page numbers gracefully.
- **AC-3**: The table supports title and author search via URL query parameter `?query=...`, filtering catalog books dynamically and resetting to page 1 on new searches.
- **AC-4**: The table supports genre category filtering via URL query parameter `?genre=...`, with dropdown choices dynamically queried from distinct catalog genres plus an All Genres option.
- **AC-5**: Each book row provides an action linking to the public book page at `/books/[id]`.
- **AC-6**: Each book row provides an edit action linking to the edit page at `/admin/books/[id]/edit`.
- **AC-7**: The administrator can edit book details and total copy counts via `updateBook` server action at `/admin/books/[id]/edit`, with `BookForm` prefilling current values, updating copy availability safely, and revalidating catalog paths.
- **AC-8**: Attempting to reduce a book's `totalCopies` below the current count of active borrowed loans is rejected with a descriptive error message.
- **AC-9**: Each book row provides a delete action with a confirmation alert dialog to prevent accidental clicks.
- **AC-10**: When an administrator attempts to delete a book, `deleteBook` server action verifies that no active borrow records exist (`status = 'BORROWED'`). If active loans exist, deletion is rejected with an error message.
- **AC-11**: When a book with zero active loans is deleted, historical returned records are cleaned up and the book is deleted within an atomic database transaction, revalidating catalog paths.
- **AC-12**: Non administrator users or unauthenticated callers are rejected at route level by the admin layout redirect and at server action level with a structured unauthorized error payload.

## Options considered

### Option 1: Interactive server-paginated table with URL search parameters and loan safety guards (Chosen)

Build `/admin/books` with URL driven pagination (`?page=N`), search queries (`?query=...`), genre filters (`?genre=...`), dedicated edit route `/admin/books/[id]/edit`, and `deleteBook` server action with active loan validation and transaction cleanup.

**Pros**:
- URL driven state makes table searches and pagination shareable, refresh safe, and bookmarkable.
- Server side pagination scales smoothly as the book catalog grows.
- Active loan checks and transaction cleanup prevent database constraint crashes and protect active student loan histories.
- Reuses existing `books` and `borrow_records` schema without requiring any database migrations.

**Cons**:
- Requires creating an edit route, updating `BookForm` for edit mode, and building a delete confirmation component.

### Option 2: Client side filtered table without pagination

Fetch all catalog books into the browser and use client side search and array slicing.

**Pros**:
- Faster immediate tab clicks on small catalogs.

**Cons**:
- Degrades performance and wastes bandwidth as the library catalog grows into hundreds or thousands of books.
- Lacks URL bookmarkability for specific search queries.

## Decision

**Chosen option**: Option 1: Interactive server-paginated table with URL search parameters and loan safety guards.

We will build the inventory table at `/admin/books` with URL search parameter state, implement `deleteBook` and `updateBook` in `src/lib/admin/actions/book.ts`, update `BookForm.tsx` to handle both create and edit modes, and create the edit page at `/admin/books/[id]/edit`.

## Rationale

URL driven search parameters match the architectural pattern established in account requests, providing scalable server rendering and clean browser history. Active loan verification ensures operational safety before any deletion takes place, while transaction cleanup ensures historical records do not trigger foreign key constraint errors.

## Feature design

**Data model sketch**:
Reuses existing tables in `src/database/schema.ts` without changes:
- `books`: `id` (uuid primary key), `title` (varchar 255), `author` (varchar 255), `genre` (text), `rating` (integer), `totalCopies` (integer), `availableCopies` (integer), `coverUrl` (text), `coverColor` (varchar 7), `description` (text), `videoUrl` (text), `summary` (varchar), `createdAt` (timestamp).
- `borrow_records`: `id` (uuid), `bookId` (uuid foreign key referencing `books.id`), `status` (`BORROWED` | `RETURNED`).

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `updateBook` | Server Action | `params: { id: string } & BookParams` | `{ success: boolean, message?: string, error?: string, data?: Book }` | Authenticated ADMIN | Unauthorized (401), Book not found (404), Total copies below active loans (400), Invalid book data (400) |
| `deleteBook` | Server Action | `params: { bookId: string }` | `{ success: boolean, message?: string, error?: string }` | Authenticated ADMIN | Unauthorized (401), Active loans exist (400), Book not found (404) |

**Validation schemas** (in `src/lib/validation.ts`):
```ts
export const updateBookSchema = bookSchema.extend({
  id: z.string().uuid(),
});

export const deleteBookSchema = z.object({
  bookId: z.string().uuid(),
});
```

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| `/admin/books` | Books page slice | Database query on `books` table with `limit(10)` and `offset((page - 1) * 10)`, ordered by `desc(books.createdAt)` |
| `/admin/books` | Total books count and page count | Database `count(*)` on `books` matching active search and genre filters |
| `/admin/books` | Distinct genre choices | Database query `selectDistinct({ genre: books.genre }).from(books).orderBy(books.genre)` |
| `/admin/books` | Search filter query | URL parameter `searchParams.query`, filtered via `ilike` against title and author |
| `/admin/books` | Genre filter | URL parameter `searchParams.genre`, filtered via `eq` against genre |
| `updateBook` | Caller permission | Session cookie verified via `auth()`, checked against `users.role === 'ADMIN'` |
| `updateBook` | Available copies calculation | `params.totalCopies - activeLoansCount` where active loans is counted from `borrow_records` |
| `deleteBook` | Active loan check | Query on `borrow_records` where `bookId = params.bookId` and `status = 'BORROWED'` |
| `deleteBook` | Historical loan cleanup | `tx.delete(borrowRecords).where(eq(borrowRecords.bookId, bookId))` within deletion transaction |

**Key invariants**:
- Only authenticated users with `role === 'ADMIN'` can access inventory views and invoke update or deletion actions.
- A book cannot be deleted while any borrow record carries `status = 'BORROWED'`.
- Deleting a book with zero active loans removes any historical `RETURNED` records inside an atomic transaction before removing the book.
- When updating total copies, `totalCopies` cannot be set lower than the current count of active borrowed loans.
- Updating or deleting a book revalidates `/admin/books`, `/books/[id]`, `/library`, and `/`.
- Navigating to `/admin/books/[id]/edit` with a non-existent or invalid UUID triggers Next.js `notFound()`.

**Security model**:
- Route level security: `src/app/admin/layout.tsx` guards the admin path.
- Server action level security: `deleteBook` and `updateBook` independently verify session credentials and database `ADMIN` role.

**Critical test scenarios**:
- Happy path pagination and search: Querying page 2 or filtering by title returns expected book slice, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
- Happy path book edit: Administrator updates book details and copy counts via `updateBook`, updating database and revalidating paths, verifies **AC-6**, **AC-7**.
- Total copies reduction guard: Attempting to reduce total copies below active loans rejects with error, verifies **AC-8**.
- Safe book deletion: Administrator deletes a book with zero active loans, cleaning up returned records and deleting book, verifies **AC-9**, **AC-11**.
- Deletion blocked by active loan: Administrator attempts to delete a book currently borrowed by a student, action rejects with active loan error message, verifies **AC-10**.
- Unauthorized protection: Non admin user or anonymous caller is rejected with error, verifies **AC-12**.

## Build plan

1. Define `updateBookSchema` and `deleteBookSchema` in `src/lib/validation.ts`, satisfies **AC-7**, **AC-10**, **AC-11**.
2. Implement `updateBook` and `deleteBook` server actions in `src/lib/admin/actions/book.ts` with admin session checks, active loan minimum guard, atomic transaction cleanup on deletion, and path revalidation, satisfies **AC-7**, **AC-8**, **AC-10**, **AC-11**, **AC-12**.
3. Write unit tests in `src/lib/admin/actions/book.test.ts` covering book updates, copy count guards, safe deletion with transaction cleanup, deletion rejection with active loans, and unauthorized callers, satisfies **AC-7**, **AC-8**, **AC-10**, **AC-11**, **AC-12**.
4. Refactor `BookForm.tsx` in `src/components/admin/forms/BookForm.tsx` to support both create and edit modes with prefilled default values and conditional action dispatch, satisfies **AC-6**, **AC-7**.
5. Create `DeleteBookButton.tsx` in `src/components/admin/DeleteBookButton.tsx` with confirmation alert dialog, loading feedback, and toast notification, satisfies **AC-9**, **AC-11**.
6. Create `BookTable.tsx` in `src/components/admin/BookTable.tsx` displaying book rows, cover thumbnail, stock badges, formatted dates, view link, edit link, and delete button, satisfies **AC-1**, **AC-5**, **AC-6**, **AC-9**.
7. Build `/admin/books/page.tsx` with search input, dynamic genre dropdown, server side pagination controls, and books table, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
8. Build `/admin/books/[id]/edit/page.tsx` querying book data with 404 handling and passing to `BookForm`, satisfies **AC-6**, **AC-7**.
9. Write component tests for `BookTable`, `DeleteBookButton`, and `BookForm` edit mode, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-9**.

## Consequences

**Positive**:
- Administrators have full inventory oversight with copy availability and stock counts.
- Search, dynamic genre filtering, and pagination keep the catalog performant and easy to navigate.
- Atomic transaction cleanup prevents foreign key violations while protecting active student loan records.
- Total copy reduction guards prevent negative inventory states.

**Negative / tradeoffs**:
- Deleting a book with active loans requires waiting until all copies are returned.

**Neutral**:
- Catalog updates immediately reflect across both student library views and administrative dashboards.
