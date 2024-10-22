import { mergeConfig } from 'vite'
import baseConfig from "../../vite.config.base"
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default mergeConfig(baseConfig, {
    build: {
        rollupOptions: {
            input: ['web/main.tsx', './index.html'],
            external: [
                fileURLToPath(new URL("server", import.meta.url))
            ]
        }
    },
})
