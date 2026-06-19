import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CompanySettings } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(() => {
    // CARGAR DESDE LOCALSTORAGE AL INICIO (instantáneo, sin esperar Supabase)
    try {
      const cached = localStorage.getItem('company_settings_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        console.log('⚡ Settings cargados desde caché (instantáneo)')
        return parsed
      }
    } catch (err) {
      console.warn('Error al leer caché de settings:', err)
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Normalizar configuración con valores por defecto
  const normalizeSettings = useCallback((data: Record<string, unknown> | null): CompanySettings => {
    return {
      ...(data || {}),
      features_enabled: data?.features_enabled || {
        outsourcing: true,
        warranty_tracking: true,
        technician_stats: true
      },
      required_fields: data?.required_fields || {
        device_brand: true,
        device_model: true,
        serial_number: false,
        problem_description: true,
        observations: false,
        estimated_completion: false
      }
    } as CompanySettings
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 ============ CARGANDO CONFIGURACIÓN ============')
      console.log('🔍 Consultando tabla company_settings...')
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('❌ Error en consulta:', error)
        throw error
      }

      console.log('✅ ============ DATOS RECIBIDOS DE BD ============')
      console.log('📊 Data completa:', data)
      console.log('🖼️ Logo URL:', data?.logo_url || 'NO HAY LOGO')
      console.log('🏢 Company name:', data?.company_name || 'NO HAY NOMBRE')
      console.log('📍 ID:', data?.id || 'NO HAY ID')
      
      const normalizedData = data ? normalizeSettings(data) : null
      setSettings(normalizedData)
      
      // GUARDAR EN CACHÉ para la próxima carga (instantánea)
      if (normalizedData) {
        try {
          localStorage.setItem('company_settings_cache', JSON.stringify(normalizedData))
          console.log('💾 Settings guardados en caché local')
        } catch (err) {
          console.warn('⚠️ No se pudo guardar en caché:', err)
        }
      }
      
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('❌ ============ ERROR FATAL ============')
      console.error('Error completo:', err)
    } finally {
      setLoading(false)
      console.log('🏁 Carga de configuración finalizada')
    }
  }, [normalizeSettings])

  const updateSettings = async (
    updates: Partial<CompanySettings>
  ): Promise<{ error: string | null }> => {
    if (!user || user.role !== 'admin') {
      console.error('❌ Permiso denegado: usuario no es admin')
      return { error: 'Solo administradores pueden actualizar la configuración' }
    }

    try {
      console.log('💾 ============ ACTUALIZANDO CONFIGURACIÓN ============')
      console.log('📝 Updates a aplicar:', updates)
      console.log('👤 Usuario:', user.email, '| Role:', user.role)
      console.log('🆔 Settings ID actual:', settings?.id || 'NO HAY ID')
      
      // Si settings existe, UPDATE; sino, INSERT
      if (settings?.id) {
        console.log('🔧 Modo: UPDATE (registro existente)')
        console.log('🎯 Actualizando registro ID:', settings.id)
        
        const { data, error } = await supabase
          .from('company_settings')
          .update(updates)
          .eq('id', settings.id)
          .select() // Obtener los datos actualizados

        if (error) {
          console.error('❌ Error en UPDATE:', error)
          throw error
        }
        
        console.log('✅ UPDATE exitoso. Datos actualizados:', data)
      } else {
        console.log('➕ Modo: INSERT (nuevo registro)')
        
        const { data, error } = await supabase
          .from('company_settings')
          .insert([updates])
          .select() // Obtener los datos insertados

        if (error) {
          console.error('❌ Error en INSERT:', error)
          throw error
        }
        
        console.log('✅ INSERT exitoso. Datos insertados:', data)
      }

      console.log('✅ ============ CONFIGURACIÓN GUARDADA EN BD ============')
      
      // Refetch después de actualizar
      console.log('🔄 Refrescando configuración después de guardar...')
      await fetchSettings()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ ============ ERROR AL ACTUALIZAR ============')
      console.error('Error completo:', err)
      console.error('Mensaje:', errorMessage)
      return { error: errorMessage }
    }
  }

  const uploadLogo = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    if (!user || user.role !== 'admin') {
      return { url: null, error: 'Solo administradores pueden subir el logo' }
    }

    try {
      console.log('📁 Archivo seleccionado:', file.name, 'Tamaño:', (file.size / 1024).toFixed(2), 'KB')
      
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        return { url: null, error: 'Tipo de archivo no válido. Use JPG, PNG, GIF o WebP.' }
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return { url: null, error: 'El archivo es demasiado grande. Máximo 2MB.' }
      }

      // Eliminar logo anterior si existe
      if (settings?.logo_url) {
        try {
          // Extraer nombre del archivo, eliminando parámetros de query (?t=...)
          const urlWithoutParams = settings.logo_url.split('?')[0]
          const oldLogoFileName = urlWithoutParams.split('/').pop()
          console.log('🔍 Intentando eliminar logo anterior:', oldLogoFileName)
          
          if (oldLogoFileName && oldLogoFileName.startsWith('logo-')) {
            const { error: deleteError } = await supabase.storage
              .from('company-assets')
              .remove([`logos/${oldLogoFileName}`])
            
            if (deleteError) {
              console.warn('⚠️ Error al eliminar logo anterior:', deleteError)
            } else {
              console.log('✅ Logo anterior eliminado:', oldLogoFileName)
            }
          }
        } catch (deleteErr) {
          console.warn('⚠️ Excepción al eliminar logo anterior:', deleteErr)
          // Continuar aunque falle la eliminación
        }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      console.log('⬆️ Subiendo nuevo logo:', filePath)

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // No sobrescribir, siempre crear nuevo
        })

      if (uploadError) {
        console.error('❌ Error de Supabase Storage:', uploadError)
        throw uploadError
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      console.log('✅ Logo subido exitosamente. URL pública:', data.publicUrl)
      return { url: data.publicUrl, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error uploading logo:', err)
      return { url: null, error: errorMessage }
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadLogo,
    refreshSettings: fetchSettings
  }
}
