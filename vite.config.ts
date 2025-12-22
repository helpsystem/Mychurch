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
        // 🚀 بهینه‌سازی برای موبایل - تقسیم کد به فایل‌های کوچکتر
        rollupOptions: {
            output: {
                manualChunks: {
                    // کتابخانه‌های React - جدا
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // آیکون‌ها - جدا (سنگین هستند)
                    'vendor-icons': ['lucide-react'],
                    // کتابخانه‌های UI
                    'vendor-ui': ['framer-motion', 'react-hot-toast'],
                    // کتاب مقدس و PDF
                    'vendor-bible': ['react-pageflip', 'pdfjs-dist'],
                    // چارت‌ها
                    'vendor-charts': ['chart.js', 'react-chartjs-2'],
                }
            }
        },
        // کاهش حجم با حذف console.log در پروداکشن
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        // افزایش محدودیت chunk برای هشدار
        chunkSizeWarningLimit: 1000,
    },
    envDir: '..',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'frontend/src'),
        },
    },
    // 🚀 بهینه‌سازی dev server
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            }
        }
    }
});
