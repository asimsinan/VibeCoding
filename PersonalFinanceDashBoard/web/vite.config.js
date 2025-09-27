import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: process.env.NODE_ENV === 'production' ? '/' : '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
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
        'import.meta.env.VITE_API_URL': JSON.stringify(process.env.NODE_ENV === 'production'
            ? 'https://personalfinancedashboard.vercel.app/api'
            : (process.env.VITE_API_URL || 'http://localhost:3001/api')),
    },
});
