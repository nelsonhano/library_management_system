# Verify: Admin dashboard overview and analytics · spec 0004 · updated 2026-11-20

_Steps derived from spec 0004 acceptance criteria. /check verify runs these; /test locks the durable ones._

## UI / manual
- [x] Sign in as authenticated administrator and navigate to `/admin` → expect 4 metric cards (Total Books, Borrowed Books, Total Users, and Account Requests) displaying real counts from database → AC-1, AC-8
- [x] Click Total Books metric card → expect navigation to `/admin/books` → AC-2
- [x] Click Borrowed Books metric card → expect navigation to `/admin/borrow-records` → AC-2
- [x] Click Total Users metric card → expect navigation to `/admin/users` → AC-2
- [x] Click Account Requests metric card → expect navigation to `/admin/account-requests` → AC-2
- [x] Inspect dashboard layout → expect two column responsive layout below metric cards with Recently Added Books on left and Recent Borrow Requests on right → AC-3
- [x] In Recently Added Books section → click "+ Add a New Book" banner → expect navigation to `/admin/books/new` → AC-4
- [x] In Recently Added Books section → click "View All" link → expect navigation to `/admin/books` → AC-4
- [x] In Recently Added Books section → verify up to 5 recently added catalog books render with cover thumbnail, title, author, genre badge, and formatted date → AC-4
- [x] In Recent Borrow Requests section → verify up to 6 borrowing events render with cover thumbnail, title, author, borrower student name, avatar initials, borrow date formatted as `MMM DD, YYYY`, and status badge (`BORROWED` in amber, `RETURNED` in emerald) → AC-5
- [x] In Recent Borrow Requests section → click "View All" link → expect navigation to `/admin/borrow-records` → AC-6
- [x] In zero state environment → verify empty states render `"No books in catalog yet"` and `"No recent borrow records"` without crashing → AC-7
- [x] Access `/admin` without authentication or as student user → expect redirection to `/sign-in` or `/` → AC-9
- [x] Trigger an unexpected query failure → verify error boundary renders error message and retry button → AC-10

## Commands
- [x] `npm.cmd test -- src/components/admin/StatCard.test.tsx src/components/admin/BookStripe.test.tsx src/components/admin/RecentBooks.test.tsx src/app/admin/error.test.tsx src/app/admin/page.test.tsx` → 18 tests pass → AC-1, AC-2, AC-4, AC-5, AC-7, AC-10

## Acceptance-criteria coverage
- AC-1 covered by UI step 1 and test command
- AC-2 covered by UI steps 2, 3, 4, 5 and test command
- AC-3 covered by UI step 6
- AC-4 covered by UI steps 7, 8, 9 and test command
- AC-5 covered by UI step 10 and test command
- AC-6 covered by UI step 11
- AC-7 covered by UI step 12 and test command
- AC-8 covered by UI step 1 and test command
- AC-9 covered by UI step 13
- AC-10 covered by UI step 14 and test command
