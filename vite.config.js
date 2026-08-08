import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // split the heavy vendor libs out of the app bundle: parallel loading
        // over HTTP/2 + stable long-term cache (they change far less than the app)
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('three')) return 'three' // three, three-stdlib, @react-three/*
          if (id.includes('react')) return 'react' // react, react-dom, jsx-runtime
          if (id.includes('gsap')) return 'gsap'
          return undefined // zustand, scheduler etc. stay with their importers
        },
      },
    },
  },
})
