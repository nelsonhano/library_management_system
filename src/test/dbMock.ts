/**
 * A stand in for the drizzle `db` object, so server code can be tested
 * without a real database.
 *
 * Every top level call (`db.select(...)`, `db.insert(...)`, `db.update(...)`)
 * starts a recorded query. Any chained method (`.from`, `.where`, `.values`,
 * `.returning`, ...) is recorded too. When the chain is awaited it resolves to
 * the next result you queued with `queue()` (or `[]` if none). Queue an
 * `Error` to make that query reject.
 *
 * Usage in a test file:
 *   vi.mock("@/database/drizzle", async () => ({
 *     db: (await import("@/test/dbMock")).dbMock.db,
 *   }));
 */

type ChainCall = { method: string; args: unknown[] };
export type QueryRecord = {
    op: string;
    args: unknown[];
    chain: ChainCall[];
    result: unknown;
};

const results: unknown[] = [];
const calls: QueryRecord[] = [];

const makeChain = (record: QueryRecord): unknown => {
    const chain: unknown = new Proxy(
        {},
        {
            get(_target, prop) {
                if (prop === "then") {
                    const settled =
                        record.result instanceof Error
                            ? Promise.reject(record.result)
                            : Promise.resolve(record.result);
                    return settled.then.bind(settled);
                }
                return (...args: unknown[]) => {
                    record.chain.push({ method: String(prop), args });
                    return chain;
                };
            },
        },
    );
    return chain;
};

const db = new Proxy(
    {},
    {
        get(_target, op) {
            return (...args: unknown[]) => {
                const record: QueryRecord = {
                    op: String(op),
                    args,
                    chain: [],
                    result: results.length ? results.shift() : [],
                };
                calls.push(record);
                return makeChain(record);
            };
        },
    },
);

export const dbMock = {
    db,
    calls,
    /** Queue results for the next queries, in order. */
    queue: (...r: unknown[]) => {
        results.push(...r);
    },
    reset: () => {
        results.length = 0;
        calls.length = 0;
    },
    /** All queries of one kind, e.g. `ops("insert")`. */
    ops: (op: string) => calls.filter((c) => c.op === op),
    /** The first args of a chained method on a query, e.g. `.values(...)`. */
    arg: (record: QueryRecord | undefined, method: string) =>
        record?.chain.find((c) => c.method === method)?.args[0],
};
