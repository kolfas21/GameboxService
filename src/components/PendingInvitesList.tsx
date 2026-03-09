import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Calendar, User, Trash2, RefreshCw } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'

interface PendingInvite {
  id: string
  email: string
  full_name: string
  role: string
  invited_by: string
  created_at: string
  status: string
}

interface ModalState {
  isOpen: boolean
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
}

const PendingInvitesList: React.FC = () => {
  const { user } = useAuth()
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  // Solo admins pueden ver las invitaciones
  if (user?.role !== 'admin') {
    return (
      <div className="alert alert-warning">
        Solo los administradores pueden ver las invitaciones pendientes.
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

  const showConfirmModal = (message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar Acción',
      message,
      onConfirm
    })
  }

  const loadInvites = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pending_invites')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando invitaciones:', error)
        showErrorModal(`Error: ${error.message}`)
      } else {
        setInvites(data || [])
      }
    } catch (error: any) {
      console.error('Error:', error)
      showErrorModal(`Error inesperado: ${error.message}`)
    }
    setLoading(false)
  }

  const deleteInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pending_invites')
        .delete()
        .eq('id', id)

      if (error) {
        showErrorModal(`Error eliminando invitación: ${error.message}`)
      } else {
        showSuccessModal('Invitación eliminada exitosamente')
        loadInvites()
      }
    } catch (error: any) {
      showErrorModal(`Error inesperado: ${error.message}`)
    }
  }

  const confirmDelete = (id: string, email: string) => {
    showConfirmModal(
      `¿Estás seguro de que quieres eliminar la invitación para ${email}?`,
      () => deleteInvite(id)
    )
  }

  useEffect(() => {
    loadInvites()
  }, [])

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'receptionist':
        return 'Recepcionista'
      case 'technician':
        return 'Técnico'
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-info text-white d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <Mail size={20} className="me-2" />
          <h5 className="mb-0">Invitaciones Pendientes</h5>
        </div>
        <button
          className="btn btn-light btn-sm"
          onClick={loadInvites}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>
      
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" />
            <p className="mt-2 mb-0">Cargando invitaciones...</p>
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <Mail size={48} className="mb-3 opacity-50" />
            <p className="mb-0">No hay invitaciones pendientes</p>
            <small>Las invitaciones aparecerán aquí cuando las crees</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <Mail size={16} className="me-2 text-muted" />
                        {invite.email}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <User size={16} className="me-2 text-muted" />
                        {invite.full_name}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {getRoleDisplayName(invite.role)}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Calendar size={16} className="me-2 text-muted" />
                        <small>{formatDate(invite.created_at)}</small>
                      </div>
                    </td>
                    <td>
                      <span 
                        className={`badge ${
                          invite.status === 'pending' ? 'bg-warning' :
                          invite.status === 'sent' ? 'bg-info' :
                          invite.status === 'accepted' ? 'bg-success' :
                          'bg-danger'
                        }`}
                      >
                        {invite.status === 'pending' ? 'Pendiente' :
                         invite.status === 'sent' ? 'Enviado' :
                         invite.status === 'accepted' ? 'Aceptado' :
                         invite.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => confirmDelete(invite.id, invite.email)}
                        title="Eliminar invitación"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {invites.length > 0 && (
          <div className="mt-3">
            <div className="alert alert-info">
              <strong>📧 Información sobre Envío de Correos:</strong>
              <ul className="mb-0 mt-2">
                <li><strong>Estado "Pendiente":</strong> La invitación está registrada pero no se ha enviado el correo</li>
                <li><strong>Para enviar correos:</strong> Ve a Supabase Dashboard → Authentication → Users → "Invite a user"</li>
                <li><strong>Email automático:</strong> Próximamente se implementará el envío automático</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm || closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  )
}

export default PendingInvitesList