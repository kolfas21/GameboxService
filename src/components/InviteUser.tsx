import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Mail, UserPlus, Send, AlertCircle } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'
import type { UserRole } from '../types'

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

const InviteUser: React.FC = () => {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('receptionist')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  // Solo admins pueden enviar invitaciones
  if (user?.role !== 'admin') {
    return (
      <div className="alert alert-warning d-flex align-items-center">
        <AlertCircle size={20} className="me-2" />
        Solo los administradores pueden enviar invitaciones.
      </div>
    )
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const showSuccessModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: '¡Invitación Enviada!',
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

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !fullName.trim()) {
      showErrorModal('Por favor completa todos los campos obligatorios')
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showErrorModal('Por favor ingresa un email válido')
      return
    }

    setLoading(true)

    try {
      // Crear una invitación pendiente directamente
      const { error: inviteError } = await supabase
        .from('pending_invites')
        .insert({
          email: email.toLowerCase(),
          full_name: fullName.trim(),
          role: role,
          invited_by: user.id
        })

      if (inviteError) {
        console.error('Error creando invitación:', inviteError)
        
        // Verificar si el error es por email duplicado
        if (inviteError.code === '23505') {
          showErrorModal('Ya existe una invitación pendiente para este email')
        } else {
          showErrorModal(`Error: ${inviteError.message}`)
        }
      } else {
        showSuccessModal(`Invitación para "${fullName}" registrada exitosamente. Ve a Supabase → Authentication → Users → "Invite a user" para enviar la invitación a ${email}.`)
        
        // Limpiar formulario
        setEmail('')
        setFullName('')
        setRole('receptionist')
      }
    } catch (error: any) {
      console.error('Error:', error)
      showErrorModal(`Error inesperado: ${error.message}`)
    }

    setLoading(false)
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'receptionist':
        return 'Recepcionista'
      case 'technician':
        return 'Técnico'
    }
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <UserPlus size={20} className="me-2" />
        <h5 className="mb-0">Invitar Nuevo Usuario</h5>
      </div>
      
      <div className="card-body">
        <div className="alert alert-info d-flex align-items-start mb-4">
          <Mail size={16} className="me-2 mt-1" />
          <div>
            <strong>¿Cómo funciona? (Versión Temporal)</strong>
            <ul className="mb-0 mt-2 small">
              <li>Se registra el usuario como "pendiente" en la base de datos</li>
              <li>Deberás crear su cuenta manualmente en Supabase Dashboard</li>
              <li>El rol se asignará automáticamente cuando se registre</li>
              <li><strong>Próximamente:</strong> Invitaciones automáticas por email</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSendInvitation}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Email del Usuario <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <Mail size={16} className="text-muted" />
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="usuario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Nombre Completo <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre y apellido"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Rol del Usuario
              </label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={loading}
              >
                <option value="receptionist">Recepcionista</option>
                <option value="technician">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
              <div className="form-text">
                Rol seleccionado: <strong>{getRoleDisplayName(role)}</strong>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2 mt-4">
            <button
              type="submit"
              className="btn btn-primary flex-grow-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Enviando Invitación...
                </>
              ) : (
                <>
                  <Send size={16} className="me-2" />
                  Enviar Invitación
                </>
              )}
            </button>
            
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setEmail('')
                setFullName('')
                setRole('receptionist')
              }}
              disabled={loading}
            >
              Limpiar
            </button>
          </div>
        </form>
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

export default InviteUser