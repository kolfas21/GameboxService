import React, { useState } from 'react'
import { Send, Mail, AlertCircle } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'

interface ModalState {
  isOpen: boolean
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
  confirmText?: string
}

const EmailTester: React.FC = () => {
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const showSuccessModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: '¡Correo Enviado!',
      message,
      onConfirm: closeModal
    })
  }

  const showErrorModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Error de Envío',
      message,
      onConfirm: closeModal
    })
  }

  const showInfoModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'info',
      title: 'Información',
      message,
      onConfirm: closeModal
    })
  }

  const testEmailSending = async () => {
    if (!testEmail.trim()) {
      showErrorModal('Por favor ingresa un email para la prueba')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      showErrorModal('Por favor ingresa un email válido')
      return
    }

    setLoading(true)

    try {
      // Simular envío de correo de prueba
      // En una implementación real, aquí llamarías a tu API de envío de correos
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Prueba de Correo - GameBox Service',
          html: `
            <h2>🎮 Prueba de Correo - GameBox Service</h2>
            <p>Este es un correo de prueba para verificar que el sistema de invitaciones funciona correctamente.</p>
            <p>Si recibes este correo, la configuración SMTP está funcionando.</p>
            <hr>
            <p><small>Este correo fue enviado como prueba desde el sistema de gestión GameBox Service.</small></p>
          `
        })
      })

      if (response.ok) {
        showSuccessModal(`✅ Correo de prueba enviado exitosamente a ${testEmail}. Revisa tu bandeja de entrada y spam.`)
      } else {
        const errorData = await response.text()
        showErrorModal(`❌ Error enviando correo: ${errorData}`)
      }
    } catch (error) {
      // Como no tenemos backend configurado, mostramos información útil
      showInfoModal(`
        📧 Configuración SMTP Actual:
        
        • Servidor: smtp.gmail.com:587
        • Usuario: sling.lite@gmail.com
        • Contraseña: zwti mtpf rzdl soic
        
        🔧 Para habilitar el envío automático:
        1. Configura un backend (Node.js/Express)
        2. Instala nodemailer
        3. Crea endpoint /api/test-email
        4. Conecta con Supabase Edge Functions
        
        💡 Alternativa actual:
        Ve a Supabase Dashboard → Authentication → Users → "Invite a user" para enviar invitaciones manualmente.
      `)
    }

    setLoading(false)
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-warning text-dark d-flex align-items-center">
        <Send size={20} className="me-2" />
        <h5 className="mb-0">Prueba de Envío de Correos</h5>
      </div>
      
      <div className="card-body">
        <div className="alert alert-info d-flex align-items-start">
          <AlertCircle size={16} className="me-2 mt-1" />
          <div>
            <strong>¿Por qué no llegan los correos?</strong>
            <ul className="mb-0 mt-2 small">
              <li>El sistema actualmente solo registra invitaciones en la base de datos</li>
              <li>No está configurado el envío automático de correos</li>
              <li>Necesitas crear las cuentas manualmente en Supabase</li>
            </ul>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label fw-semibold">
              Email de Prueba
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <Mail size={16} className="text-muted" />
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="tu-email@ejemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-text">
              Ingresa tu email para probar si el sistema puede enviar correos
            </div>
          </div>
          
          <div className="col-md-4 d-flex align-items-end">
            <button
              className="btn btn-warning w-100"
              onClick={testEmailSending}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} className="me-2" />
                  Enviar Prueba
                </>
              )}
            </button>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-md-6">
            <h6 className="fw-semibold">✅ Configuración SMTP</h6>
            <ul className="small mb-0">
              <li><strong>Servidor:</strong> smtp.gmail.com:587</li>
              <li><strong>Usuario:</strong> sling.lite@gmail.com</li>
              <li><strong>Seguridad:</strong> TLS habilitado</li>
              <li><strong>Estado:</strong> <span className="text-success">Configurado</span></li>
            </ul>
          </div>
          
          <div className="col-md-6">
            <h6 className="fw-semibold">🔧 Estado del Sistema</h6>
            <ul className="small mb-0">
              <li><span className="text-success">✅</span> Base de datos: Funcionando</li>
              <li><span className="text-success">✅</span> Registro de invitaciones: Activo</li>
              <li><span className="text-warning">⚠️</span> Envío automático: Pendiente</li>
              <li><span className="text-info">🔄</span> Método actual: Manual via Supabase</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  )
}

export default EmailTester