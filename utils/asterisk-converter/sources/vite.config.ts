import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'utils/asterisk-converter/[name]-[hash][extname]',
        chunkFileNames: 'utils/asterisk-converter/[name]-[hash].js',
        entryFileNames: 'utils/asterisk-converter/[name]-[hash].js',
      }
    }
  }
})
