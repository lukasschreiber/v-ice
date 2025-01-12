import { mergeConfig } from 'vite'
import baseConfig from "../../vite.config.base"

// https://vitejs.dev/config/
export default mergeConfig(baseConfig, {
    build: {
        rollupOptions: {
            input: ['src/main.tsx', './index.html'],
        }
    }
})
