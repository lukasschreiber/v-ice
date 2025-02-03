import { mergeConfig } from 'vitest/config';
import baseConfig from './vite.config';

export default mergeConfig(baseConfig, {
    test: {
        include: ['src/**/*.test.ts'],
        setupFiles: ['./src/vitest/vi.setup.ts'],
        environment: "jsdom",
    },
})