import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        // Server code runs in node; component tests opt into jsdom per file
        // with a `// @vitest-environment jsdom` comment.
        environment: "node",
        include: ["src/**/*.test.{ts,tsx}", "*.test.ts"],
        exclude: ["node_modules", ".next"],
        setupFiles: ["./vitest.setup.ts"],
        restoreMocks: true,
        // next-auth imports "next/server" without an extension, which plain
        // Node ESM can't resolve; letting Vite bundle it fixes that.
        server: { deps: { inline: ["next-auth"] } },
    },
});
