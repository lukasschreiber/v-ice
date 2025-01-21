import { mergeConfig } from 'vite'
import { resolve } from 'path'
import baseConfig from "./vite.config.base"
import externalGlobals from 'rollup-plugin-external-globals'
import dts from 'vite-plugin-dts'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default mergeConfig(baseConfig, {
    plugins: [
        dts({ include: ['src'] }),
        nodePolyfills({
            buffer: true
        }),
    ],
    build: {
        copyPublicDir: false,
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            formats: ['es'],
        },
        rollupOptions: {
            external: ["react", "react-dom", "react/jsx-runtime"],
            plugins: [
                externalGlobals({
                    react: 'React',
                    'react-dom': 'ReactDOM',
                })
            ]
        }
    },
})
