import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AlertTriangle, User, RefreshCw, CheckCircle } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'

interface ModalState {
  isOpen: boolean
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
  showCancel?: boolean
  confirmText?: string
}

const UserDiagnostic: React.FC = () => {
  const { user, session } = useAuth()
  
  // Estado para el modal
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
      title: '¡Éxito!',
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

  const fixUserRole = async () => {
    if (!session?.user) {
      showErrorModal('No hay sesión activa')
      return
    }

    try {
      // Actualizar rol directamente en la base de datos
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', session.user.id)

      if (error) {
        showErrorModal(`Error: ${error.message}`)
      } else {
        showSuccessModal('Rol actualizado a admin. Por favor haz logout y login para ver los cambios reflejados.')
      }
    } catch (error: any) {
      showErrorModal(`Error: ${error.message}`)
    }
  }

  const createAdminProfile = async () => {
    if (!session?.user) {
      showErrorModal('No hay sesión activa')
      return
    }

    try {
      // Crear o actualizar perfil con rol admin
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: 'Administrador',
          role: 'admin'
        })

      if (error) {
        showErrorModal(`Error: ${error.message}`)
      } else {
        showSuccessModal('Perfil de admin creado. Por favor haz logout y login para ver los cambios reflejados.')
      }
    } catch (error: any) {
      showErrorModal(`Error: ${error.message}`)
    }
  }

  return (
    <div className="card border-warning">
      <div className="card-header bg-warning text-dark">
        <h6 className="mb-0">
          <AlertTriangle size={16} className="me-2" />
          Diagnóstico de Usuario
        </h6>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6>Información de Sesión:</h6>
            <ul className="list-unstyled small">
              <li><strong>Email:</strong> {session?.user?.email || 'No disponible'}</li>
              <li><strong>ID:</strong> {session?.user?.id || 'No disponible'}</li>
              <li><strong>Confirmado:</strong> {session?.user?.email_confirmed_at ? '✅ Sí' : '❌ No'}</li>
            </ul>
          </div>
          <div className="col-md-6">
            <h6>Información de Perfil:</h6>
            <ul className="list-unstyled small">
              <li><strong>Nombre:</strong> {user?.full_name || 'No disponible'}</li>
              <li><strong>Rol:</strong> {user?.role || 'No disponible'}</li>
              <li><strong>Perfil existe:</strong> {user ? '✅ Sí' : '❌ No'}</li>
            </ul>
          </div>
        </div>
        
        <hr />
        
        <div className="d-flex gap-2 flex-wrap">
          {user?.role !== 'admin' && (
            <button 
              onClick={fixUserRole}
              className="btn btn-warning btn-sm"
            >
              <RefreshCw size={14} className="me-1" />
              Convertir en Admin
            </button>
          )}
          
          {!user && (
            <button 
              onClick={createAdminProfile}
              className="btn btn-success btn-sm"
            >
              <User size={14} className="me-1" />
              Crear Perfil Admin
            </button>
          )}
          
          {user?.role === 'admin' && (
            <div className="alert alert-success py-2 px-3 mb-0 d-inline-flex align-items-center">
              <CheckCircle size={14} className="me-2" />
              Todo correcto - Eres administrador
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <small className="text-muted">
            Si los cambios no se reflejan, haz logout y login nuevamente.
          </small>
        </div>
      </div>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
      />
    </div>
  )
}

export default UserDiagnostic