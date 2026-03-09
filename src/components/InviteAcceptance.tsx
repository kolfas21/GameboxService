import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from '../contexts/RouterContext'
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
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

const InviteAcceptance: React.FC = () => {
  const { navigate } = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  
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
      title: '¡Bienvenido!',
      message,
      onConfirm: closeModal
    })
  }

  const showErrorModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Error',
      message,
      onConfirm: closeModal
    })
  }

  useEffect(() => {
    // Verificar si hay parámetros de invitación en la URL
    const urlParams = new URLSearchParams(window.location.search)
    const userEmail = urlParams.get('email') || ''
    
    if (userEmail) {
      setEmail(userEmail)
    }
    
    // Verificar si hay una sesión activa (usuario ya autenticado)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Si ya está autenticado, redirigir al dashboard
        navigate('dashboard')
      }
    }
    
    checkSession()
  }, [navigate])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim() || !confirmPassword.trim() || !fullName.trim()) {
      showErrorModal('Por favor completa todos los campos')
      return
    }

    if (password.length < 6) {
      showErrorModal('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      showErrorModal('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      // Actualizar la contraseña del usuario
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          full_name: fullName.trim()
        }
      })

      if (updateError) {
        showErrorModal(`Error configurando contraseña: ${updateError.message}`)
      } else {
        // Buscar y actualizar el perfil con la información de la invitación
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Buscar la invitación pendiente para este email
          const { data: invite } = await supabase
            .from('pending_invites')
            .select('role')
            .eq('email', user.email)
            .single()

          // Crear o actualizar el perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email || '',
              full_name: fullName.trim(),
              role: invite?.role || 'receptionist'
            })

          if (profileError) {
            console.error('Error creando perfil:', profileError)
          }

          // Eliminar la invitación pendiente
          if (invite) {
            await supabase
              .from('pending_invites')
              .delete()
              .eq('email', user.email)
          }
        }

        showSuccessModal('¡Cuenta configurada exitosamente! Serás redirigido al sistema.')
        
        // Redirigir después de un momento
        setTimeout(() => {
          navigate('dashboard')
        }, 2000)
      }
    } catch (error: any) {
      showErrorModal(`Error inesperado: ${error.message}`)
    }

    setLoading(false)
  }

  const handleBackToLogin = () => {
    navigate('dashboard') // Cambiar a dashboard ya que no tenemos página de login separada
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-primary text-white text-center py-4">
                <UserPlus size={48} className="mb-3" />
                <h3 className="mb-0">Configurar Cuenta</h3>
                <p className="mb-0 opacity-75">Completa tu información para acceder al sistema</p>
              </div>
              
              <div className="card-body p-4">
                {email && (
                  <div className="alert alert-info d-flex align-items-center mb-4">
                    <CheckCircle size={16} className="me-2" />
                    <div>
                      <strong>Invitación para:</strong> {email}
                      <br />
                      <small>Configura tu contraseña para completar el registro</small>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSetPassword}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Nombre Completo <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu nombre completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Nueva Contraseña <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Confirmar Contraseña <span className="text-danger">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Configurando Cuenta...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} className="me-2" />
                          Completar Registro
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleBackToLogin}
                      disabled={loading}
                    >
                      Volver al Login
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="text-center mt-3">
              <div className="alert alert-warning">
                <AlertCircle size={16} className="me-2" />
                <strong>¿Tienes problemas?</strong>
                <br />
                <small>Contacta al administrador del sistema para obtener ayuda</small>
              </div>
            </div>
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

export default InviteAcceptance