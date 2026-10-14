import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import seoFiles from 'vite-plugin-seo-files'

export default defineConfig({
  plugins: [
    react(),
    seoFiles({
      siteUrl: 'https://yourdomain.com', // ⚠️ Replace with your real domain
      generateSitemap: true,
      generateRobots: true,
      exclude: [],
      additionalUrls: [],
      disallow: [
        '/admin',
        '/dashboard',
        '/users',
        '/bible_quanes',
        '/reports',
        '/change-password',
        '/quiz',
        '/quiz/setup'
      ],
      routesFile: 'src/routes-list.js'
    })
  ],
  server: {
    proxy: { '/api': 'http://localhost:7000' }
  }
})