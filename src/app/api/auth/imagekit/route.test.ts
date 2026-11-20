import { describe, expect, it, vi, beforeAll } from "vitest";

process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY = "public_test_key";
process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";
process.env.IMAGE_PRIVATE_KEY = "private_test_key";

describe("GET /api/auth/imagekit", () => {
    it("returns authentication parameters with expire, signature, and token", async () => {
        const { GET } = await import("./route");
        const response = await GET();
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty("expire");
        expect(data).toHaveProperty("signature");
        expect(data).toHaveProperty("token");

        expect(typeof data.expire).toBe("number");
        expect(typeof data.signature).toBe("string");
        expect(typeof data.token).toBe("string");
    });
});
