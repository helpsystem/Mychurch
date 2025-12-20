import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';

// Helper to copy directory recursively
function copyDirSync(src: string, dest: string) {
    if (!existsSync(src)) return;
    mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'copy-public-folders',
            closeBundle() {
                // Copy worship folder from frontend/public to dist
                const worshipSrc = path.resolve(__dirname, 'frontend/public/worship');
                const worshipDest = path.resolve(__dirname, 'dist/worship');
                copyDirSync(worshipSrc, worshipDest);
                console.log('✅ Copied worship folder to dist');
            }
        }
    ],
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
