import { mergeConfig, searchForWorkspaceRoot  } from 'vite'
import { resolve } from 'path'
import baseConfig from "./vite.config.base"
import externalGlobals from 'rollup-plugin-external-globals'
import dts from 'vite-plugin-dts'


// https://vitejs.dev/config/
export default mergeConfig(baseConfig, {
    plugins: [
        dts({ include: ['src'] }),
    ],
    build: {
        copyPublicDir: false,
        lib: {
            entry: resolve(__dirname, 'src/main.tsx'),
            formats: ['es'],
        },
        rollupOptions: {
            external: ["react", "react-dom", "react/jsx-runtime"],
            plugins: [
                externalGlobals({
                    react: 'React',
                    'react-dom': 'ReactDOM',
                })
            ],
        }
    },
    server: {
        fs: {
            allow: [
                searchForWorkspaceRoot(process.cwd()),
            ],
        }
    }
})
