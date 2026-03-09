import React, { useState } from 'react'
import { useServiceOrders } from '../hooks/useServiceOrders'
import { useModal } from '../hooks/useModal'
import { Search, Package, AlertCircle, Clock, CheckCircle, User, Calendar, FileText, RotateCcw } from 'lucide-react'
import type { ServiceOrder } from '../types'
import ComandaPreview from './ComandaPreview'
import { CustomModal } from './ui/CustomModal'

const WarrantySearch: React.FC = () => {
  const [serialNumber, setSerialNumber] = useState('')
  const [searchResults, setSearchResults] = useState<ServiceOrder[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showComanda, setShowComanda] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [creatingWarranty, setCreatingWarranty] = useState(false)
  
  const { serviceOrders, createServiceOrder, deliverServiceOrder } = useServiceOrders(true)
  const { modal, showSuccess, showError, showConfirm, closeModal } = useModal()

  const handleSearch = () => {
    if (!serialNumber.trim()) return
    
    setSearching(true)
    setSearched(true)
    
    // Buscar órdenes por número de serie (deduplicar por id para evitar duplicados en estado local)
    const resultsMap = new Map<string, ServiceOrder>()
    serviceOrders.forEach(order => {
      if (order.serial_number &&
          order.serial_number.toLowerCase().includes(serialNumber.toLowerCase().trim())) {
        resultsMap.set(order.id, order)
      }
    })
    const results = Array.from(resultsMap.values())
    
    // Ordenar por fecha más reciente primero
    const sortedResults = results.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    setSearchResults(sortedResults)
    setSearching(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', icon: Clock, label: 'Pendiente' },
      in_progress: { color: 'info', icon: User, label: 'En Progreso' },
      completed: { color: 'success', icon: CheckCircle, label: 'Completada' },
      delivered: { color: 'secondary', icon: Package, label: 'Entregada' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`badge bg-${config.color} d-flex align-items-center`}>
        <Icon size={12} className="me-1" />
        {config.label}
      </span>
    )
  }

  const getStatusDisplayName = (status: string) => {
    const statusNames: { [key: string]: string } = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completada',
      delivered: 'Entregada'
    }
    return statusNames[status] || status
  }

  const handleDeliverOrder = async (orderId: string) => {
    showConfirm(
      'Confirmar Entrega',
      '¿Confirmas que el cliente ha recogido su artículo?',
      async () => {
        const success = await deliverServiceOrder(orderId)
        if (success) {
          showSuccess('Entrega Confirmada', 'La orden ha sido marcada como entregada exitosamente', closeModal)
          // Actualizar la búsqueda para refrescar los resultados
          handleSearch()
        } else {
          showError('Error', 'No se pudo marcar la orden como entregada. Inténtalo de nuevo.', closeModal)
        }
      },
      undefined,
      {
        confirmText: 'Confirmar Entrega',
        cancelText: 'Cancelar'
      }
    )
  }

  const handleWarrantyOrder = async (originalOrder: ServiceOrder) => {
    if (!originalOrder.customer || creatingWarranty) return
    
    setCreatingWarranty(true)
    try {
      // Crear nueva orden con los datos del dispositivo original
      const observations = originalOrder.completion_notes 
        ? `GARANTÍA - Orden original #${originalOrder.order_number} - Reparación anterior: ${originalOrder.completion_notes}`
        : `GARANTÍA - Orden original #${originalOrder.order_number}`
      
      const newOrderData = {
        customer_id: originalOrder.customer.id,
        device_type: originalOrder.device_type,
        device_brand: originalOrder.device_brand,
        device_model: originalOrder.device_model,
        serial_number: originalOrder.serial_number || '',
        problem_description: originalOrder.problem_description || '',
        observations: observations,
        assigned_technician_id: originalOrder.completed_by_id || originalOrder.assigned_technician_id || null,
        status: 'in_progress'
      }

      const created = await createServiceOrder(newOrderData)
      
      if (created) {
        setCreatedOrder(created)
        setShowComanda(true)
      } else {
        showError('Error', 'No se pudo crear la orden de garantía. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error creando orden de garantía:', error)
      showError('Error', 'Error inesperado al crear la orden de garantía')
    } finally {
      setCreatingWarranty(false)
    }
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Modal de Comanda */}
      {showComanda && createdOrder && createdOrder.customer && (
        <ComandaPreview
          order={createdOrder}
          customer={createdOrder.customer}
          onClose={() => {
            setShowComanda(false)
            setCreatedOrder(null)
            // Recargar búsqueda para ver la nueva orden
            handleSearch()
          }}
        />
      )}
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div className="card-body text-white p-3 p-md-4">
              <div className="row align-items-center">
                <div className="col-md-9">
                  <h1 className="h4 fw-bold mb-2">Búsqueda de Garantía</h1>
                  <p className="mb-0 opacity-90">Busca consolas por número de serie para verificar historial de reparaciones</p>
                  <small className="opacity-75">Ideal para validar garantías y reparaciones previas</small>
                </div>
                <div className="col-md-3 text-end d-none d-md-block">
                  <Package size={60} className="opacity-25" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 py-3">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <Search size={18} className="me-2 text-primary" />
                Buscar por Número de Serie
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-2 g-sm-3">
                <div className="col-12 col-md-9">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <Package size={16} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Ingresa el número de serie de la consola/control..."
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      style={{minHeight: '48px'}}
                    />
                  </div>
                  <small className="text-muted">                    
                  </small>
                </div>
                <div className="col-12 col-md-3">
                  <button 
                    onClick={handleSearch}
                    disabled={searching || !serialNumber.trim()}
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                    style={{minHeight: '48px'}}
                  >
                    {searching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search size={16} className="me-2" />
                        Buscar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {searched && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    Resultados de Búsqueda
                  </h5>
                  <span className="badge bg-primary">{searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}</span>
                </div>
              </div>
              <div className="card-body">
                {searchResults.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex p-3">
                        <AlertCircle size={48} className="text-warning" />
                      </div>
                    </div>
                    <h6 className="text-muted mb-3">No se encontraron registros</h6>
                    <p className="text-muted">
                      No hay órdenes de servicio con el número de serie: <strong>{serialNumber}</strong>
                    </p>
                    <p className="text-muted small">
                      Esto significa que esta consola no tiene historial de reparaciones en el sistema
                    </p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {searchResults.map((order, index) => (
                      <div key={order.id} className="col-12">
                        <div className={`card ${index === 0 ? 'border-primary' : 'border-0'} bg-light`}>
                          {index === 0 && (
                            <div className="card-header bg-primary text-white py-2">
                              <small className="fw-bold"> Reparación más reciente</small>
                            </div>
                          )}
                          <div className="card-body p-3">
                            <div className="row g-3">
                              {/* Información del dispositivo */}
                              <div className="col-12 col-lg-6">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="fw-bold mb-1">
                                      {order.device_brand} {order.device_model}
                                    </h6>
                                    <small className="text-muted">{order.device_type}</small>
                                  </div>
                                  {getStatusBadge(order.status)}
                                </div>

                                <div className="mb-3">
                                  <div className="d-flex align-items-start mb-2">
                                    <Package size={16} className="text-primary me-2 mt-1 flex-shrink-0" />
                                    <div>
                                      <strong className="small d-block">Número de Serie:</strong>
                                      <span className="text-primary fw-bold">{order.serial_number}</span>
                                    </div>
                                  </div>

                                  <div className="d-flex align-items-start mb-2">
                                    <FileText size={16} className="text-warning me-2 mt-1 flex-shrink-0" />
                                    <div>
                                      <strong className="small d-block">Orden #:</strong>
                                      <span>{order.order_number}</span>
                                    </div>
                                  </div>

                                  <div className="d-flex align-items-start">
                                    <Calendar size={16} className="text-info me-2 mt-1 flex-shrink-0" />
                                    <div>
                                      <strong className="small d-block">Fecha de ingreso:</strong>
                                      <span>{new Date(order.created_at).toLocaleDateString('es-ES', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}</span>
                                    </div>
                                  </div>

                                  {/* Información del técnico */}
                                  {(order.completed_by || order.assigned_technician) && (
                                    <div className="d-flex align-items-start mt-2">
                                      <User size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                                      <div>
                                        <strong className="small d-block">Técnico responsable:</strong>
                                        <span className="text-success fw-semibold">
                                          {order.completed_by?.full_name || 
                                           order.completed_by?.email?.split('@')[0] || 
                                           order.assigned_technician?.full_name || 
                                           order.assigned_technician?.email?.split('@')[0] || 
                                           'No asignado'}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Información de reparación */}
                              <div className="col-12 col-lg-6">
                                <div className="bg-white rounded p-3">
                                  <h6 className="fw-bold text-danger mb-2">🔧 Problema reportado:</h6>
                                  <p className="mb-3 small">{order.problem_description}</p>

                                  {order.completion_notes && (
                                    <>
                                      <h6 className="fw-bold text-success mb-2">✅ Reparación realizada:</h6>
                                      <p className="mb-0 small">{order.completion_notes}</p>
                                    </>
                                  )}

                                  {order.observations && (
                                    <>
                                      <h6 className="fw-bold text-info mb-2 mt-3">📝 Observaciones:</h6>
                                      <p className="mb-0 small">{order.observations}</p>
                                    </>
                                  )}
                                </div>

                                {/* Información del cliente */}
                                <div className="mt-3 p-2 bg-white rounded">
                                  <small className="text-muted d-block mb-1">
                                    <User size={12} className="me-1" />
                                    <strong>Cliente:</strong> {order.customer?.full_name || 'N/A'}
                                  </small>
                                  {order.customer?.cedula && (
                                    <small className="text-muted d-block">
                                      📱 <strong>Contacto:</strong> {order.customer.cedula}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Advertencia de garantía */}
                            {index === 0 && order.status === 'delivered' && (
                              <div className="alert alert-info mt-3 mb-0 d-flex align-items-start">
                                <AlertCircle size={20} className="me-2 mt-1 flex-shrink-0" />
                                <div className="flex-grow-1">
                                  <strong>Información de Garantía:</strong>
                                  <p className="mb-0 small mt-1">
                                    Esta consola fue reparada y entregada el {new Date(order.updated_at).toLocaleDateString('es-ES')}. 
                                    Verifica si aplica garantía según tus políticas de tiempo.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Advertencia cuando no está entregada */}
                            {index === 0 && order.status !== 'delivered' && (
                              <div className="alert alert-warning mt-3 mb-0 d-flex align-items-start">
                                <AlertCircle size={20} className="me-2 mt-1 flex-shrink-0" />
                                <div className="flex-grow-1">
                                  <strong>Garantía No Disponible:</strong>
                                  <p className="mb-0 small mt-1">
                                    Solo se pueden ingresar por garantía las órdenes que han sido entregadas. 
                                    Esta orden está en estado: <strong>{getStatusDisplayName(order.status)}</strong>
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Botón de marcar como entregada */}
                            {order.status === 'completed' && (
                              <div className="mt-3">
                                <button
                                  className="btn btn-success w-100 d-flex align-items-center justify-content-center"
                                  onClick={() => handleDeliverOrder(order.id)}
                                  style={{minHeight: '48px'}}
                                >
                                  <Package size={18} className="me-2" />
                                  Marcar como Entregada
                                </button>
                              </div>
                            )}

                            {/* Botón de ingresar por garantía */}
                            {index === 0 && order.customer && order.status === 'delivered' && (
                              <div className="mt-3">
                                <button
                                  className="btn btn-warning w-100 d-flex align-items-center justify-content-center"
                                  onClick={() => handleWarrantyOrder(order)}
                                  disabled={creatingWarranty}
                                  style={{minHeight: '48px'}}
                                >
                                  {creatingWarranty ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                      Creando orden...
                                    </>
                                  ) : (
                                    <>
                                      <RotateCcw size={18} className="me-2" />
                                      Ingresar por Garantía - Crear Nueva Orden
                                    </>
                                  )}
                                </button>
                                <small className="text-muted d-block mt-2 text-center">
                                  Se creará una nueva orden automáticamente con los datos del dispositivo y se asignará al mismo técnico
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
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
        cancelText={modal.cancelText}
      />
    </div>
  )
}

export default WarrantySearch
