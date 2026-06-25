import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  assetsInclude: ['**/*.pptx'],
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
  },
  preview: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
  },
})
