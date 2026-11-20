# 0002. Admin account requests and user approval queue

**Date**: 2026-11-20
**Status**: Accepted

## Summary

This decision defines how administrators review and approve student account registrations at `/admin/account-requests`. Newly registered students upload their university identification card during sign up and remain in pending status until reviewed. An administrative data table allows librarians to inspect university cards in a modal, review student credentials, and toggle status between pending, approved, and rejected. Approving an account immediately grants the student library borrowing privileges across the catalog.

## Context

When students create an account on BookWise, they provide their full name, email address, university student ID number, and an image upload of their official university card. In the database schema, all new users receive a default status of `PENDING`.

The book borrowing server action explicitly checks that a student has status `APPROVED` before any loan record is created. Without an administrative review queue, students remain indefinitely in pending status and receive eligibility errors whenever they attempt to borrow a book. Administrators need a dedicated interface to inspect student credentials, verify enrolled status, and grant borrowing privileges.

## Requirements

**User stories**:
- As an administrator, I want to review pending student registrations and inspect their university identification cards so that only verified university students can borrow books.
- As an administrator, I want to approve or reject pending requests and reverse decisions when needed so that library records remain accurate and fair.
- As a student, I want my registration to be reviewed and approved so that I can borrow library books without eligibility errors.

**Acceptance criteria**:
- **AC-1**: An authenticated administrator can view student account requests at `/admin/account-requests`, with the active tab driven by the URL search parameter `?status=PENDING` (defaulting to `PENDING` if omitted or invalid).
- **AC-2**: The administrator can switch between tabs to inspect `PENDING`, `APPROVED`, and `REJECTED` accounts, ordered by newest registration first, displaying a clean empty state message when no records match.
- **AC-3**: Each account request row shows student full name, email, university ID number, registration date formatted as `MMM DD, YYYY`, current status badge, and an action to inspect their university identification card.
- **AC-4**: Clicking the university card action opens a preview dialog displaying the high resolution university card image stored on ImageKit, with a visual fallback placeholder if the image fails to load or the path is unavailable.
- **AC-5**: An authenticated administrator can approve a student account by submitting a server action with parameter `{ userId, status: "APPROVED" }`, which updates the database, revalidates `/admin/account-requests`, and provides toast feedback.
- **AC-6**: An authenticated administrator can reject a student account by submitting a server action with parameter `{ userId, status: "REJECTED" }`, which updates the database, revalidates `/admin/account-requests`, and provides toast feedback.
- **AC-7**: An administrator can reverse prior decisions by changing an approved or rejected account back to `PENDING` or another valid status.
- **AC-8**: Non administrator users and unauthenticated callers are rejected at route level by the admin layout redirect and at server action level with a structured unauthorized error payload.
- **AC-9**: When an account is approved, the student is immediately eligible to borrow books, satisfying the eligibility check in the book lending action.

## Options considered

### Option 1: Dedicated account requests queue with card preview modal and server actions (Chosen)

Create a dedicated page at `/admin/account-requests` featuring URL driven tab filters (Pending, Approved, Rejected), a responsive data table, an ImageKit card inspection modal, and a server action named `changeUserAccountStatus` to mutate user state with instant optimistic or refreshed updates.

**Pros**:
- Direct alignment with the existing admin navigation item `Account Requests` in the admin sidebar.
- Dedicated focus on pending registrations without cluttering the general users directory.
- Fast inspection workflow with modal previews allowing librarians to review cards without losing table scroll position.
- Reuses existing `users` table schema without requiring any database migrations.

**Cons**:
- Requires creating a new administrative page and table view.

### Option 2: Generic status toggle in the general users directory

Add status edit buttons inside `/admin/users` without building a separate queue at `/admin/account-requests`.

**Pros**:
- Avoids creating an extra route.

**Cons**:
- Violates existing sidebar architecture where `Account Requests` is an explicit distinct route.
- Forces administrators to wade through approved users to spot new pending registrations.
- Slower operational turnaround for student onboarding.

## Decision

**Chosen option**: Option 1: Dedicated account requests queue with card preview modal and server actions.

We will build the `/admin/account-requests` route with URL parameter tab filtering, implement `changeUserAccountStatus` in `src/lib/admin/actions/user.ts` validated via Zod schema, and build a modal in `src/components/admin/UniversityCardModal.tsx` to inspect university ID card documents with ImageKit fallback.

## Rationale

The sidebar already designates `/admin/account-requests` as the destination for student registration management. Reusing the existing `users` table columns (`status`, `universityCard`, `universityId`) keeps the data layer simple while unblocking the core borrowing requirements.

## Feature design

**Data model sketch**:
Reuses existing `users` table in `src/database/schema.ts` without changes:
- `users`: `id` (uuid primary key), `fullName` (varchar 255), `email` (text unique), `universityId` (integer unique), `universityCard` (text), `status` (`PENDING` | `APPROVED` | `REJECTED`), `role` (`USER` | `ADMIN`), `createdAt` (timestamp with timezone).

**State transitions**:
`users.status`: `PENDING` <-> `APPROVED` <-> `REJECTED` (reversible administrative transitions).

**Action control matrix per tab**:
- `PENDING` tab: Display **Approve** button and **Reject** button.
- `APPROVED` tab: Display **Reject** button and **Reset to Pending** option.
- `REJECTED` tab: Display **Approve** button and **Reset to Pending** option.

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `changeUserAccountStatus` | Server Action | `params: { userId: string, status: "PENDING" \| "APPROVED" \| "REJECTED" }` | `{ success: boolean, error?: string }` | Authenticated ADMIN | Unauthorized (401), User not found or is administrator (404), Self modification forbidden (400), Invalid status (400) |

**Validation schema**:
`changeUserAccountStatusSchema` in `src/lib/validation.ts`:
```ts
export const changeUserAccountStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});
```

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| `changeUserAccountStatus` | Caller identity and admin permission | Active session cookie verified via `auth()`, checked against `users.role === 'ADMIN'` |
| `changeUserAccountStatus` | Target user identifier | `params.userId` validated via Zod schema |
| `changeUserAccountStatus` | New account status | `params.status` validated via Zod schema |
| `/admin/account-requests` | Active tab status filter | URL search param `searchParams.status`, defaulting to `"PENDING"` |
| `/admin/account-requests` | Account requests list | Database query on `users` where `role = 'USER'` and `status = activeStatus`, ordered by `desc(users.createdAt)` |
| `/admin/account-requests` | Registration date display | `dayjs(user.createdAt).format("MMM DD, YYYY")` |
| `/admin/account-requests` | University card image URL | `users.universityCard` resolved through ImageKit endpoint |
| `/admin/account-requests` | Empty state notice | Conditional render when query returns zero records: `"No {status.toLowerCase()} account requests found."` |

**Key invariants**:
- Only authenticated callers whose database record carries `role === 'ADMIN'` can access the route or run the server action.
- An administrator cannot modify their own account status (`userId === session.user.id`).
- Status changes can only target student accounts (`role === 'USER'`), preventing accidental degradation of administrators.
- Database updates check matching row count via `.returning({ id: users.id })`, ensuring clean error handling when a user does not exist.
- Server action calls `revalidatePath("/admin/account-requests")` upon success, and client action triggers `router.refresh()`.

**Security model**:
- Route level security: `src/app/admin/layout.tsx` redirects unauthenticated visitors to `/sign-in` and non admin users to `/`.
- Server action level security: `changeUserAccountStatus` independently authenticates caller session and verifies `ADMIN` role from the database before executing any update.

**Failure and edge cases**:
- ImageKit loading failure: `UniversityCardModal` catches load errors via `onError` and displays an informative fallback placeholder.
- Non existent user: Server action verifies update return length, returning `{ success: false, error: "User not found" }` without crashing.
- Database connection failure: Action wraps query in `try...catch`, returning user friendly error messages.

**Critical test scenarios**:
- Happy path approval: Administrator approves a pending student, status becomes `APPROVED`, student is now eligible to borrow, verifies **AC-1**, **AC-5**, **AC-9**.
- Happy path rejection: Administrator rejects a student registration, status becomes `REJECTED`, student remains ineligible, verifies **AC-2**, **AC-6**.
- Decision reversal: Administrator changes a rejected student back to `APPROVED` or `PENDING`, verifies **AC-7**.
- Self modification rejection: Administrator attempting to change their own account status is blocked, verifies **AC-8**.
- Target role protection: Attempting to modify another administrator account returns an error, verifies **AC-8**.
- Unauthorized access rejection: Non admin user or anonymous caller is rejected with error, verifies **AC-8**.
- University card inspection and fallback: Clicking card action displays the university card in modal, with graceful fallback on broken image paths, verifies **AC-3**, **AC-4**.
- Tab navigation and empty state: Switching tabs updates URL search params and displays matching users or clean empty state, verifies **AC-1**, **AC-2**.

## Build plan

1. Define `changeUserAccountStatusSchema` in `src/lib/validation.ts` and add `ChangeUserAccountStatusParams` to `src/types.d.ts`, satisfies **AC-5**, **AC-6**, **AC-7**.
2. Create `changeUserAccountStatus` server action in `src/lib/admin/actions/user.ts` with admin role validation, self modification prevention, user role restriction, and revalidation, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.
3. Write unit tests in `src/lib/admin/actions/user.test.ts` covering admin approval, rejection, decision reversal, self modification guard, admin target guard, and unauthorized callers, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.
4. Create `UniversityCardModal.tsx` in `src/components/admin/UniversityCardModal.tsx` displaying the high resolution university card with ImageKit integration and loading error fallback, satisfies **AC-3**, **AC-4**.
5. Build `src/app/admin/account-requests/page.tsx` with URL search parameter tab filtering (`PENDING`, `APPROVED`, `REJECTED`), registration data table, card modal trigger, and action buttons, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, **AC-7**.
6. Write component tests for `UniversityCardModal` and the account requests page, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.

## Consequences

**Positive**:
- Librarians have an organized operational queue to verify student registrations.
- Students can have their accounts approved and begin borrowing books.
- Requires zero schema migrations, reusing existing columns and enum values.
- Self edit guards and role restrictions protect administrative stability.

**Negative / tradeoffs**:
- Requires manual administrator review for every student before they can borrow books.

**Neutral**:
- Later administrative directory views can reuse `changeUserAccountStatus`.
