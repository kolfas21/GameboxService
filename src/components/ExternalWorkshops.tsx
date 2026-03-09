import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useExternalWorkshops, useExternalRepairs } from '../hooks'
import { useServiceOrders } from '../hooks/useServiceOrders'
import { 
  Building, 
  Plus, 
  Edit2, 
  Power,
  Phone,
  Mail,
  MapPin,
  Save,
  X,
  Package,
  Calendar,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useModal } from '../hooks/useModal'
import { CustomModal } from './ui/CustomModal'

const ExternalWorkshops: React.FC = () => {
  const { user } = useAuth()
  const { workshops, loading, error, createWorkshop, updateWorkshop, toggleWorkshopStatus, deleteWorkshop } = useExternalWorkshops()
  const { repairs, loading: repairsLoading, markAsReturned } = useExternalRepairs()
  const { completeServiceOrder } = useServiceOrders()
  const { modal, showSuccess, showError, showConfirm, closeModal } = useModal()
  
  // Estado para el modal de retorno con resultado de reparación
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnRepairId, setReturnRepairId] = useState('')
  const [returnOrderId, setReturnOrderId] = useState('')
  const [returnOrderNumber, setReturnOrderNumber] = useState('')
  const [returnRepairResult, setReturnRepairResult] = useState<'repaired' | 'not_repaired'>('repaired')
  const [returnNotes, setReturnNotes] = useState('')
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  // Proteger el componente - solo admin y recepcionista
  if (!user || (user.role !== 'admin' && user.role !== 'receptionist')) {
    return (
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="alert alert-warning">
          <h5>Acceso Restringido</h5>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si la tabla no existe (migraciones no ejecutadas)
  if (error && error.includes('PGRST205')) {
    return (
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="text-center">
              <Building size={60} className="text-warning mb-3" />
              <h4 className="fw-bold mb-3">Funcionalidad No Disponible</h4>
              <div className="alert alert-info">
                <h6 className="alert-heading">📋 Migraciones Pendientes</h6>
                <p className="mb-2">
                  La funcionalidad de <strong>Talleres Externos</strong> requiere ejecutar las migraciones de base de datos.
                </p>
                <hr />
                <p className="mb-2 small">
                  <strong>Pasos a seguir:</strong>
                </p>
                <ol className="text-start small mb-0">
                  <li>Ve a <strong>Supabase → SQL Editor</strong></li>
                  <li>Ejecuta <code>database/migrations/add_dynamic_configuration.sql</code></li>
                  <li>Ejecuta <code>database/migrations/add_outsourcing_system.sql</code></li>
                  <li>Recarga esta página</li>
                </ol>
              </div>
              <p className="text-muted small mb-0">
                Las migraciones son <strong>100% seguras</strong> y NO eliminan datos existentes.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Error', 'El nombre del taller es obligatorio')
      return
    }

    if (!formData.phone.trim()) {
      showError('Error', 'El teléfono es obligatorio')
      return
    }

    if (!formData.address.trim()) {
      showError('Error', 'La dirección es obligatoria')
      return
    }

    try {
      if (editingId) {
        const { error } = await updateWorkshop(editingId, formData)
        if (error) {
          showError('Error', error)
        } else {
          showSuccess('Éxito', 'Taller actualizado correctamente')
          resetForm()
        }
      } else {
        const { error } = await createWorkshop(formData)
        if (error) {
          showError('Error', error)
        } else {
          showSuccess('Éxito', 'Taller creado correctamente')
          resetForm()
        }
      }
    } catch (err) {
      showError('Error', 'Error inesperado al guardar el taller')
    }
  }

  const handleEdit = (workshop: any) => {
    setFormData({
      name: workshop.name || '',
      contact_person: workshop.contact_person || '',
      phone: workshop.phone || '',
      email: workshop.email || '',
      address: workshop.address || '',
      notes: workshop.notes || ''
    })
    setEditingId(workshop.id)
    setIsAdding(true)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await toggleWorkshopStatus(id, !currentStatus)
    if (error) {
      showError('Error', error)
    } else {
      showSuccess('Éxito', `Taller ${!currentStatus ? 'activado' : 'desactivado'} correctamente`)
    }
  }

  const handleDelete = (id: string, workshopName: string) => {
    showConfirm(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar el taller "${workshopName}"?\n\nEsta acción no se puede deshacer.`,
      async () => {
        const { error } = await deleteWorkshop(id)
        if (error) {
          showError('Error', error)
        } else {
          showSuccess('Éxito', 'Taller eliminado correctamente')
        }
      },
      undefined,
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    )
  }

  const handleMarkAsReturned = (repairId: string, serviceOrderId: string, orderNumber: string) => {
    setReturnRepairId(repairId)
    setReturnOrderId(serviceOrderId)
    setReturnOrderNumber(orderNumber)
    setReturnRepairResult('repaired')
    setReturnNotes('')
    setShowReturnModal(true)
  }

  const handleConfirmReturn = async () => {
    try {
      // 1. Marcar la reparación externa como retornada
      const { error } = await markAsReturned(returnRepairId, new Date().toISOString(), returnNotes.trim() || undefined)
      if (error) { showError('Error', error); setShowReturnModal(false); return }

      // 2. Marcar la orden como completada con el resultado de la reparación
      await completeServiceOrder(returnOrderId, returnNotes.trim() || '', returnRepairResult)

      setShowReturnModal(false)
      showSuccess('¡Listo!', `Orden #${returnOrderNumber} retornada y marcada como ${returnRepairResult === 'repaired' ? 'reparada' : 'no reparada'}. Lista para entrega al cliente.`)
    } catch {
      setShowReturnModal(false)
      showError('Error', 'No se pudo registrar el retorno. Intenta de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando talleres externos...</p>
        </div>
      </div>
    )
  }

  const activeWorkshops = workshops.filter(w => w.is_active)
  const inactiveWorkshops = workshops.filter(w => !w.is_active)

  // Filtrar reparaciones activas (no devueltas)
  const activeRepairs = repairs.filter(r => r.external_status !== 'returned' && r.external_status !== 'cancelled')

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">
            <Building className="me-2" size={28} />
            Talleres Externos
          </h2>
          <p className="text-muted mb-0">
            Gestiona los talleres a los que puedes tercerizar reparaciones
          </p>
        </div>
        {!isAdding && user?.role === 'admin' && (
          <button
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={16} className="me-2" />
            Nuevo Taller
          </button>
        )}
      </div>

      {/* Panel de Órdenes Tercerizadas */}
      {!repairsLoading && activeRepairs.length > 0 && (
        <div className="mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-warning bg-opacity-10 border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <Package className="me-2" size={20} />
                Órdenes en Talleres Externos
                <span className="badge bg-warning text-dark ms-2">{activeRepairs.length}</span>
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Orden</th>
                      <th>Cliente</th>
                      <th>Dispositivo</th>
                      <th>Taller</th>
                      <th>Estado</th>
                      <th>Enviado</th>
                      <th>Retorno Est.</th>
                      <th className="text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRepairs.map(repair => (
                      <tr key={repair.id}>
                        <td>
                          <span className="fw-semibold text-primary">
                            #{repair.order_number}
                          </span>
                        </td>
                        <td>{repair.customer_name}</td>
                        <td>
                          <small>
                            {repair.device_brand} {repair.device_model}
                            <br />
                            <span className="text-muted">{repair.device_type}</span>
                          </small>
                        </td>
                        <td>
                          <strong>{repair.workshop_name}</strong>
                          <br />
                          <small className="text-muted">
                            <Phone size={12} className="me-1" />
                            {repair.workshop_phone}
                          </small>
                        </td>
                        <td>
                          {repair.external_status === 'sent' && (
                            <span className="badge bg-info">Enviado</span>
                          )}
                          {repair.external_status === 'in_process' && (
                            <span className="badge bg-warning">En Proceso</span>
                          )}
                          {repair.external_status === 'ready' && (
                            <span className="badge bg-success">Listo</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            <Calendar size={12} className="me-1" />
                            {new Date(repair.sent_date).toLocaleDateString('es-ES')}
                          </small>
                        </td>
                        <td>
                          {repair.estimated_return_date ? (
                            <small className="text-muted">
                              {new Date(repair.estimated_return_date).toLocaleDateString('es-ES')}
                            </small>
                          ) : (
                            <small className="text-muted">No especificado</small>
                          )}
                        </td>
                        <td className="text-center">
                          {(user?.role === 'admin' || user?.role === 'receptionist') && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleMarkAsReturned(repair.id, repair.service_order_id || '', repair.order_number || 'N/A')}
                              title="Marcar como retornado y completar orden"
                            >
                              <CheckCircle size={16} className="me-1" />
                              Retornado
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Agregar/Editar */}
      {isAdding && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              {editingId ? 'Editar Taller' : 'Nuevo Taller'}
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">
                  Nombre del Taller *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Tech Repair Center"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  Número de Local
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  placeholder="Local 45"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  <MapPin size={14} className="me-1" />
                  Dirección *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Calle 123, Centro Comercial XYZ"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  <Phone size={14} className="me-1" />
                  Teléfono *
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+57 XXX XXX XXXX"
                  required
                />
              </div>
            </div>
          </div>
          <div className="card-footer bg-transparent border-0">
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={resetForm}
              >
                <X size={16} className="me-2" />
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
              >
                <Save size={16} className="me-2" />
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Talleres Activos */}
      {activeWorkshops.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">Talleres Activos ({activeWorkshops.length})</h5>
          <div className="row g-3">
            {activeWorkshops.map(workshop => (
              <div key={workshop.id} className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-0">{workshop.name}</h6>
                      <span className="badge bg-success">Activo</span>
                    </div>
                    
                    {workshop.contact_person && (
                      <p className="text-muted small mb-1">
                        <strong>Local:</strong> {workshop.contact_person}
                      </p>
                    )}
                    
                    {workshop.phone && (
                      <p className="text-muted small mb-1">
                        <Phone size={12} className="me-1" />
                        {workshop.phone}
                      </p>
                    )}
                    
                    {workshop.address && (
                      <p className="text-muted small mb-1">
                        <MapPin size={12} className="me-1" />
                        {workshop.address}
                      </p>
                    )}
                    
                    {workshop.email && (
                      <p className="text-muted small mb-1">
                        <Mail size={12} className="me-1" />
                        {workshop.email}
                      </p>
                    )}
                    
                    {workshop.notes && (
                      <p className="text-muted small mt-2 fst-italic">
                        {workshop.notes}
                      </p>
                    )}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="card-footer bg-transparent border-0 d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(workshop)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleToggleStatus(workshop.id, workshop.is_active)}
                        title="Desactivar"
                      >
                        <Power size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(workshop.id, workshop.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Talleres Inactivos */}
      {inactiveWorkshops.length > 0 && (
        <div>
          <h5 className="mb-3">Talleres Inactivos ({inactiveWorkshops.length})</h5>
          <div className="row g-3">
            {inactiveWorkshops.map(workshop => (
              <div key={workshop.id} className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm h-100 opacity-75">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-0">{workshop.name}</h6>
                      <span className="badge bg-secondary">Inactivo</span>
                    </div>
                    
                    {workshop.contact_person && (
                      <p className="text-muted small mb-1">
                        <strong>Local:</strong> {workshop.contact_person}
                      </p>
                    )}
                    
                    {workshop.phone && (
                      <p className="text-muted small mb-1">
                        <Phone size={12} className="me-1" />
                        {workshop.phone}
                      </p>
                    )}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="card-footer bg-transparent border-0 d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleToggleStatus(workshop.id, workshop.is_active)}
                        title="Activar"
                      >
                        <Power size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(workshop.id, workshop.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {workshops.length === 0 && !isAdding && (
        <div className="text-center py-5">
          <Building size={64} className="text-muted mb-3" />
          <h5 className="text-muted">No hay talleres externos registrados</h5>
          <p className="text-muted">
            Comienza agregando un taller externo para tercerizar reparaciones
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={16} className="me-2" />
            Crear Primer Taller
          </button>
        </div>
      )}

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

      {/* ===== MODAL: RETORNO DEL TALLER EXTERNO ===== */}
      {showReturnModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title">
                  <Package size={18} className="me-2" />
                  Retorno del Taller Externo — #{returnOrderNumber}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReturnModal(false)} />
              </div>
              <div className="modal-body p-4">
                {/* Resultado de la reparación */}
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-3">
                    ¿El taller logró reparar el dispositivo? <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex gap-3">
                    <div
                      className={`card flex-fill border-2 ${returnRepairResult === 'repaired' ? 'border-success bg-success bg-opacity-10' : 'border-light'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setReturnRepairResult('repaired')}
                    >
                      <div className="card-body text-center py-3">
                        <div className="fs-2 mb-1">✅</div>
                        <div className={`fw-semibold small ${returnRepairResult === 'repaired' ? 'text-success' : 'text-muted'}`}>Reparada</div>
                        <small className="text-muted">Lista para cobrar</small>
                      </div>
                    </div>
                    <div
                      className={`card flex-fill border-2 ${returnRepairResult === 'not_repaired' ? 'border-danger bg-danger bg-opacity-10' : 'border-light'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setReturnRepairResult('not_repaired')}
                    >
                      <div className="card-body text-center py-3">
                        <div className="fs-2 mb-1">❌</div>
                        <div className={`fw-semibold small ${returnRepairResult === 'not_repaired' ? 'text-danger' : 'text-muted'}`}>No Reparada</div>
                        <small className="text-muted">Sin cobro al cliente</small>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Notas del trabajo realizado */}
                <div>
                  <label className="form-label fw-semibold">
                    Notas del taller <small className="text-muted fw-normal">(opcional)</small>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Ej: Se cambió el chip HDMI, equipo probado y funcionando..."
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowReturnModal(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn ${returnRepairResult === 'repaired' ? 'btn-success' : 'btn-danger'}`}
                  onClick={handleConfirmReturn}
                >
                  {returnRepairResult === 'repaired' ? (
                    <><CheckCircle size={16} className="me-2" />Confirmar Retorno — Reparada</>
                  ) : (
                    <><XCircle size={16} className="me-2" />Confirmar Retorno — No Reparada</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExternalWorkshops
