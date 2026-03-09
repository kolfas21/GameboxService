import React, { useState, useEffect } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { useServiceOrders } from '../hooks/useServiceOrders'
import { useRouter } from '../contexts/RouterContext'
import { useModal } from '../hooks/useModal'
import { useAuth } from '../contexts/AuthContext'
import { Search, User, Clock, CheckCircle, Package, Phone, Mail, Calendar, FileText, X, Edit, Trash2 } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'

const CustomerSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({ full_name: '', cedula: '', phone: '', email: '' })
  const customersPerPage = 10
  const ordersPerPage = 5
  
  const { customers, updateCustomer, deleteCustomer } = useCustomers(true) // Enable auto-refresh
  const { serviceOrders, deliverServiceOrder } = useServiceOrders(true) // Enable auto-refresh
  const { navigate, setPreSelectedCustomer } = useRouter()
  const { user } = useAuth()
  const { modal, showSuccess, showError, showConfirm, closeModal } = useModal()
  
  // Filtrar clientes según el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = customers.filter(customer => 
        customer.full_name.toLowerCase().includes(term) ||
        customer.cedula.toLowerCase().includes(term) ||
        (customer.phone && customer.phone.toLowerCase().includes(term)) ||
        (customer.email && customer.email.toLowerCase().includes(term))
      )
      setFilteredCustomers(filtered)
    }
    setCurrentPage(1)
  }, [searchTerm, customers])

  // Calcular clientes a mostrar
  const indexOfLastCustomer = currentPage * customersPerPage
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer)
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage)
  
  // Calcular órdenes a mostrar
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = customerOrders.slice(indexOfFirstOrder, indexOfLastOrder)
  const totalOrderPages = Math.ceil(customerOrders.length / ordersPerPage)

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    const orders = serviceOrders.filter(order => order.customer_id === customer.id)
    setCustomerOrders(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
  }

  const handleCreateOrder = (customer: any) => {
    // Pre-cargar el cliente y navegar a crear orden
    setPreSelectedCustomer(customer)
    navigate('create-order')
  }

  const handleBack = () => {
    setSelectedCustomer(null)
    setCustomerOrders([])
  }

  const handleDeliverOrder = async (orderId: string) => {
    showConfirm(
      'Confirmar Entrega',
      '¿Confirmas que el cliente ha recogido su artículo?',
      async () => {
        const success = await deliverServiceOrder(orderId)
        if (success) {
          showSuccess('Entrega Confirmada', 'La orden ha sido marcada como entregada exitosamente', closeModal)
          // Actualizar la lista de órdenes del cliente
          if (selectedCustomer) {
            const orders = serviceOrders.filter(order => order.customer_id === selectedCustomer.id)
            setCustomerOrders(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
          }
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

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer)
    setEditFormData({
      full_name: customer.full_name,
      cedula: customer.cedula,
      phone: customer.phone || '',
      email: customer.email || ''
    })
  }

  const handleSaveEditCustomer = async () => {
    if (!editingCustomer) return

    if (!editFormData.full_name.trim() || !editFormData.cedula.trim()) {
      showError('Error', 'El nombre y la cédula son obligatorios')
      return
    }

    const success = await updateCustomer(editingCustomer.id, editFormData)
    
    if (success) {
      showSuccess('Cliente Actualizado', 'Los datos del cliente se han actualizado correctamente')
      setEditingCustomer(null)
    } else {
      showError('Error', 'No se pudo actualizar el cliente. Inténtalo de nuevo.')
    }
  }

  const handleDeleteCustomer = (customer: any) => {
    const orderCount = serviceOrders.filter(o => o.customer_id === customer.id).length
    
    if (orderCount > 0) {
      showError(
        'No se puede eliminar', 
        `Este cliente tiene ${orderCount} orden(es) asociada(s). No se puede eliminar un cliente con órdenes registradas.`
      )
      return
    }

    showConfirm(
      '¿Eliminar Cliente?',
      `¿Estás seguro de que quieres eliminar al cliente "${customer.full_name}"? Esta acción no se puede deshacer.`,
      async () => {
        const success = await deleteCustomer(customer.id)
        if (success) {
          showSuccess('Cliente Eliminado', 'El cliente ha sido eliminado exitosamente')
        } else {
          showError('Error', 'No se pudo eliminar el cliente. Inténtalo de nuevo.')
        }
      },
      undefined,
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    )
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

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {!selectedCustomer ? (
        <>
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'}}>
                <div className="card-body text-white p-3 p-md-4">
                  <div className="row align-items-center">
                    <div className="col-md-9">
                      <h1 className="h4 fw-bold mb-2">Gestión de Clientes</h1>
                      <p className="mb-0 opacity-90">Lista completa de clientes y su historial</p>
                      <small className="opacity-75">{filteredCustomers.length} clientes registrados</small>
                    </div>
                    <div className="col-md-3 text-end d-none d-md-block">
                      <User size={60} className="opacity-25" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <Search size={16} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Buscar por nombre, celular o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{minHeight: '44px'}}
                    />
                    {searchTerm && (
                      <button 
                        className="btn btn-outline-secondary border-start-0" 
                        onClick={() => setSearchTerm('')}
                        style={{minHeight: '44px'}}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">
                      Clientes {searchTerm && `(${filteredCustomers.length})`}
                    </h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-4">
                        <div className="bg-light rounded-circle d-inline-flex p-3">
                          {searchTerm ? <Search size={48} className="text-muted" /> : <User size={48} className="text-muted" />}
                        </div>
                      </div>
                      <h6 className="text-muted mb-3">
                        {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                      </h6>
                      <p className="text-muted">
                        {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primer cliente'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Vista de tabla para desktop */}
                      <div className="table-responsive d-none d-md-block">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Nombre</th>
                              <th>Celular</th>
                              <th>Email</th>
                              <th>Órdenes</th>
                              <th className="text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentCustomers.map(customer => {
                              const orderCount = serviceOrders.filter(o => o.customer_id === customer.id).length
                              return (
                                <tr key={customer.id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                                        <User size={16} className="text-primary" />
                                      </div>
                                      <strong>{customer.full_name}</strong>
                                    </div>
                                  </td>
                                  <td>
                                    <Phone size={14} className="me-1 text-muted" />
                                    {customer.phone || <span className="text-muted">—</span>}
                                  </td>
                                  <td>
                                    <Mail size={14} className="me-1 text-muted" />
                                    {customer.email || <span className="text-muted">-</span>}
                                  </td>
                                  <td>
                                    <span className="badge bg-info">{orderCount}</span>
                                  </td>
                                  <td className="text-center">
                                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                                      <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCreateOrder(customer)
                                        }}
                                        title="Nueva Orden"
                                      >
                                        <FileText size={14} className="me-1" />
                                        Nueva Orden
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-outline-info"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSelectCustomer(customer)
                                        }}
                                        title="Ver Detalles"
                                      >
                                        <User size={14} className="me-1" />
                                        Ver Detalles
                                      </button>
                                      {user?.role === 'admin' && (
                                        <>
                                          <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditCustomer(customer)
                                            }}
                                            title="Editar Cliente"
                                          >
                                            <Edit size={14} />
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteCustomer(customer)
                                            }}
                                            title="Eliminar Cliente"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Vista de tarjetas para móvil */}
                      <div className="d-md-none">
                        {currentCustomers.map(customer => {
                          const orderCount = serviceOrders.filter(o => o.customer_id === customer.id).length
                          return (
                            <div 
                              key={customer.id} 
                              className="border-bottom p-3"
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 fw-bold">{customer.full_name}</h6>
                                  <div className="small text-muted mb-1">
                                    <Phone size={12} className="me-1" />
                                    {customer.phone || <span className="text-muted">Sin celular</span>}
                                  </div>
                                  {customer.email && (
                                    <div className="small text-muted">
                                      <Mail size={12} className="me-1" />
                                      {customer.email}
                                    </div>
                                  )}
                                </div>
                                <span className="badge bg-info">{orderCount} órdenes</span>
                              </div>
                              <div className="row g-2">
                                <div className="col-6">
                                  <button 
                                    className="btn btn-sm btn-primary w-100"
                                    onClick={() => handleCreateOrder(customer)}
                                  >
                                    <FileText size={14} className="me-1" />
                                    Nueva Orden
                                  </button>
                                </div>
                                <div className="col-6">
                                  <button 
                                    className="btn btn-sm btn-outline-info w-100"
                                    onClick={() => handleSelectCustomer(customer)}
                                  >
                                    <User size={14} className="me-1" />
                                    Ver Detalles
                                  </button>
                                </div>
                                {user?.role === 'admin' && (
                                  <>
                                    <div className="col-6">
                                      <button 
                                        className="btn btn-sm btn-outline-primary w-100"
                                        onClick={() => handleEditCustomer(customer)}
                                      >
                                        <Edit size={14} className="me-1" />
                                        Editar
                                      </button>
                                    </div>
                                    <div className="col-6">
                                      <button 
                                        className="btn btn-sm btn-outline-danger w-100"
                                        onClick={() => handleDeleteCustomer(customer)}
                                      >
                                        <Trash2 size={14} className="me-1" />
                                        Eliminar
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Paginación */}
                      {filteredCustomers.length > customersPerPage && (
                        <div className="card-footer bg-transparent border-top py-3">
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                            <small className="text-muted text-center text-sm-start">
                              Mostrando {indexOfFirstCustomer + 1}-{Math.min(indexOfLastCustomer, filteredCustomers.length)} de {filteredCustomers.length}
                            </small>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-outline-primary btn-sm"
                                style={{minWidth: '44px', minHeight: '44px'}}
                              >
                                ‹
                              </button>
                              <span className="text-muted small">
                                {currentPage} / {totalPages}
                              </span>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-outline-primary btn-sm"
                                style={{minWidth: '44px', minHeight: '44px'}}
                              >
                                ›
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Vista de detalle del cliente */}
          <div className="row mb-3">
            <div className="col-12">
              <button className="btn btn-outline-secondary" onClick={handleBack}>
                ← Volver a la lista
              </button>
            </div>
          </div>

          {/* Información del cliente con botones de acción */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 py-3">
                  <h5 className="card-title mb-0 d-flex align-items-center">
                    <User size={18} className="me-2 text-success" />
                    Información del Cliente
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-2 g-sm-3 g-md-4 mb-4">
                    <div className="col-12 col-sm-6">
                      <div className="d-flex align-items-center p-2 p-sm-3 bg-light rounded">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2 me-sm-3 flex-shrink-0">
                          <User size={20} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-grow-1">
                          <h6 className="mb-1 fw-semibold small">Nombre Completo</h6>
                          <p className="mb-0 text-muted small text-truncate">{selectedCustomer.full_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="d-flex align-items-center p-2 p-sm-3 bg-light rounded">
                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-2 me-sm-3 flex-shrink-0">
                          <Phone size={20} className="text-success" />
                        </div>
                        <div className="min-w-0 flex-grow-1">
                          <h6 className="mb-1 fw-semibold small">Celular</h6>
                          <p className="mb-0 text-muted small text-truncate">{selectedCustomer.cedula}</p>
                        </div>
                      </div>
                    </div>
                    {selectedCustomer.email && (
                      <div className="col-12 col-sm-6">
                        <div className="d-flex align-items-center p-2 p-sm-3 bg-light rounded">
                          <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-2 me-sm-3 flex-shrink-0">
                            <Mail size={20} className="text-warning" />
                          </div>
                          <div className="min-w-0 flex-grow-1">
                            <h6 className="mb-1 fw-semibold small">Email</h6>
                            <p className="mb-0 text-muted small text-truncate">{selectedCustomer.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <button 
                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                        onClick={() => handleCreateOrder(selectedCustomer)}
                        style={{minHeight: '48px'}}
                      >
                        <FileText size={18} className="me-2" />
                        Nueva Orden de Servicio
                      </button>
                    </div>
                    <div className="col-12 col-md-6">
                      <button 
                        className="btn btn-outline-info w-100 d-flex align-items-center justify-content-center"
                        disabled
                        style={{minHeight: '48px'}}
                      >
                        <Calendar size={18} className="me-2" />
                        Ver Historial de Órdenes ({customerOrders.length})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historial de órdenes */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0 d-flex align-items-center">
                      <Calendar size={18} className="me-2 text-primary" />
                      Historial de Órdenes de Servicio
                    </h5>
                    <span className="badge bg-primary">{customerOrders.length} órdenes</span>
                  </div>
                </div>
                <div className="card-body">
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-4">
                        <div className="bg-light rounded-circle d-inline-flex p-3">
                          <Clock size={48} className="text-muted" />
                        </div>
                      </div>
                      <h6 className="text-muted mb-3">Sin historial de órdenes</h6>
                      <p className="text-muted">Este cliente no tiene órdenes de servicio registradas</p>
                    </div>
                  ) : (
                    <>
                      <div className="row g-2 g-sm-3">
                        {currentOrders.map(order => (
                          <div key={order.id} className="col-12">
                          <div className="card bg-light border-0">
                            <div className="card-body p-2 p-sm-3">
                              <div className="row g-2 align-items-start">
                                <div className="col-12 col-md-8">
                                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 mb-2">
                                    <div className="flex-grow-1 min-w-0">
                                      <h6 className="fw-bold mb-1 text-truncate" data-label="Dispositivo">
                                        {order.device_brand} {order.device_model}
                                      </h6>
                                      <small className="text-muted" data-label="Tipo">{order.device_type}</small>
                                    </div>
                                    <div className="flex-shrink-0">
                                      {getStatusBadge(order.status)}
                                    </div>
                                  </div>
                                  
                                  <div className="mb-2">
                                    <strong className="small text-muted d-block d-sm-inline" data-label="Problema">Problema: </strong>
                                    <p className="small mb-0">{order.problem_description}</p>
                                  </div>
                                  
                                  {order.completion_notes && (
                                    <div className="mb-2">
                                      <strong className="small text-success d-block d-sm-inline" data-label="Trabajo">Trabajo: </strong>
                                      <p className="small mb-0">{order.completion_notes}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="col-12 col-md-4">
                                  <div className="text-start text-md-end">
                                    <small className="text-muted d-block mb-1" data-label="Fecha">
                                      <Calendar size={12} className="me-1" />
                                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                                    </small>
                                    {order.assigned_technician && (
                                      <small className="text-muted d-block mb-2" data-label="Técnico">
                                        <User size={12} className="me-1" />
                                        {order.status === 'completed' && order.completed_by ? (
                                          <>
                                            <span className="text-success fw-semibold">
                                              {order.completed_by?.full_name || 
                                               order.completed_by?.email?.split('@')[0] || 
                                               'Técnico'}
                                            </span>
                                            <span className="d-none d-sm-inline"> (Finalizado)</span>
                                          </>
                                        ) : (
                                          <>
                                            {order.assigned_technician?.full_name || 
                                             order.assigned_technician?.email?.split('@')[0] || 
                                             'Técnico'}
                                            <span className="d-none d-sm-inline"> (Asignado)</span>
                                          </>
                                        )}
                                      </small>
                                    )}
                                    
                                    {order.status === 'completed' && (
                                      <button 
                                        className="btn btn-success btn-sm w-100 w-sm-auto" 
                                        style={{minHeight: '44px'}}
                                        onClick={() => handleDeliverOrder(order.id)}
                                      >
                                        <Package size={16} className="me-1" />
                                        <span className="d-none d-sm-inline">Marcar Entregada</span>
                                        <span className="d-inline d-sm-none">Entregar</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Paginación touch-friendly */}
                    {customerOrders.length > ordersPerPage && (
                      <div className="card-footer bg-transparent border-top py-2 py-sm-3">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                          <small className="text-muted text-center text-sm-start order-2 order-sm-1">
                            Mostrando {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, customerOrders.length)} de {customerOrders.length} órdenes
                          </small>
                          <div className="d-flex align-items-center gap-2 order-1 order-sm-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="btn btn-outline-primary btn-sm"
                              style={{minWidth: '44px', minHeight: '44px'}}
                              aria-label="Página anterior"
                            >
                              <span className="d-none d-sm-inline">‹ Anterior</span>
                              <span className="d-inline d-sm-none">‹</span>
                            </button>
                            <span className="text-muted small">
                              Página {currentPage} de {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalOrderPages, prev + 1))}
                              disabled={currentPage === totalOrderPages}
                              className="btn btn-outline-primary btn-sm"
                              style={{minWidth: '44px', minHeight: '44px'}}
                              aria-label="Página siguiente"
                            >
                              <span className="d-none d-sm-inline">Siguiente ›</span>
                              <span className="d-inline d-sm-none">›</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Modal de Edición de Cliente */}
      {editingCustomer && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Cliente</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setEditingCustomer(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="edit-full-name" className="form-label">
                    Nombre Completo <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit-full-name"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-cedula" className="form-label">
                    Cédula <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit-cedula"
                    value={editFormData.cedula}
                    onChange={(e) => setEditFormData({ ...editFormData, cedula: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-phone" className="form-label">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="edit-email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSaveEditCustomer}
                >
                  Guardar Cambios
                </button>
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

export default CustomerSearch
