import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: '/catan-map-generator/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
