# 0004. Admin dashboard overview and analytics: Rationale

## Context

Administrators currently access individual administrative screens such as account requests and books inventory, but navigating to the administration root at `/admin` yields an empty page without actionable data. Library staff need an immediate high level pulse on catalog health, pending student requests, and active borrowing volume without clicking through multiple separate views.

The existing administrative stylesheet in `src/styles/admin.css` contains pre built styling primitives for statistics cards, book stripes, add new book banners, error fallbacks, and activity lists. Implementing the overview dashboard requires connecting these visual patterns to real database aggregations through fast server queries, ensuring that counts and recent logs update dynamically without client side request waterfalls.

## Options considered

### Option 1: Server rendered composite dashboard with parallel database aggregation and deep link metric cards (Chosen)

Build `/admin` as a React Server Component querying counts and feeds in parallel using Drizzle ORM, rendering metric cards, quick action CTA banners, and recent activity feeds directly to HTML.

**Pros**:
* Zero client request waterfalls and instant initial page load with complete markup.
* Reuses existing database schema and pre built styling primitives in `src/styles/admin.css`.
* Server side aggregation keeps sensitive full record queries on the server.
* Interactive deep links turn passive informational displays into fast navigation hubs.

**Cons**:
* Requires writing aggregate and join queries spanning `books`, `borrow_records`, and `users`.

### Option 2: Client fetched dashboard using client side API routes and polling hooks

Create API routes under `/api/admin/stats` and fetch data on the client using SWR or React Query hooks.

**Pros**:
* Allows independent polling and client side re-fetching intervals.

**Cons**:
* Introduces loading spinners and layout shift on initial navigation.
* Adds unnecessary API routes when Next.js Server Components can read the database directly.
* Increases client bundle size and network round trips.

## Rationale

Next.js App Router Server Components provide optimal performance and security for administrative overview pages. Parallelizing database queries via `Promise.all` with integer casting eliminates waterfalls, while pre built CSS components in `src/styles/admin.css` allow immediate visual consistency with existing administration views.
