import { defineConfig } from "vite"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json"

export default defineConfig({
    plugins: [crx({ manifest })],
    build: {
        outDir: "dist",
        sourcemap: "inline",
        rollupOptions: {
            input: {
                offscreen: "src/offscreen/offscreen.html",
            },
        },
    },
})
