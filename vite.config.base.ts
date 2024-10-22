/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        svgr()
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        }
    },
    esbuild: {
        // we need this so that ambient functions are not minified and can be used during runtime
        minifyIdentifiers: false,
    },
    test: {
        include: ['src/**/*.test.ts'],
        setupFiles: ['./src/vitest/vi.setup.ts'],
        environment: "jsdom",
    }
})
