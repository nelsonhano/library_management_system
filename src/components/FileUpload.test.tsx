import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticator } from "./FileUpload";

describe("FileUpload authenticator", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("fetches authentication tokens from the relative /api/auth/imagekit endpoint", async () => {
        const mockAuth = {
            expire: 1700000000,
            signature: "test_signature_abc",
            token: "test_token_xyz",
        };

        const fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockAuth,
        });

        global.fetch = fetchSpy;

        const result = await authenticator();

        expect(fetchSpy).toHaveBeenCalledWith("/api/auth/imagekit");
        expect(result).toEqual(mockAuth);
    });

    it("throws an error when the endpoint responds with an error status", async () => {
        const fetchSpy = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        });

        global.fetch = fetchSpy;

        await expect(authenticator()).rejects.toThrow(
            "Authentication request failed: Request failed with status 500: Internal Server Error"
        );
    });
});
