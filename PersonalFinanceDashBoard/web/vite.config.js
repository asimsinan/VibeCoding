import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const isProd = mode === 'production';
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        base: isProd ? '/' : '/',
        publicDir: 'public', // Explicitly set public directory
        server: {
            proxy: {
                '/api': {
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, '')
                }
            }
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        }
                    }
                }
            }
        },
        define: {
            'import.meta.env.VITE_API_URL': JSON.stringify(isProd
                ? 'https://personalfinancedashboard.vercel.app/api'
                : (process.env.VITE_API_URL || 'http://localhost:3001/api')),
        },
    };
});
