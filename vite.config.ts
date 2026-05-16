import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const isProduction = mode === 'production'
  const isRender = Boolean(env.RENDER)

  return {
    plugins: [react()],
    base: isProduction && isRender ? '/' : '/GameboxService/',
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
            dashboard: ['./src/components/Dashboard.tsx'],
            orders: [
              './src/components/ServiceQueue.tsx',
              './src/components/CreateOrder.tsx',
              './src/components/EditOrderModal.tsx'
            ],
            customers: ['./src/components/CustomerSearch.tsx'],
            print: [
              './src/components/ComandaPreview.tsx',
              './src/components/MultipleOrdersComandaPreview.tsx'
            ],
            admin: [
              './src/components/TechniciansManagement.tsx',
              './src/components/UserManagement.tsx'
            ]
          }
        }
      },
      // Aumentar el límite de advertencia a 600 KB
      chunkSizeWarningLimit: 600
    },
    // Eliminar console.* y debugger del bundle de producción
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : []
    },
    preview: {
      port: 4173,
      host: true
    }
  }
})
