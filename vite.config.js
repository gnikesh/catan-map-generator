import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: '/catan-board-generator/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
