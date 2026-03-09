import React, { useState } from 'react'
import { useServiceOrders } from '../hooks/useServiceOrders'
import { useAuth } from '../contexts/AuthContext'
import { Package, Calendar, User, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react'
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

const DeliverySection: React.FC = () => {
  const { serviceOrders, deliverServiceOrder } = useServiceOrders()
  const { user } = useAuth()
  
  // Modal de feedback
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  // Modal de entrega/cobro
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [deliverOrderId, setDeliverOrderId] = useState('')
  const [deliverOrderData, setDeliverOrderData] = useState<any>(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [repairCost, setRepairCost] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'otro'>('efectivo')

  if (!user || (user.role !== 'admin' && user.role !== 'receptionist')) {
    return null
  }

  const completedOrders = serviceOrders.filter(order => order.status === 'completed')

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }))

  const handleDeliverOrder = (orderId: string, order: any) => {
    setDeliverOrderId(orderId)
    setDeliverOrderData(order)
    setDeliveryNotes('')
    setRepairCost('')
    setPaymentMethod('efectivo')
    setShowDeliverModal(true)
  }

  const handleConfirmDeliver = async () => {
    try {
      const cost = repairCost ? parseFloat(repairCost) : undefined
      const method = deliverOrderData?.repair_result !== 'not_repaired' ? paymentMethod : undefined
      await deliverServiceOrder(deliverOrderId, deliveryNotes.trim() || undefined, cost, method)
      setShowDeliverModal(false)
      setModal({
        isOpen: true,
        type: 'success',
        title: '¡Entrega registrada!',
        message: 'Artículo entregado exitosamente al cliente.',
        onConfirm: closeModal
      })
    } catch {
      setShowDeliverModal(false)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Error al registrar la entrega. Intenta de nuevo.',
        onConfirm: closeModal
      })
    }
  }

  if (completedOrders.length === 0) {
    return null
  }

  return (
    <div className="row mb-3">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-0 py-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-2">
                  <Package size={18} className="text-warning" />
                </div>
                <h5 className="mb-0 fw-semibold">Listas para Entrega</h5>
              </div>
              <span className="badge bg-warning">{completedOrders.length}</span>
            </div>
          </div>
          
          <div className="card-body">
            {completedOrders.length > 0 && (
              <div className="alert alert-warning d-flex align-items-center mb-3">
                <AlertTriangle size={16} className="me-2" />
                <span className="small">
                  Hay {completedOrders.length} reparación{completedOrders.length !== 1 ? 'es' : ''} lista{completedOrders.length !== 1 ? 's' : ''} para entrega
                </span>
              </div>
            )}
            
            <div className="row g-2">
              {completedOrders.slice(0, 6).map(order => (
                <div key={order.id} className="col-md-6 col-lg-4">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-1 text-truncate">
                            {order.device_brand} {order.device_model}
                          </h6>
                          <small className="text-muted d-block">
                            {order.customer?.full_name}
                          </small>
                          <small className="text-primary d-block fw-semibold">
                            #{order.order_number}
                          </small>
                        </div>
                        {/* Resultado de la reparación */}
                        {order.repair_result && (
                          <span className={`badge ${order.repair_result === 'repaired' ? 'bg-success' : 'bg-danger'} ms-2`}>
                            {order.repair_result === 'repaired' ? (
                              <><CheckCircle size={10} className="me-1" />Reparada</>
                            ) : (
                              <><XCircle size={10} className="me-1" />No Reparada</>
                            )}
                          </span>
                        )}
                      </div>
                      
                      <p className="small text-muted mb-2 text-truncate">
                        {order.problem_description}
                      </p>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          <Calendar size={12} className="me-1" />
                          {new Date(order.created_at).toLocaleDateString('es-ES')}
                        </small>
                        {/* Cobro registrado */}
                        {order.repair_cost != null && order.repair_cost > 0 && (
                          <small className="badge bg-success bg-opacity-10 text-success px-2 py-1">
                            <DollarSign size={10} className="me-1" />
                            ${Number(order.repair_cost).toLocaleString('es-CL')}
                          </small>
                        )}
                      </div>
                      
                      {order.assigned_technician && (
                        <div className="mb-2">
                          <small className="text-muted">
                            <User size={12} className="me-1" />
                            {order.assigned_technician?.full_name || 
                             order.assigned_technician?.email?.split('@')[0] || 
                             'Técnico'}
                          </small>
                        </div>
                      )}
                      
                      {order.completion_notes && (
                        <div className="mb-2 pt-2 border-top">
                          <small className="text-success">
                            <strong>Notas:</strong> {order.completion_notes}
                          </small>
                        </div>
                      )}
                      
                      <div className="d-grid">
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => handleDeliverOrder(order.id, order)}
                        >
                          <Package size={12} className="me-1" />
                          Marcar como Entregada
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {completedOrders.length > 6 && (
              <div className="text-center mt-3">
                <small className="text-muted">
                  Y {completedOrders.length - 6} reparación{completedOrders.length - 6 !== 1 ? 'es' : ''} más...
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal feedback (éxito/error) */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* ===== MODAL: ENTREGA Y COBRO ===== */}
      {showDeliverModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white border-0">
                <h5 className="modal-title">
                  <Package size={18} className="me-2" />
                  Confirmar Entrega — #{deliverOrderData?.order_number}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeliverModal(false)} />
              </div>
              <div className="modal-body p-4">

                {/* Estado de la reparación */}
                {deliverOrderData?.repair_result === 'not_repaired' ? (
                  <div className="alert alert-danger d-flex align-items-center mb-4">
                    <XCircle size={20} className="me-2 flex-shrink-0" />
                    <div>
                      <strong>Dispositivo no reparado</strong>
                      <div className="small">No se registrará cobro al cliente.</div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success d-flex align-items-center mb-4">
                    <CheckCircle size={20} className="me-2 flex-shrink-0" />
                    <div>
                      <strong>Dispositivo reparado</strong>
                      <div className="small">Registra el cobro al cliente.</div>
                    </div>
                  </div>
                )}

                {/* Formulario de cobro solo si fue reparada */}
                {deliverOrderData?.repair_result !== 'not_repaired' && (
                  <div className="card border-success border-2 mb-3">
                    <div className="card-header bg-success bg-opacity-10 border-0 py-2">
                      <small className="fw-semibold text-success">
                        <DollarSign size={14} className="me-1" />
                        Cobro al Cliente
                      </small>
                    </div>
                    <div className="card-body p-3">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Monto cobrado ($)</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0.00"
                            min="0"
                            step="1000"
                            value={repairCost}
                            onChange={(e) => setRepairCost(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <small className="text-muted">Deja en 0 si no se cobra</small>
                      </div>
                      <div>
                        <label className="form-label fw-semibold">Método de Pago</label>
                        <div className="d-flex flex-wrap gap-2">
                          {(['efectivo', 'transferencia', 'tarjeta', 'otro'] as const).map(m => (
                            <button
                              key={m}
                              type="button"
                              className={`btn btn-sm ${paymentMethod === m ? 'btn-success' : 'btn-outline-secondary'}`}
                              onClick={() => setPaymentMethod(m)}
                            >
                              {m === 'efectivo' && '💵 '}
                              {m === 'transferencia' && '📱 '}
                              {m === 'tarjeta' && '💳 '}
                              {m === 'otro' && '🔄 '}
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notas de entrega */}
                <div>
                  <label className="form-label fw-semibold">
                    Notas de Entrega <small className="text-muted fw-normal">(opcional)</small>
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Ej: Cliente recogió con accesorios incluidos..."
                  />
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDeliverModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-success" onClick={handleConfirmDeliver}>
                  <Package size={16} className="me-2" />
                  Confirmar Entrega
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliverySection

