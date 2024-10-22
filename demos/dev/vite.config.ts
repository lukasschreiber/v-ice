import { mergeConfig } from 'vite'
import baseConfig from "../../vite.config.base"
import prismjs from 'vite-plugin-prismjs'

// https://vitejs.dev/config/
export default mergeConfig(baseConfig, {
    build: {
        rollupOptions: {
            input: ['src/main.tsx', './index.html'],
        }
    },
    plugins: [
        prismjs({
            languages: ['typescript', 'tsx', 'json', 'xml'],
            plugins: ['line-numbers'],
            theme: 'default',
            css: false
        })
    ],
})
