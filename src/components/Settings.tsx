import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Building2, 
  Upload, 
  Save, 
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Zap,
  CheckSquare
} from 'lucide-react'
import { useCompanySettings } from '../hooks'
import { useModal } from '../hooks/useModal'
import { CustomModal } from './ui/CustomModal'
import type { CompanySettings } from '../types'

const Settings: React.FC = () => {
  const { settings, loading, updateSettings, uploadLogo, refreshSettings } = useCompanySettings()
  const { modal, showSuccess, showError, showConfirm, closeModal } = useModal()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<Partial<CompanySettings>>({
    company_name: '',
    features_enabled: {
      outsourcing: true,
      warranty_tracking: true,
      technician_stats: true
    },
    required_fields: {
      device_brand: true,
      device_model: true,
      serial_number: false,
      problem_description: true,
      observations: false,
      estimated_completion: false
    }
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        features_enabled: settings.features_enabled || {
          outsourcing: true,
          warranty_tracking: true,
          technician_stats: true
        },
        required_fields: settings.required_fields || {
          device_brand: true,
          device_model: true,
          serial_number: false,
          problem_description: true,
          observations: false,
          estimated_completion: false
        }
      })
      setLogoPreview(settings.logo_url || null)
    }
  }, [settings])

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFeatureToggle = (feature: keyof CompanySettings['features_enabled']) => {
    setFormData(prev => ({
      ...prev,
      features_enabled: {
        ...prev.features_enabled!,
        [feature]: !prev.features_enabled![feature]
      }
    }))
  }

  const handleRequiredFieldToggle = (field: keyof CompanySettings['required_fields']) => {
    setFormData(prev => ({
      ...prev,
      required_fields: {
        ...prev.required_fields!,
        [field]: !prev.required_fields![field]
      }
    }))
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showError('Error de Archivo', 'Tipo de archivo no válido. Use JPG, PNG, GIF o WebP.')
      return
    }

    // Validar tamaño (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
      showError('Error de Archivo', 'El archivo es demasiado grande. Máximo 2MB.')
      return
    }

    setSelectedFile(file)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadLogo = async () => {
    if (!selectedFile) {
      console.warn('⚠️ No hay archivo seleccionado')
      return
    }

    console.log('🚀 ============ INICIANDO SUBIDA DE LOGO ============')
    console.log('📁 Archivo:', selectedFile.name, '| Tamaño:', (selectedFile.size / 1024).toFixed(2), 'KB')
    console.log('⚙️ Settings actuales:', settings)
    console.log('🖼️ Logo_url actual:', settings?.logo_url || 'NO HAY LOGO')
    
    setUploading(true)
    const { url, error } = await uploadLogo(selectedFile)
    setUploading(false)

    if (error) {
      console.error('❌ ============ ERROR EN SUBIDA ============')
      console.error('Error:', error)
      showError('Error al Subir Logo', error)
      return
    }

    if (url) {
      console.log('✅ ============ LOGO SUBIDO A STORAGE ============')
      console.log('📍 URL del archivo subido:', url)
      
      // Actualizar en la base de datos SIN timestamp (para evitar problemas)
      console.log('💾 Guardando URL en base de datos...')
      console.log('🔍 URL que se guardará:', url)
      
      const { error: updateError } = await updateSettings({ logo_url: url })
      
      if (updateError) {
        console.error('❌ ============ ERROR AL GUARDAR EN BD ============')
        console.error('Error:', updateError)
        showError('Error al Guardar', updateError)
      } else {
        console.log('✅ ============ URL GUARDADA EN BD ============')
        
        // Refrescar settings manualmente
        console.log('🔄 Refrescando configuración desde BD...')
        await refreshSettings()
        
        // Dar tiempo a que se actualice el estado
        setTimeout(() => {
          console.log('📊 ============ ESTADO DESPUÉS DE REFRESH ============')
          console.log('Settings después del refresh:', settings)
          console.log('Logo_url después del refresh:', settings?.logo_url)
        }, 100)
        
        setSelectedFile(null)
        
        // Recargar página automáticamente
        setTimeout(() => {
          console.log('🔃 ============ RECARGANDO PÁGINA ============')
          window.location.reload()
        }, 1000)
      }
    } else {
      console.error('❌ ============ URL VACÍA DESPUÉS DE SUBIDA ============')
      showError('Error', 'No se obtuvo URL del archivo subido')
    }
  }

  const handleSave = async () => {
    // Validaciones básicas
    if (!formData.company_name?.trim()) {
      showError('Campo Obligatorio', 'El nombre de la empresa es obligatorio')
      return
    }

    showConfirm(
      '¿Guardar Cambios?',
      'Esto actualizará la configuración de la empresa en todo el sistema.',
      async () => {
        setSaving(true)
        const { error } = await updateSettings(formData)
        setSaving(false)

        if (error) {
          showError('Error al Guardar', error)
        } else {
          showSuccess('¡Éxito!', 'Configuración guardada exitosamente')
        }
      },
      undefined,
      { confirmText: 'Guardar' }
    )
  }

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="row justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="col-auto text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white p-3 p-md-4">
              <div className="d-flex align-items-center">
                <SettingsIcon size={40} className="me-3" />
                <div>
                  <h2 className="h4 fw-bold mb-1">Configuración del Sistema</h2>
                  <p className="mb-0 opacity-90">Personaliza la información de tu negocio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Sección de Logo */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0">
                <ImageIcon size={20} className="me-2" />
                Logo de la Empresa
              </h5>
            </div>
            <div className="card-body text-center d-flex flex-column justify-content-between">
              <div className="mb-3 flex-grow-1 d-flex align-items-center justify-content-center">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="img-fluid rounded border"
                    style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div 
                    className="border rounded bg-light d-flex align-items-center justify-content-center w-100"
                    style={{ height: '200px' }}
                  >
                    <ImageIcon size={60} className="text-muted" />
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2">
                  <label htmlFor="logo-upload" className="btn btn-outline-primary w-100">
                    <Upload size={16} className="me-2" />
                    Seleccionar Logo
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoSelect}
                    className="d-none"
                  />
                </div>

                {selectedFile && (
                  <button
                    onClick={handleUploadLogo}
                    disabled={uploading}
                    className="btn btn-success w-100"
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-2" />
                        Guardar Logo
                      </>
                    )}
                  </button>
                )}

                <small className="text-muted d-block mt-2">
                  JPG, PNG, GIF o WebP. Máximo 2MB
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Configuración */}
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0">
                <Building2 size={20} className="me-2" />
                Información de la Empresa
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Nombre de la Empresa */}
                <div className="col-12">
                  <label className="form-label fw-bold">Nombre de la Empresa</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="GameBox Service"
                  />
                  <small className="text-muted d-block mt-1">
                    Este nombre aparecerá en las comandas y stickers de servicio
                  </small>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="card-footer bg-transparent border-0 pb-3">
              <div className="d-flex justify-content-end gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="me-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Control de Funcionalidades */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0">
                <Zap size={20} className="me-2" />
                Funcionalidades del Sistema
              </h5>
              <small className="text-muted">
                Activa o desactiva módulos completos del sistema
              </small>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Tercerización */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className={`p-3 rounded border ${formData.features_enabled?.outsourcing ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-secondary'}`}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Tercerización</h6>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 bg-transparent"
                        onClick={() => handleFeatureToggle('outsourcing')}
                      >
                        {formData.features_enabled?.outsourcing ? (
                          <ToggleRight size={32} className="text-success" />
                        ) : (
                          <ToggleLeft size={32} className="text-secondary" />
                        )}
                      </button>
                    </div>
                    <small className="text-muted">
                      Permite enviar reparaciones a talleres externos y hacer seguimiento
                    </small>
                  </div>
                </div>

                {/* Seguimiento de Garantías */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className={`p-3 rounded border ${formData.features_enabled?.warranty_tracking ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-secondary'}`}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Garantías</h6>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 bg-transparent"
                        onClick={() => handleFeatureToggle('warranty_tracking')}
                      >
                        {formData.features_enabled?.warranty_tracking ? (
                          <ToggleRight size={32} className="text-success" />
                        ) : (
                          <ToggleLeft size={32} className="text-secondary" />
                        )}
                      </button>
                    </div>
                    <small className="text-muted">
                      Habilita la búsqueda y gestión de órdenes bajo garantía
                    </small>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Campos Obligatorios */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0">
                <CheckSquare size={20} className="me-2" />
                Campos Obligatorios en Órdenes
              </h5>
              <small className="text-muted">
                Define qué campos deben ser obligatorios al crear órdenes de servicio
              </small>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Marca del Dispositivo */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="p-3 rounded border bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="d-block">Marca del Dispositivo</strong>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 bg-transparent"
                        onClick={() => handleRequiredFieldToggle('device_brand')}
                      >
                        {formData.required_fields?.device_brand ? (
                          <ToggleRight size={32} className="text-success" />
                        ) : (
                          <ToggleLeft size={32} className="text-secondary" />
                        )}
                      </button>
                    </div>
                    <small className="text-muted">PlayStation, Xbox, Nintendo, etc.</small>
                  </div>
                </div>

                {/* Modelo del Dispositivo */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="p-3 rounded border bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="d-block">Modelo del Dispositivo</strong>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 bg-transparent"
                        onClick={() => handleRequiredFieldToggle('device_model')}
                      >
                        {formData.required_fields?.device_model ? (
                          <ToggleRight size={32} className="text-success" />
                        ) : (
                          <ToggleLeft size={32} className="text-secondary" />
                        )}
                      </button>
                    </div>
                    <small className="text-muted">PS5, Xbox Series X, Switch OLED, etc.</small>
                  </div>
                </div>

                {/* Número de Serie */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="p-3 rounded border bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="d-block">Número de Serie</strong>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 bg-transparent"
                        onClick={() => handleRequiredFieldToggle('serial_number')}
                      >
                        {formData.required_fields?.serial_number ? (
                          <ToggleRight size={32} className="text-success" />
                        ) : (
                          <ToggleLeft size={32} className="text-secondary" />
                        )}
                      </button>
                    </div>
                    <small className="text-muted">Identificador único del dispositivo</small>
                  </div>
                </div>

                {/* Descripción del Problema */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="p-3 rounded border bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="d-block">Descripción del Problema</strong>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 bg-transparent"
                        onClick={() => handleRequiredFieldToggle('problem_description')}
                      >
                        {formData.required_fields?.problem_description !== false ? (
                          <ToggleRight size={32} className="text-success" />
                        ) : (
                          <ToggleLeft size={32} className="text-secondary" />
                        )}
                      </button>
                    </div>
                    <small className="text-muted">Detalle del fallo o problema reportado</small>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="p-3 rounded border bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="d-block">Observaciones</strong>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 bg-transparent"
                        onClick={() => handleRequiredFieldToggle('observations')}
                      >
                        {formData.required_fields?.observations ? (
                          <ToggleRight size={32} className="text-success" />
                        ) : (
                          <ToggleLeft size={32} className="text-secondary" />
                        )}
                      </button>
                    </div>
                    <small className="text-muted">Notas adicionales sobre el dispositivo</small>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mt-3 mb-0">
                <small>
                  <strong>💡 Nota:</strong> Los campos marcados como obligatorios no permitirán crear órdenes sin completarlos.
                  Los campos siempre obligatorios son: Cliente y Tipo de Dispositivo.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
      />
    </div>
  )
}

export default Settings
