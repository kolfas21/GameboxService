/**
 * Validación de configuración de variables de entorno
 * Se ejecuta al inicio de la aplicación para asegurar que todas las variables necesarias estén presentes
 */

export const validateConfig = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]

  const missing = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  )

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file.`
    )
  }

  // Validar formato de URL
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url.startsWith('https://')) {
    throw new Error('❌ VITE_SUPABASE_URL must start with https://')
  }

  // Validar que la anon key no esté vacía
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (anonKey.length < 20) {
    throw new Error('❌ VITE_SUPABASE_ANON_KEY appears to be invalid (too short)')
  }
}
