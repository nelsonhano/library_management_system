# 0001. Book return flow

**Date**: 2026-11-20
**Status**: Accepted

## Summary

This decision defines how students and administrators return borrowed library books. When a return is submitted, the system verifies authorization, marks the loan record as returned with today's date, and atomically increments available copies in the catalog. Students can trigger returns directly from their profile page with immediate visual feedback, while administrators can process returns from administrative record lists.

## Context

BookWise lets students borrow books, which decreases available copies and records an active loan in the database. Without a return flow, borrowed books stay on student profiles forever, and available inventory remains permanently depleted.

The database schema already contains the necessary fields (`returnDate` on borrow records, `status` enum including `RETURNED`, and `availableCopies` on books). We need to implement the backend action, authorization rules, and user interface controls to complete the lending cycle.

## Requirements

**User stories**:
- As a student, I want to return a book from my profile page so that my active loan is cleared and the book becomes available for other readers.
- As an administrator, I want to process book returns so that in-person book drop-offs can be recorded accurately.

**Acceptance criteria**:
- **AC-1**: An authenticated student can return a book they currently borrow by submitting its borrow record identifier.
- **AC-2**: An authenticated administrator can return any active loan record regardless of who borrowed it.
- **AC-3**: When a return succeeds, the borrow record status changes from `BORROWED` to `RETURNED`, and `returnDate` is recorded as the current date.
- **AC-4**: When a return succeeds, the book's `availableCopies` count is atomically incremented by 1 in the books table.
- **AC-5**: Submitting a return for a record that is already `RETURNED` fails gracefully without incrementing available copies a second time.
- **AC-6**: Submitting a return for a record belonging to another user fails with an unauthorized error when called by a non admin student.
- **AC-7**: The student profile displays a Return Book button on active loans with loading state while the action runs and toast feedback upon completion.
- **AC-8**: After a return succeeds, the profile list updates so the returned title is removed from the active loans view or visually marked as returned.

## Options considered

### Option 1: Self service student return with administrator capability (Chosen)

Students click Return Book on their active borrowed books in the profile page, and librarians can also mark returns from the admin dashboard. The server action verifies identity from the session cookie, updates the loan record, and increments available inventory in a single atomic transaction.

**Pros**:
- Fast and convenient for users of digital and hybrid libraries.
- Closes the borrowing loop immediately without requiring complex desk check-in hardware.
- Reuses existing session security and atomic SQL patterns already present in the borrow action.

**Cons**:
- Does not enforce physical verification of the book before digital return unless verified by library staff.

### Option 2: Administrator only physical return logging

Students bring physical copies to a library desk, and only administrators or librarians can search the loan record and mark it returned.

**Pros**:
- Ensures physical item possession before inventory is replenished.

**Cons**:
- High friction for a digital demo and educational platform.
- Requires building the full admin borrow records management screens before students can test any return flow.

## Decision

**Chosen option**: Option 1: Self service student return with administrator capability.

We will build a server action named `returnBook` in `src/lib/action/book.ts` and add a direct Return button on the profile book cards in `src/components/BookCard.tsx`.

## Rationale

The project already uses atomic database operations and session verification for borrowing. Providing self service returns allows students to immediately see their loans update and test the entire library workflow end to end. Administrators will share the same underlying action so that later administrative record tables can trigger returns with identical business logic.

## Feature design

**Data model sketch**:
Uses existing tables in `src/database/schema.ts` without changes:
- `borrow_records`: `id` (uuid primary key), `userId` (uuid), `bookId` (uuid), `status` (`BORROWED` | `RETURNED`), `dueDate` (date), `returnDate` (date nullable).
- `books`: `id` (uuid primary key), `availableCopies` (integer), `totalCopies` (integer).

**State transitions**:
`borrow_records.status`: `BORROWED` -> `RETURNED` (one way, final).

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `returnBook` | Server Action | `recordId: string` | `{ success: boolean, data?: BorrowRecord, error?: string }` | Signed in user or admin | Unauthorized (401), Record not found (404), Already returned (400) |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| `returnBook` | `userId` for permission check | Active session cookie via `auth()` |
| `returnBook` | `recordId` to update | Input parameter |
| `returnBook` | `returnDate` | Current date formatted as `YYYY-MM-DD` |
| `returnBook` | `status` | Constant string `RETURNED` |
| `returnBook` | new `availableCopies` count | SQL atomic increment `books.availableCopies + 1` |

**Key invariants**:
- Only records with `status = 'BORROWED'` can be transitioned to `RETURNED`.
- `availableCopies` must never exceed `totalCopies`.
- A non admin student can only return borrow records where `borrow_records.userId === session.user.id`.

**Security model**:
- Unauthenticated requests are rejected immediately.
- The action verifies ownership by checking `record.userId === session.user.id` unless the user's role in the database is `ADMIN`.

**Critical test scenarios**:
- Happy path student return: Student returns their active borrowed book, record status becomes `RETURNED`, `returnDate` is populated, available copies increments by 1, verifies **AC-1**, **AC-3**, **AC-4**.
- Administrator return: Admin user returns a book borrowed by another student, verifies **AC-2**.
- Idempotency / duplicate return: Calling `returnBook` on a record already marked `RETURNED` rejects cleanly and does not increment copies, verifies **AC-5**.
- Unauthorized return attempt: Non admin student attempts to return a record belonging to another student, verifies **AC-6**.
- UI return interaction: Clicking Return shows loading indicator and revalidates profile list, verifies **AC-7**, **AC-8**.

## Build plan

1. Create `returnBook` server action in `src/lib/action/book.ts` with session authentication, ownership check, atomic record update, and copy increment, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
2. Write unit and integration tests in `src/lib/action/book.test.ts` covering student return, admin return, already returned rejection, and unauthorized attempts, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
3. Create a dedicated client component or button in `src/components/BookCard.tsx` to trigger `returnBook` with loading feedback and router refresh, satisfies **AC-7**, **AC-8**.
4. Update `src/app/(root)/my-profile/page.tsx` so only active loans (`status = 'BORROWED'`) appear in the active borrowed list, or returned books reflect their returned status, satisfies **AC-8**.

## Consequences

**Positive**:
- Students can return books and see their loan records update immediately.
- Library copy availability automatically replenishes when books are returned.
- Reuses existing database columns without database migrations.

**Negative / tradeoffs**:
- Physical book drop off is trusted digitally rather than scanned with barcode hardware.

**Neutral**:
- Later admin borrow record tables will call the same `returnBook` action.
