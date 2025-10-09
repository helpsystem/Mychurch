import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: true,
        proxy: {
          '/api': {
            target: 'http://localhost:3006',
            changeOrigin: true,
            secure: false
          }
        }
      },
      
      build: {
        // Production build optimizations
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        reportCompressedSize: true,
        sourcemap: isProduction ? false : true,
        
        // Chunk size optimization
        chunkSizeWarningLimit: 1000,
        
        rollupOptions: {
          output: {
            // Automatic chunk splitting
            manualChunks: undefined,
            
            // Asset naming for better caching
            chunkFileNames: (chunkInfo) => {
              if (chunkInfo.name.includes('vendor')) {
                return 'assets/vendor/[name]-[hash].js';
              }
              return 'assets/chunks/[name]-[hash].js';
            },
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              const extType = info[info.length - 1];
              
              // Organize assets by type
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                return `assets/images/[name]-[hash].${extType}`;
              }
              if (/woff2?|eot|ttf|otf/i.test(extType)) {
                return `assets/fonts/[name]-[hash].${extType}`;
              }
              if (/css/i.test(extType)) {
                return `assets/styles/[name]-[hash].${extType}`;
              }
              return `assets/[name]-[hash].${extType}`;
            }
          },
          
          // External dependencies that shouldn't be bundled
          external: isProduction ? [] : []
        },
        
        // Asset handling
        assetsInlineLimit: 4096, // Inline assets smaller than 4kb
        
        // CSS code splitting
        cssCodeSplit: true,
        
        // Compression and optimization
        terserOptions: isProduction ? {
          compress: {
            drop_console: true, // Remove console.logs in production
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug']
          },
          mangle: {
            safari10: true
          }
        } : undefined
      },
      
      // CSS preprocessing
      css: {
        devSourcemap: !isProduction,
        preprocessorOptions: {
          scss: {
            additionalData: `@import "@/styles/variables.scss";`
          }
        }
      },
      
      // Development optimizations
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'lucide-react',
          'axios'
        ],
        exclude: ['@google/genai'] // May have ESM issues
      },
      
      define: {
        'process.env.VITE_API_BASE': JSON.stringify('/api'),
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
        '__DEV__': !isProduction
      },
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@assets': path.resolve(__dirname, './public'),
          '@components': path.resolve(__dirname, './components'),
          '@pages': path.resolve(__dirname, './pages'),
          '@lib': path.resolve(__dirname, './lib'),
          '@hooks': path.resolve(__dirname, './hooks'),
          '@context': path.resolve(__dirname, './context'),
          '@services': path.resolve(__dirname, './services')
        }
      },
      
      // Plugin configurations for production
      esbuild: {
        // Remove unused imports and dead code
        treeShaking: true,
        // Production-only optimizations
        ...(isProduction && {
          drop: ['console', 'debugger'],
          minifyIdentifiers: true,
          minifySyntax: true,
          minifyWhitespace: true
        })
      },
      
      // Preview configuration for production testing
      preview: {
        host: '0.0.0.0',
        port: 4173,
        strictPort: true
      }
    };
});
