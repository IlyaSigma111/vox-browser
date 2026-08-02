import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Android build: self-contained, relative asset URLs (loaded from file:///android_asset/app/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-android',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.android.html')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
