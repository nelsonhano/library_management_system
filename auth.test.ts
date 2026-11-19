import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hash } from "bcryptjs";

import { dbMock } from "@/test/dbMock";

vi.mock("@/database/drizzle", async () => ({
    db: (await import("@/test/dbMock")).dbMock.db,
}));

// Capture the config auth.ts hands to NextAuth, so we can test it directly.
type Config = {
    pages: { signIn: string };
    providers: { authorize: (c: unknown) => Promise<unknown> }[];
    callbacks: {
        jwt: (a: { token: Record<string, unknown>; user?: Record<string, unknown> }) => Promise<Record<string, unknown>>;
        session: (a: { session: { user?: Record<string, unknown> }; token: Record<string, unknown> }) => Promise<{ user?: Record<string, unknown> }>;
    };
};
const captured = vi.hoisted(() => ({ config: undefined as unknown }));

vi.mock("next-auth", () => ({
    default: (config: unknown) => {
        captured.config = config;
        return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() };
    },
}));
vi.mock("next-auth/providers/credentials", () => ({
    default: (options: unknown) => options,
}));

await import("./auth");
const config = () => captured.config as Config;
const authorize = (c: unknown) => config().providers[0].authorize(c);

const PASSWORD = "correct horse battery";
let storedUser: Record<string, unknown>;

beforeAll(async () => {
    storedUser = {
        id: "u1",
        email: "ada@example.com",
        fullName: "Ada Lovelace",
        password: await hash(PASSWORD, 4),
    };
});

beforeEach(() => {
    dbMock.reset();
});

describe("auth config", () => {
    it("points NextAuth at the absolute /sign-in page", () => {
        expect(config().pages.signIn).toBe("/sign-in");
    });
});

describe("credentials authorize", () => {
    it("returns null when email or password is missing, without querying", async () => {
        expect(await authorize({ email: "ada@example.com" })).toBeNull();
        expect(await authorize({ password: PASSWORD })).toBeNull();
        expect(dbMock.calls).toHaveLength(0);
    });

    it("returns null for an email that isn't registered", async () => {
        dbMock.queue([]);

        expect(await authorize({ email: "nobody@example.com", password: PASSWORD })).toBeNull();
    });

    it("returns null for a wrong password", async () => {
        dbMock.queue([storedUser]);

        expect(await authorize({ email: "ada@example.com", password: "wrong" })).toBeNull();
    });

    it("returns the user's id, email and name, never the password hash", async () => {
        dbMock.queue([storedUser]);

        const user = await authorize({ email: "ada@example.com", password: PASSWORD });

        expect(user).toEqual({ id: "u1", email: "ada@example.com", name: "Ada Lovelace" });
    });
});

describe("session callbacks", () => {
    it("copies the user id and name into the token at sign in, then into the session", async () => {
        const token = await config().callbacks.jwt({
            token: {},
            user: { id: "u1", name: "Ada Lovelace" },
        });
        const session = await config().callbacks.session({
            session: { user: {} },
            token,
        });

        expect(session.user).toMatchObject({ id: "u1", name: "Ada Lovelace" });
    });

    it("keeps an existing token unchanged on later requests", async () => {
        const token = { id: "u1", name: "Ada" };

        expect(await config().callbacks.jwt({ token })).toEqual(token);
    });
});
