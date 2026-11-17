import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: '../tools/vite-jsdom-silent-env.mts',
        environmentOptions: {
            'jsdom-silent': {
                console: true,
                omitJSDOMErrors: true
            }
        }
    }
});
