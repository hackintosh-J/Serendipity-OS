// vite.config.ts

import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    // This base path is for GitHub Pages deployment.
    base: '/Serendipity-OS/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    }
});