# Scope: BookWise Library Management System

BookWise is a university library management web application where students can browse books, view details and video previews, borrow available copies, and track their active loans, while administrators manage the book inventory and student access requests.

**Build approach:** Tracer Bullet (vertical slices where each feature is built end to end through every layer).
**Workflow:** Beta (verify on the real application, then add automated tests). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Student authentication & route protection | Foundation | existing |
| 2 | Book catalog & details view | Foundation | existing |
| 3 | Core book borrowing engine | Foundation | existing |
| 4 | Student profile borrowed books list | Foundation | existing |
| 5 | Admin book creation | Foundation | existing |
| 6 | File upload endpoint resilience | Slice 1: Reliability | done |
| 7 | Book return flow | Slice 1: Reliability | done |
| 8 | Dynamic loan status & receipt download | Slice 1: Reliability | done |
| 9 | Admin account requests & user approval | Slice 2: Administration | done |
| 10 | Admin books inventory table | Slice 2: Administration | done |
| 11 | Admin dashboard overview & analytics | Slice 2: Administration | done |
| 12 | Admin user & borrow records directory | Slice 2: Administration | done |
| 13 | Full library catalog & search | Slice 3: Discovery | planned |
| 14 | Server safe onboarding email workflow | Slice 3: Discovery | in-progress |

## Foundations

### 1. Student authentication & route protection · existing
Register student accounts with university identification, verify credentials with secure sessions, and guard private routes.
**Done when:** students can register, sign in, keep sessions across requests, and unauthenticated visitors are redirected to sign in.
- [x] Build it: `/develop student authentication`
- [x] Test it: `/test student authentication`
Code in `src/app/(auth)/`, `auth.ts`, `src/lib/action/auth.ts`

### 2. Book catalog & details view · existing
Present the latest library books on the home page and render detailed information, cover art, and video trailers for individual titles.
**Done when:** the home page loads books from the database and clicking any book opens its details view with cover, summary, and video preview.
- [x] Build it: `/develop book catalog & details`
- [x] Test it: `/test book catalog & details`
Code in `src/app/(root)/page.tsx`, `src/app/(root)/books/[id]/page.tsx`

### 3. Core book borrowing engine · existing
Let eligible students borrow available titles while atomically decreasing book stock and setting loan due dates.
**Done when:** an approved student can borrow an available title, creating a loan record with a due date and updating available copies without race conditions.
- [x] Build it: `/develop book borrowing engine`
- [x] Test it: `/test book borrowing engine`
Code in `src/lib/action/book.ts`, `src/components/BorrowBook.tsx`

### 4. Student profile borrowed books list · existing
Give students visibility into their active borrowed books and allow them to sign out of their current session.
**Done when:** the profile page displays all active loans joined with book metadata and provides a working sign out action.
- [x] Build it: `/develop student profile`
- [x] Test it: `/test student profile`
Code in `src/app/(root)/my-profile/page.tsx`

### 5. Admin book creation · existing
Provide library administrators with a validated form to add new titles, cover images, summaries, and inventory copy counts.
**Done when:** administrators can submit the book creation form and save new records in the database with role verified authorization.
- [x] Build it: `/develop admin book creation`
- [x] Test it: `/test admin book creation`
Code in `src/app/admin/books/new/page.tsx`, `src/lib/admin/actions/book.ts`

## Slice 1: Reliability & Core Loop Closure

### 6. File upload endpoint resilience · done
Ensure cover image and identification card uploads work seamlessly across local development and production environments.
**Done when:** upload authentication requests use relative endpoints so uploads succeed on Vercel without depending on localhost configurations.
- [x] Build it: `/develop file upload resilience`
- [x] Verify it: `/check verify file upload resilience`
- [x] Test it: `/test file upload resilience`
Code in `src/components/FileUpload.tsx`, `src/app/api/auth/imagekit/route.ts`

### 7. Book return flow · done
Enable students to return borrowed books, closing the loan record and replenishing available copies in the catalog.
**Done when:** a student or librarian can mark an active loan as returned, recording the return timestamp and incrementing available copies.
- [x] Design it (spec): `/architect book return flow`
- [x] Build it: `/develop book return flow`
   - [x] Backend returnBook server action with atomic copy increment (AC-1..6)
   - [x] Tests covering self return, admin return, and unauthorized cases (AC-1..6)
   - [x] UI return button on profile book card with loading state (AC-7..8)
   - [x] Profile view update for active vs returned loans (AC-8)
- [x] Verify it: `/check verify book return flow`
- [x] Test it: `/test book return flow`
Spec 0001 in `docs/specs/0001-book-return-flow.md` · code in `src/lib/action/book.ts`, `src/components/BookCard.tsx`, `src/components/ReturnBook.tsx`

### 8. Dynamic loan status & receipt download · done
Calculate actual days remaining until loan due dates on profile cards and allow students to download borrowing receipts.
**Done when:** the profile card shows the real days left based on due date, and clicking download receipt provides a printable or downloadable summary.
- [x] Build it: `/develop dynamic loan status`
   - [x] Dynamic calendar day calculations with due today and overdue alerts
   - [x] Official borrow receipt dialog with borrower and loan details
   - [x] Printable stylesheet and text receipt file downloader
- [x] Verify it: `/check verify dynamic loan status`
- [x] Test it: `/test dynamic loan status`
Code in `src/components/BookCard.tsx`, `src/components/BorrowReceipt.tsx`, `src/app/(root)/my-profile/page.tsx`, `src/app/globals.css`

## Slice 2: Administration & Operations

### 9. Admin account requests & user approval · done
Provide administrators with an approval queue to review student registrations, inspect uploaded university cards, and approve or reject accounts.
**Done when:** administrators can browse pending accounts at `/admin/account-requests`, view identification documents, and toggle user status to approved or rejected.
- [x] Design it (spec): `/architect admin account requests`
- [x] Build it: `/develop admin account requests`
   - [x] Server action changeUserAccountStatus with admin validation and invariants (AC-5, AC-6, AC-7, AC-8, AC-9)
   - [x] UniversityCardModal component with ImageKit preview and error fallback (AC-3, AC-4)
   - [x] Admin account requests page with URL search param tab filtering and data table (AC-1, AC-2, AC-3)
- [x] Verify it: `/check verify admin account requests`
- [x] Test it: `/test admin account requests`
Spec 0002 in `docs/specs/0002-admin-account-requests.md` · code in `src/app/admin/account-requests/`, `src/lib/admin/actions/user.ts`, `src/components/admin/UniversityCardModal.tsx`

### 10. Admin books inventory table · done
Replace the placeholder text in the admin book section with an interactive data table of all library books.
**Done when:** administrators can view all books in a table at `/admin/books`, see stock levels, and access edit or deletion actions.
- [x] Design it (spec): `/architect admin books inventory table`
- [x] Build it: `/develop admin books inventory table`
   - [x] Server actions updateBook and deleteBook with loan guards and transaction cleanup (AC-7, AC-8, AC-10, AC-11, AC-12)
   - [x] BookForm edit mode refactoring and DeleteBookButton component (AC-6, AC-7, AC-9)
   - [x] Admin books page with search, dynamic genre dropdown, and pagination (AC-1, AC-2, AC-3, AC-4, AC-5)
   - [x] Admin book edit page at /admin/books/[id]/edit with 404 handling (AC-6, AC-7)
- [x] Verify it: `/check verify admin books inventory table`
- [x] Test it: `/test admin books inventory table`
Spec 0003 in `docs/specs/0003-admin-books-inventory.md` · code in `src/app/admin/books/`, `src/lib/admin/actions/book.ts`, `src/components/admin/`

### 11. Admin dashboard overview & analytics · done
Build the central administration home screen with key metrics including total books, active loans, registered students, and overdue alerts.
**Done when:** `/admin` renders real summary metric cards and recent borrowing activities queried from the database.
- [x] Design it (spec): `/architect admin dashboard overview`
- [x] Build it: `/develop admin dashboard overview`
   - [x] Metric card component StatCard with deep link navigation (AC-1, AC-2)
   - [x] Recent borrow activity component BookStripe with student details and loan status badges (AC-5)
   - [x] Recently added books component RecentBooks with Add New Book banner and View All link (AC-4)
   - [x] Admin error boundary and composite dashboard page assembly with parallel database queries (AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, AC-9, AC-10)
- [x] Verify it: `/check verify admin dashboard overview`
- [x] Test it: `/test admin dashboard overview`
Spec 0004 in `docs/specs/0004-admin-dashboard-overview/index.md` · code in `src/app/admin/page.tsx`, `src/components/admin/`

### 12. Admin user & borrow records directory · done
Build dedicated management views for all registered users and all historical borrow records, replacing broken sidebar links.
**Done when:** `/admin/users` and `/admin/borrow-records` render full records lists with status filters and pagination without 404 errors.
- [x] Build it: `/develop admin user and borrow records`
   - [x] Reusable admin pagination component (Pagination.tsx)
   - [x] Admin users directory (/admin/users) with status filter, search, and user approval actions
   - [x] Admin borrow records directory (/admin/borrow-records) with status filter, search, receipt view, and return actions
- [x] Verify it: `/check verify admin user and borrow records`
- [x] Test it: `/test admin user and borrow records`
Code in `src/app/admin/users/`, `src/app/admin/borrow-records/`, `src/components/admin/`

## Slice 3: Discovery & Automation

### 13. Full library catalog & search · needs a decision
Replace the placeholder library view with a searchable catalog where students can explore titles by genre, author, and availability.
**Done when:** `/library` presents a complete catalog with instant search, category filters, and sorting options.
- [ ] Design it (spec): `/architect full library catalog`

### 14. Server safe onboarding email workflow · in-progress
Deliver welcome and retention emails through serverless compatible email delivery without client browser dependencies.
**Done when:** the onboarding background workflow executes cleanly in Node.js serverless functions, delivering emails through reliable server transport.
- [ ] Build it: `/develop onboarding email workflow`
- [ ] Verify it: `/check verify onboarding email workflow`
- [ ] Test it: `/test onboarding email workflow`
Code in `src/app/api/workflows/onboarding/route.ts`, `src/lib/workFlow.ts`

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box.

**Feature lifecycle**:

| State | Set by | The feature shows |
|---|---|---|
| planned | /scope | Title, intent, Done when, one entry command box |
| in-progress | /develop | Checkboxes for build milestones in progress |
| done | /check or /test | All checkboxes ticked, verified and tested |
| existing | /scope | Predates this workflow pass, complete and tested |
