process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost/dummy";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "dummy-secret-123456789012345678901234567890";
process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "dummy_public";
process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/dummy";
process.env.IMAGE_PRIVATE_KEY = process.env.IMAGE_PRIVATE_KEY || "dummy_private";

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Testing Library only cleans up automatically when Vitest globals are on.
afterEach(async () => {
    if (typeof document !== "undefined") {
        const { cleanup } = await import("@testing-library/react");
        cleanup();
    }
});
