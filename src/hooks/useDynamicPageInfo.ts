import { useEffect } from 'react'
import { useCompanySettings } from './useCompanySettings'

/**
 * Hook para actualizar dinámicamente el título y favicon de la página
 * según la configuración de la empresa en la base de datos
 */
export const useDynamicPageInfo = () => {
  const { settings } = useCompanySettings()

  useEffect(() => {
    // Actualizar título de la página
    if (settings?.company_name) {
      document.title = `${settings.company_name} - Gestión de Reparaciones`
      console.log('📄 Título actualizado:', document.title)
    } else {
      document.title = 'GameBox Service - Gestión de Reparaciones'
    }

    // Actualizar favicon si hay logo personalizado
    if (settings?.logo_url) {
      // Actualizar favicon principal
      let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      favicon.href = settings.logo_url
      
      // Actualizar apple-touch-icon
      let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement('link')
        appleTouchIcon.rel = 'apple-touch-icon'
        document.head.appendChild(appleTouchIcon)
      }
      appleTouchIcon.href = settings.logo_url

      console.log('🎨 Favicon actualizado:', settings.logo_url)
    }
  }, [settings?.company_name, settings?.logo_url])
}
