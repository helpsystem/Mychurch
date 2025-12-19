import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: 'frontend',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    envDir: '..',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'frontend/src'),
        },
    },
});
