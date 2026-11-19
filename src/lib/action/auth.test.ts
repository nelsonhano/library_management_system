import { beforeEach, describe, expect, it, vi } from "vitest";
import { compare } from "bcryptjs";
import { CredentialsSignin } from "next-auth";

import { dbMock } from "@/test/dbMock";

vi.mock("@/database/drizzle", async () => ({
    db: (await import("@/test/dbMock")).dbMock.db,
}));

const signInMock = vi.fn();
vi.mock("../../../auth", () => ({
    signIn: (...args: unknown[]) => signInMock(...args),
}));

const triggerMock = vi.fn();
vi.mock("../workFlow", () => ({
    default: { trigger: (...args: unknown[]) => triggerMock(...args) },
}));

const limitMock = vi.fn();
vi.mock("../rateLimit", () => ({
    default: { limit: (...args: unknown[]) => limitMock(...args) },
}));

let requestHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));

vi.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`);
    },
}));

import { signInWithCredentials, signUp } from "./auth";

const newUser = {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    password: "correct horse battery",
    universityId: 12345,
    universityCard: "/ids/ada.png",
};

beforeEach(() => {
    dbMock.reset();
    signInMock.mockReset().mockResolvedValue({});
    triggerMock.mockReset().mockResolvedValue({ workflowRunId: "w1" });
    limitMock.mockReset().mockResolvedValue({ success: true });
    requestHeaders = new Headers({ "x-forwarded-for": "203.0.113.7" });
    vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("signInWithCredentials", () => {
    it("signs in with redirect turned off and reports success", async () => {
        const result = await signInWithCredentials({
            email: newUser.email,
            password: newUser.password,
        });

        expect(result).toEqual({ success: true });
        expect(signInMock).toHaveBeenCalledWith("credentials", {
            email: newUser.email,
            password: newUser.password,
            redirect: false,
        });
    });

    it("rate limits by the caller's forwarded IP address", async () => {
        await signInWithCredentials({ email: newUser.email, password: "x" });

        expect(limitMock).toHaveBeenCalledWith("203.0.113.7");
    });

    it("sends the caller to /too-fast when the rate limit is hit, without trying to sign in", async () => {
        limitMock.mockResolvedValue({ success: false });

        await expect(
            signInWithCredentials({ email: newUser.email, password: "x" }),
        ).rejects.toThrow("NEXT_REDIRECT:/too-fast");
        expect(signInMock).not.toHaveBeenCalled();
    });

    it("says 'Invalid email or password' when the credentials are wrong", async () => {
        signInMock.mockRejectedValue(new CredentialsSignin());

        const result = await signInWithCredentials({
            email: newUser.email,
            password: "wrong password",
        });

        expect(result).toEqual({
            success: false,
            error: "Invalid email or password",
        });
    });

    it("proceeds to sign in when rate limiter fails with an exception", async () => {
        limitMock.mockRejectedValue(new Error("Upstash Redis unreachable"));

        const result = await signInWithCredentials({
            email: newUser.email,
            password: newUser.password,
        });

        expect(result).toEqual({ success: true });
        expect(signInMock).toHaveBeenCalled();
    });

    it("returns a sign in error (not a sign up error) when something unexpected fails", async () => {
        signInMock.mockRejectedValue(new Error("boom"));

        const result = await signInWithCredentials({
            email: newUser.email,
            password: newUser.password,
        });

        expect(result).toEqual({ success: false, error: "Signin error" });
    });
});

describe("signUp", () => {
    it("rejects invalid details on the server before touching the database", async () => {
        const result = await signUp({ ...newUser, email: "not-an-email", password: "short" });

        expect(result).toEqual({ success: false, error: "Invalid sign up details" });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("rejects an email that is already registered", async () => {
        dbMock.queue([{ email: newUser.email, universityId: 999 }]);

        const result = await signUp(newUser);

        expect(result).toEqual({ success: false, error: "User already exists" });
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("rejects a University ID that another account already uses", async () => {
        dbMock.queue([{ email: "someone@else.com", universityId: newUser.universityId }]);

        const result = await signUp(newUser);

        expect(result).toEqual({
            success: false,
            error: "University ID is already registered",
        });
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("creates the user with a hashed password, starts onboarding, and signs them in", async () => {
        dbMock.queue([], []);

        const result = await signUp(newUser);

        expect(result).toEqual({ success: true });
        const values = dbMock.arg(dbMock.ops("insert")[0], "values") as {
            password: string;
            email: string;
        };
        expect(values.email).toBe(newUser.email);
        expect(values.password).not.toBe(newUser.password);
        expect(await compare(newUser.password, values.password)).toBe(true);
        expect(triggerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                body: { email: newUser.email, fullName: newUser.fullName },
            }),
        );
        expect(signInMock).toHaveBeenCalledWith(
            "credentials",
            expect.objectContaining({ email: newUser.email }),
        );
    });

    it("still reports success when the onboarding workflow can't be triggered, since the account exists", async () => {
        dbMock.queue([], []);
        triggerMock.mockRejectedValue(new Error("QStash down"));

        const result = await signUp(newUser);

        expect(result).toEqual({ success: true });
        expect(signInMock).toHaveBeenCalled();
    });

    it("reports a sign up error and skips onboarding when the insert fails", async () => {
        dbMock.queue([], new Error("unique violation"));

        const result = await signUp(newUser);

        expect(result).toEqual({ success: false, error: "Signup error" });
        expect(triggerMock).not.toHaveBeenCalled();
        expect(signInMock).not.toHaveBeenCalled();
    });

    it("sends the caller to /too-fast when the rate limit is hit, without creating a user", async () => {
        limitMock.mockResolvedValue({ success: false });

        await expect(signUp(newUser)).rejects.toThrow("NEXT_REDIRECT:/too-fast");
        expect(dbMock.ops("insert")).toHaveLength(0);
    });
});
