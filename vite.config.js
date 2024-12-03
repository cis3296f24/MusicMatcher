import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/spotify': {
                target: 'https://accounts.spotify.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/spotify/, '')
            }
        }
    }
});