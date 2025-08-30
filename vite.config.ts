// vite.config.ts

import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    // This base path is for GitHub Pages deployment.
    base: '/Serendipity-OS/',
    resolve: {
        alias: {
            // FIX: __dirname is not available in ES modules. Using `path.resolve('.')` resolves from the current working directory, which is assumed to be the project root.
            '@': path.resolve('.'),
        }
    }
});