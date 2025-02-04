import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [
                    ['@babel/plugin-proposal-decorators', { legacy: true }],
                    ['@babel/plugin-proposal-class-properties', { loose: true }],
                ],
            },
        }),
        svgr(),
        wasm()
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
})
