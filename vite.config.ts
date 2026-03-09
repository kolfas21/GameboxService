import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' && process.env.RENDER ? '/' : '/GameboxService/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    // Configuración para code splitting optimizado
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - librerías externas
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'icons-vendor': ['lucide-react'],
          
          // Chunks por funcionalidad
          'dashboard': [
            './src/components/Dashboard.tsx'
          ],
          'orders': [
            './src/components/ServiceQueue.tsx',
            './src/components/CreateOrder.tsx',
            './src/components/EditOrderModal.tsx'
          ],
          'customers': [
            './src/components/CustomerSearch.tsx'
          ],
          'print': [
            './src/components/ComandaPreview.tsx',
            './src/components/MultipleOrdersComandaPreview.tsx'
          ],
          'admin': [
            './src/components/TechniciansManagement.tsx',
            './src/components/UserManagement.tsx'
          ]
        }
      }
    },
    // Aumentar el límite de advertencia a 600 KB
    chunkSizeWarningLimit: 600
  },
  preview: {
    port: 4173,
    host: true
  }
})
