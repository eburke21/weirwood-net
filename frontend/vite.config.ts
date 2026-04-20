import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vendor-split so the ~800kB single bundle becomes several smaller
        // chunks. Repeat visits serve unchanged vendor libs from cache even
        // when the app code changes.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('d3')) return 'vendor-d3'
          if (id.includes('@chakra-ui') || id.includes('@emotion')) return 'vendor-chakra'
          if (id.includes('framer-motion')) return 'vendor-framer'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react'
          }
          return 'vendor'
        },
      },
    },
  },
})
