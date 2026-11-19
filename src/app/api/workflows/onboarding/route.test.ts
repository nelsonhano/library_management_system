import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dbMock } from "@/test/dbMock";

vi.mock("@/database/drizzle", async () => ({
    db: (await import("@/test/dbMock")).dbMock.db,
}));

const sendEmailMock = vi.fn();
vi.mock("@/lib/workFlow", () => ({
    sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

// `serve` wraps the workflow body; return the body itself so we can drive it.
vi.mock("@upstash/workflow/nextjs", () => ({
    serve: (handler: unknown) => ({ POST: handler }),
}));

import { POST } from "./route";

type Ctx = {
    requestPayload: { email: string; fullName: string };
    run: (name: string, fn: () => Promise<unknown>) => Promise<unknown>;
    sleep: (name: string, seconds: number) => Promise<void>;
};
const workflow = POST as unknown as (ctx: Ctx) => Promise<void>;

const STOP = new Error("stop the endless monthly loop");
const NOW = new Date("2026-11-17T12:00:00Z");
const daysAgo = (n: number) =>
    new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Runs the workflow through the welcome email and one monthly check. */
const runOnce = async () => {
    const steps: string[] = [];
    let sleeps = 0;
    const ctx: Ctx = {
        requestPayload: { email: "ada@example.com", fullName: "Ada" },
        run: async (name, fn) => {
            steps.push(name);
            return fn();
        },
        sleep: async () => {
            sleeps += 1;
            if (sleeps >= 2) throw STOP;
        },
    };
    await expect(workflow(ctx)).rejects.toBe(STOP);
    return steps;
};

describe("onboarding workflow", () => {
    beforeEach(() => {
        dbMock.reset();
        sendEmailMock.mockReset().mockResolvedValue(undefined);
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("sends the welcome email first", async () => {
        dbMock.queue([{ lastActivityDate: daysAgo(0) }]);

        const steps = await runOnce();

        expect(steps[0]).toBe("new-signup");
        expect(sendEmailMock).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ title: "Welcome to the platform", email: "ada@example.com" }),
        );
    });

    it("sends 'Welcome back!' to a user active within the last 3 days", async () => {
        dbMock.queue([{ lastActivityDate: daysAgo(1) }]);

        const steps = await runOnce();

        expect(steps).toContain("send-email-active");
        expect(steps).not.toContain("send-email-non-active");
    });

    it("sends 'Are you still there?' to a user idle for 5 days", async () => {
        dbMock.queue([{ lastActivityDate: daysAgo(5) }]);

        const steps = await runOnce();

        expect(steps).toContain("send-email-non-active");
    });

    it("treats a user idle for more than 30 days as non active, not active", async () => {
        dbMock.queue([{ lastActivityDate: daysAgo(45) }]);

        const steps = await runOnce();

        expect(steps).toContain("send-email-non-active");
        expect(steps).not.toContain("send-email-active");
    });

    it("treats a user who can't be found as non active", async () => {
        dbMock.queue([]);

        const steps = await runOnce();

        expect(steps).toContain("send-email-non-active");
    });
});
