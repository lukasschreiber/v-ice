import { mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import baseConfig from "../vite.config.base"

// https://vitejs.dev/config/
export default mergeConfig(baseConfig, {
  plugins: [react(), dts()],
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'v-ice-common',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
    },
    copyPublicDir: false,
  }
})