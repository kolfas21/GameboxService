import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.tsx'
import { validateConfig } from './config/validateConfig'

// Validar configuración antes de iniciar la app
try {
  validateConfig()
} catch (error) {
  console.error(error)
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px; background: #fee2e2; color: #991b1b; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 16px;">❌ Error de Configuración</h2>
        <p style="margin-bottom: 12px; font-size: 16px;">${error instanceof Error ? error.message : 'Error desconocido'}</p>
        <p style="margin-bottom: 20px; color: #7f1d1d;">Verifica tu archivo .env y recarga la página.</p>
        <button 
          onclick="location.reload()" 
          style="background: #dc2626; color: white; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;"
        >
          Recargar Página
        </button>
      </div>
    `
  }
  throw error
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
