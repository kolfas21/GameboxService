import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useServiceOrders } from '../hooks/useServiceOrders'
import { useRouter } from '../contexts/RouterContext'
import { supabase } from '../lib/supabase'
import AutoRefreshIndicator from './AutoRefreshIndicator'
import DeliverySection from './DeliverySection'
import EditOrderModal from './EditOrderModal'
import ComandaPreview from './ComandaPreview'
import { useModal } from '../hooks/useModal'
import { CustomModal } from './ui/CustomModal'
import { formatDate } from '../utils/dateFormatter'
import { handleError } from '../utils/errorHandler'
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  Wrench,
  TrendingUp,
  Users,
  Calendar,
  Plus,
  Eye,
  Package,
  ArrowRight,
  Activity,
  Star,
  Edit,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  DollarSign
} from 'lucide-react'
import type { ServiceOrder } from '../types'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  // Auto-refresh habilitado para todos los roles (tiempo real via Supabase)
  const { serviceOrders, loading, updateServiceOrder, deleteServiceOrder } = useServiceOrders(true)
  const { navigate } = useRouter()
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [showComanda, setShowComanda] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  
  // Hook unificado de modales
  const { modal, showError, showSuccess, showConfirm, closeModal } = useModal()
  
  // Paginación para órdenes recientes
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 8
  
  // Búsqueda de órdenes
  const [searchTerm, setSearchTerm] = useState('')


  const getStats = () => {
    const pending = serviceOrders.filter(order => order.status === 'pending').length
    const inProgress = serviceOrders.filter(order => order.status === 'in_progress').length
    const completed = serviceOrders.filter(order => order.status === 'completed').length
    const delivered = serviceOrders.filter(order => order.status === 'delivered').length
    const total = serviceOrders.length
    
    // Estadísticas adicionales
    const withSerial = serviceOrders.filter(order => order.serial_number && order.serial_number.trim() !== '').length
    const myOrders = user?.role === 'technician' ? serviceOrders.filter(order => order.assigned_technician_id === user.id).length : 0
    const todayOrders = serviceOrders.filter(order => {
      const today = new Date().toDateString()
      return new Date(order.created_at).toDateString() === today
    }).length

    return { pending, inProgress, completed, delivered, total, withSerial, myOrders, todayOrders }
  }

  const stats = getStats()

  // Filtrado de órdenes por búsqueda
  const filteredOrders = serviceOrders.filter(order => {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    const customerName = order.customer?.full_name?.toLowerCase() || ''
    const customerCedula = order.customer?.cedula?.toLowerCase() || ''
    const deviceBrand = order.device_brand?.toLowerCase() || ''
    const deviceType = order.device_type?.toLowerCase() || ''
    const deviceModel = order.device_model?.toLowerCase() || ''
    const serialNumber = order.serial_number?.toLowerCase() || ''
    const status = order.status?.toLowerCase() || ''
    
    return customerName.includes(search) ||
           customerCedula.includes(search) ||
           deviceBrand.includes(search) ||
           deviceType.includes(search) ||
           deviceModel.includes(search) ||
           serialNumber.includes(search) ||
           status.includes(search)
  })
  
  // Funciones de paginación
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const handleEditOrder = (order: ServiceOrder) => {
    setEditingOrder(order)
  }

  const handleSaveOrder = async (orderId: string, updates: Partial<ServiceOrder>) => {
    const success = await updateServiceOrder(orderId, updates)
    return success
  }

  const handleDeleteOrder = (orderId: string) => {
    showConfirm(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar esta orden? Esta acción no se puede deshacer.',
      async () => {
        setDeletingOrderId(orderId)
        try {
          const success = await deleteServiceOrder(orderId)
          if (success) {
            showSuccess('Éxito', 'Orden eliminada exitosamente')
          } else {
            showError('Error', 'No se pudo eliminar la orden')
          }
        } catch (error) {
          console.error('Error deleting order:', error)
          showError('Error', 'Error inesperado al eliminar la orden')
        } finally {
          setDeletingOrderId(null)
        }
      }
    )
  }

  const handleShowComanda = async (order: ServiceOrder) => {
    try {
      const { data: orderWithCustomer, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
          completed_by:profiles!service_orders_completed_by_id_fkey(*),
          received_by:profiles!service_orders_received_by_id_fkey(*)
        `)
        .eq('id', order.id)
        .single()

      if (error) {
        console.error('❌ Error consultando orden con customer:', error)
        const message = handleError(error, 'handleViewComanda - query')
        showError('Error', message)
        return
      }

      if (!orderWithCustomer.customer) {
        console.error('❌ Customer no encontrado para la orden:', order.id)
        showError('Error', 'No se pudo encontrar la información del cliente para esta orden.')
        return
      }

      setSelectedOrder(orderWithCustomer as ServiceOrder)
      setShowComanda(true)
    } catch (err) {
      console.error('❌ Error general:', err)
      const message = handleError(err, 'handleViewComanda - catch')
      showError('Error', message)
    }
  }

  const handleCloseComanda = () => {
    setShowComanda(false)
    setSelectedOrder(null)
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
    const roleNames = {
      admin: 'Administrador',
      receptionist: 'Recepcionista', 
      technician: 'Técnico'
    }
    return `${greeting}, ${user?.full_name || roleNames[user?.role as keyof typeof roleNames] || 'Usuario'}`
  }

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="container-fluid px-3 px-md-4 py-3">
            {/* Header Hero */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                  <div className="card-body text-white p-3 p-md-4">
                    <div className="row align-items-center">
                      <div className="col-md-9">
                        <h2 className="h4 fw-bold mb-2">{getWelcomeMessage()}</h2>
                        <p className="mb-0 opacity-90">Panel de Administración</p>
                        <small className="opacity-75">Control total del sistema de reparaciones</small>
                        <div className="mt-2">
                          <AutoRefreshIndicator 
                              realtime={true}
                              className="opacity-75"
                            />
                        </div>
                      </div>
                      <div className="col-md-3 text-end d-none d-md-block">
                        <TrendingUp size={60} className="opacity-25" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas principales */}
            <div className="row g-2 g-sm-3 g-md-3 mb-3">
              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <StatCard
                  title="Total Órdenes"
                  value={stats.total}
                  icon={ClipboardList}
                  color="primary"
                  subtitle="Todas las órdenes"
                  trend="+12%"
                  onClick={() => navigate('orders')}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <StatCard
                  title="Pendientes"
                  value={stats.pending}
                  icon={Clock}
                  color="warning"
                  subtitle="Esperando técnico"
                  onClick={() => navigate('orders')}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <StatCard
                  title="En Progreso"
                  value={stats.inProgress}
                  icon={Wrench}
                  color="info"
                  subtitle="Siendo reparadas"
                  onClick={() => navigate('orders')}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-6 col-lg-3">
                <StatCard
                  title="Completadas"
                  value={stats.completed}
                  icon={CheckCircle}
                  color="success"
                  subtitle="Listas para entrega"
                  onClick={() => navigate('orders')}
                />
              </div>
            </div>

            {/* Estadísticas secundarias */}
            <div className="row g-2 g-sm-3 g-md-3 mb-3">
              <div className="col-12 col-sm-6 col-md-4">
                <StatCard
                  title="Órdenes Hoy"
                  value={stats.todayOrders}
                  icon={Calendar}
                  color="dark"
                  subtitle="Creadas hoy"
                  size="sm"
                />
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <StatCard
                  title="Con Número Serie"
                  value={stats.withSerial}
                  icon={Package}
                  color="info"
                  subtitle="Identificados"
                  size="sm"
                />
              </div>
              <div className="col-12 col-md-4">
                <StatCard
                  title="Entregadas"
                  value={stats.delivered}
                  icon={Package}
                  color="secondary"
                  subtitle="Proceso completo"
                  size="sm"
                />
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-transparent border-0 py-2">
                    <h6 className="card-title mb-0">
                      <Activity className="me-2" size={18} />
                      Acciones Rápidas
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="row g-2 g-sm-3">
                      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                        <button onClick={() => navigate('create-order')} className="btn btn-primary w-100 d-flex flex-column align-items-center justify-content-center p-3 py-3 border-0" style={{minHeight: '110px'}}>
                          <Plus size={24} className="mb-2" />
                          <span className="fw-semibold">Nueva Orden</span>
                          <small className="opacity-75 text-center d-none d-sm-block">Registrar dispositivo</small>
                        </button>
                      </div>
                      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                        <button onClick={() => navigate('customers')} className="btn btn-outline-primary w-100 d-flex flex-column align-items-center justify-content-center p-3 py-3" style={{minHeight: '110px'}}>
                          <Users size={24} className="mb-2" />
                          <span className="fw-semibold">Buscar Cliente</span>
                          <small className="opacity-75 text-center d-none d-sm-block">Por nombre o celular</small>
                        </button>
                      </div>
                      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                        <button onClick={() => navigate('orders')} className="btn btn-outline-secondary w-100 d-flex flex-column align-items-center justify-content-center p-3 py-3" style={{minHeight: '110px'}}>
                          <Eye size={24} className="mb-2" />
                          <span className="fw-semibold">Ver Órdenes</span>
                          <small className="opacity-75 text-center d-none d-sm-block">Todas las órdenes</small>
                        </button>
                      </div>
                      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                        <button onClick={() => navigate('caja')} className="btn btn-outline-success w-100 d-flex flex-column align-items-center justify-content-center p-3 py-3" style={{minHeight: '110px'}}>
                          <DollarSign size={24} className="mb-2" />
                          <span className="fw-semibold">Caja</span>
                          <small className="opacity-75 text-center d-none d-sm-block">Ver ingresos</small>
                        </button>
                      </div>
                      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                        <button onClick={() => navigate('users')} className="btn btn-outline-warning w-100 d-flex flex-column align-items-center justify-content-center p-3 py-3" style={{minHeight: '110px'}}>
                          <FileText size={24} className="mb-2" />
                          <span className="fw-semibold">Usuarios</span>
                          <small className="opacity-75 text-center d-none d-sm-block">Gestionar accesos</small>
                        </button>
                      </div>
                      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                        <button onClick={() => navigate('settings')} className="btn btn-outline-secondary w-100 d-flex flex-column align-items-center justify-content-center p-3 py-3" style={{minHeight: '110px'}}>
                          <Star size={24} className="mb-2" />
                          <span className="fw-semibold">Configuración</span>
                          <small className="opacity-75 text-center d-none d-sm-block">Sistema</small>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de entregas pendientes */}
            <DeliverySection />

          </div>
        )
        
      case 'receptionist':
        return (
          <div className="container-fluid px-3 px-md-4 py-3">
            {/* Header Hero */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'}}>
                  <div className="card-body text-white p-3 p-md-4">
                    <div className="row align-items-center">
                      <div className="col-md-9">
                        <h2 className="h4 fw-bold mb-2">{getWelcomeMessage()}</h2>
                        <p className="mb-0 opacity-90">Gestión de Recepción</p>
                        <small className="opacity-75">Atención al cliente y gestión de órdenes</small>
                        <div className="mt-2">
                          <AutoRefreshIndicator 
                            realtime={true}
                            className="opacity-75"
                          />
                        </div>
                      </div>
                      <div className="col-md-3 text-end d-none d-md-block">
                        <Users size={60} className="opacity-25" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas para recepcionista */}
            <div className="row g-2 g-sm-3 g-md-3 mb-3">
              <div className="col-12 col-sm-6 col-md-4">
                <StatCard
                  title="Órdenes Hoy"
                  value={stats.todayOrders}
                  icon={Calendar}
                  color="primary"
                  subtitle="Creadas hoy"
                  onClick={() => navigate('orders')}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <StatCard
                  title="Pendientes"
                  value={stats.pending}
                  icon={Clock}
                  color="warning"
                  subtitle="Esperando técnico"
                  onClick={() => navigate('orders')}
                />
              </div>
              <div className="col-12 col-md-4">
                <StatCard
                  title="Para Entrega"
                  value={stats.completed}
                  icon={CheckCircle}
                  color="success"
                  subtitle="Listas para cliente"
                  onClick={() => navigate('orders')}
                />
              </div>
            </div>

            {/* Acciones principales */}
            <div className="row g-3 mb-3">
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100 hover-card">
                  <div className="card-body text-center p-3 p-md-4">
                    <div className="mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-2">
                        <Plus size={32} className="text-primary" />
                      </div>
                    </div>
                    <h5 className="card-title fw-bold mb-2">Nueva Orden de Servicio</h5>
                    <p className="card-text text-muted mb-3 small">
                      Registra un nuevo equipo para reparación y crea la orden de servicio
                    </p>
                    <button onClick={() => navigate('create-order')} className="btn btn-primary px-3">
                      Crear Orden
                      <ArrowRight size={16} className="ms-2" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100 hover-card">
                  <div className="card-body text-center p-3 p-md-4">
                    <div className="mb-3">
                      <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-2">
                        <Users size={32} className="text-success" />
                      </div>
                    </div>
                    <h5 className="card-title fw-bold mb-2">Buscar Cliente</h5>
                    <p className="card-text text-muted mb-3 small">
                      Encuentra cliente por nombre o celular y consulta su historial de reparaciones
                    </p>
                    <button onClick={() => navigate('customers')} className="btn btn-outline-success px-3">
                      Buscar Cliente
                      <ArrowRight size={16} className="ms-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sección de entregas pendientes */}
            <DeliverySection />
          </div>
        )
        
      case 'technician':
        const myOrders = serviceOrders.filter(order => order.assigned_technician_id === user.id)
        const availableOrders = serviceOrders.filter(order => order.status === 'pending')
        const myCompleted = myOrders.filter(order => order.status === 'completed')
        
        return (
          <div className="container-fluid px-3 px-md-4 py-3">
            {/* Header Hero */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                  <div className="card-body text-white p-3 p-md-4">
                    <div className="row align-items-center">
                      <div className="col-md-9">
                        <h2 className="h4 fw-bold mb-2">{getWelcomeMessage()}</h2>
                        <p className="mb-0 opacity-90">Cola de Reparaciones</p>
                        <small className="opacity-75">Gestión técnica y reparaciones</small>
                        <div className="mt-2">
                          <AutoRefreshIndicator 
                            realtime={true}
                            className="opacity-75"
                          />
                        </div>
                      </div>
                      <div className="col-md-3 text-end d-none d-md-block">
                        <Wrench size={60} className="opacity-25" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas para técnico */}
            <div className="row g-2 g-sm-3 g-md-3 mb-3">
              <div className="col-12 col-sm-6 col-md-4">
                <StatCard
                  title="Mis Reparaciones"
                  value={myOrders.filter(o => o.status === 'in_progress').length}
                  icon={Wrench}
                  color="primary"
                  subtitle="En progreso"
                  onClick={() => navigate('orders')}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <StatCard
                  title="Disponibles"
                  value={availableOrders.length}
                  icon={Clock}
                  color="warning"
                  subtitle="Para tomar"
                  onClick={() => navigate('orders')}
                />
              </div>
              <div className="col-12 col-md-4">
                <StatCard
                  title="Completadas Hoy"
                  value={myCompleted.filter(order => {
                    const today = new Date().toDateString()
                    return new Date(order.updated_at).toDateString() === today
                  }).length}
                  icon={CheckCircle}
                  color="success"
                  subtitle="Finalizadas hoy"
                  onClick={() => navigate('orders')}
                />
              </div>
            </div>

            {/* Acción principal */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="card border-0 shadow-sm hover-card">
                  <div className="card-body text-center p-3 p-md-4">
                    <div className="mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3">
                        <Wrench size={36} className="text-primary" />
                      </div>
                    </div>
                    <h4 className="card-title fw-bold mb-2">Cola de Reparaciones</h4>
                    <p className="card-text text-muted mb-3">
                      {availableOrders.length > 0 ? 
                        `Hay ${availableOrders.length} reparación${availableOrders.length !== 1 ? 'es' : ''} disponible${availableOrders.length !== 1 ? 's' : ''} para tomar` :
                        'No hay reparaciones disponibles en este momento'
                      }
                    </p>
                    <button onClick={() => navigate('orders')} className="btn btn-primary px-4">
                      Ver Cola de Reparaciones
                      <ArrowRight size={16} className="ms-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progreso personal */}
            {myOrders.length > 0 && (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 py-2">
                      <h6 className="card-title mb-0">
                        <Star className="me-2" size={18} />
                        Mi Progreso
                      </h6>
                    </div>
                    <div className="card-body p-3">
                      <div className="row g-2">
                        <div className="col-md-4">
                          <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                            <span className="text-muted small">Reparaciones asignadas:</span>
                            <span className="fw-bold">{myOrders.length}</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                            <span className="text-muted small">En progreso:</span>
                            <span className="fw-bold text-primary">{myOrders.filter(o => o.status === 'in_progress').length}</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                            <span className="text-muted small">Completadas:</span>
                            <span className="fw-bold text-success">{myCompleted.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container-fluid px-2 px-md-3">
        <div className="row justify-content-center align-items-center" style={{minHeight: '50vh'}}>
          <div className="col-auto text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100">
      {getRoleSpecificContent()}
      
      {/* Tabla de órdenes recientes */}
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 py-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0 d-flex align-items-center">
                    <ClipboardList size={18} className="me-2 text-primary" />
                    Órdenes Recientes
                  </h5>
                  <button 
                    onClick={() => navigate('orders')} 
                    className="btn btn-outline-primary btn-sm d-flex align-items-center"
                  >
                    Ver Todas
                    <ArrowRight size={14} className="ms-1" />
                  </button>
                </div>
                
                {/* Buscador de órdenes */}
                <div className="position-relative">
                  <Search size={18} className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Buscar por nombre del cliente, celular o número de serie..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Resetear a la primera página al buscar
                    }}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                
                {/* Mostrar resultados de búsqueda */}
                {searchTerm && (
                  <div className="mt-2">
                    <small className="text-muted">
                      {filteredOrders.length === 0 ? (
                        <span className="text-danger">No se encontraron órdenes que coincidan con "{searchTerm}"</span>
                      ) : (
                        <span>Se encontraron {filteredOrders.length} orden{filteredOrders.length !== 1 ? 'es' : ''} que coinciden con "{searchTerm}"</span>
                      )}
                    </small>
                  </div>
                )}
              </div>
              <div className="card-body p-0">
                {serviceOrders.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="card-icon bg-light mb-3">
                      <ClipboardList size={48} className="text-muted" />
                    </div>
                    <h6 className="text-muted mb-3">No hay órdenes de servicio registradas</h6>
                    {(user?.role === 'admin' || user?.role === 'receptionist') && (
                      <button 
                        onClick={() => navigate('create-order')} 
                        className="btn btn-primary"
                      >
                        <Plus size={16} className="me-2" />
                        Crear Primera Orden
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col" className="border-0 fw-semibold px-2 py-3">Cliente</th>
                          <th scope="col" className="border-0 fw-semibold px-2 py-3">Dispositivo</th>
                          <th scope="col" className="border-0 fw-semibold px-2 py-3">Estado</th>
                          <th scope="col" className="border-0 fw-semibold px-2 py-3">Técnico</th>
                          <th scope="col" className="border-0 fw-semibold px-2 py-3">Fecha</th>
                          <th scope="col" className="border-0 fw-semibold px-2 py-3">Cobro</th>
                          {user?.role === 'admin' && (
                            <th scope="col" className="border-0 fw-semibold px-2 py-3 text-center" style={{ width: '17%' }}>Acciones</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrders.map((order) => (
                          <tr key={order.id} className="border-0">
                            <td className="px-2 py-2 py-md-3" data-label="Cliente">
                              <div className="d-flex flex-column flex-md-row align-items-start">
                                <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>{order.customer?.full_name}</div>
                                <small className="text-muted d-block d-md-inline ms-md-2">{order.customer?.cedula}</small>
                              </div>
                            </td>
                            <td className="px-2 py-2 py-md-3" data-label="Dispositivo">
                              <div className="d-flex flex-column">
                                <span className="fw-medium text-truncate" style={{ fontSize: '0.9rem' }}>
                                  {order.device_brand} {order.device_type}
                                </span>
                                <small className="text-muted text-truncate">
                                  {order.device_model}
                                </small>
                              </div>
                            </td>
                            <td className="px-2 py-2 py-md-3" data-label="Estado">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-2 py-2 py-md-3" data-label="Técnico">
                              {order.status === 'completed' && order.completed_by ? (
                                <div className="fw-medium text-success text-truncate" style={{ fontSize: '0.9rem' }}>
                                  {order.completed_by?.full_name || 
                                   order.completed_by?.email?.split('@')[0] || 
                                   'Técnico'}
                                </div>
                              ) : order.assigned_technician ? (
                                <div className="fw-medium text-truncate" style={{ fontSize: '0.9rem' }}>
                                  {order.assigned_technician?.full_name || 
                                   order.assigned_technician?.email?.split('@')[0] || 
                                   'Técnico'}
                                </div>
                              ) : (
                                <span className="text-muted small">Sin asignar</span>
                              )}
                            </td>
                            <td className="px-2 py-2 py-md-3" data-label="Fecha">
                              <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                                {formatDate.short(order.created_at)}
                              </small>
                            </td>
                            <td className="px-2 py-2 py-md-3" data-label="Cobro">
                              {order.status !== 'delivered' ? (
                                <span className="text-muted small">—</span>
                              ) : order.repair_result === 'not_repaired' ? (
                                <span className="badge bg-danger bg-opacity-10 text-danger" style={{ fontSize: '0.75rem' }}>Sin cobro</span>
                              ) : order.repair_cost != null && Number(order.repair_cost) > 0 ? (
                                <div>
                                  <div className="fw-semibold text-success" style={{ fontSize: '0.9rem' }}>
                                    ${Number(order.repair_cost).toLocaleString('es-CL')}
                                  </div>
                                  {order.payment_method && (
                                    <small className="text-muted text-capitalize">{order.payment_method}</small>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                            {user?.role === 'admin' && (
                              <td className="px-2 py-2 py-md-3 text-center" data-label="Acciones">
                                <div className="btn-group" role="group">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm px-2 py-2"
                                    onClick={() => handleEditOrder(order)}
                                    title="Editar"
                                    aria-label="Editar orden"
                                    style={{minWidth: '44px', minHeight: '44px'}}
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-info btn-sm px-2 py-2"
                                    onClick={() => handleShowComanda(order)}
                                    title="Comanda"
                                    aria-label="Ver comanda"
                                    style={{minWidth: '44px', minHeight: '44px'}}
                                  >
                                    <FileText size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm px-2 py-2"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    disabled={deletingOrderId === order.id}
                                    title="Eliminar"
                                    style={{minWidth: '44px', minHeight: '44px'}}
                                  >
                                    {deletingOrderId === order.id ? (
                                      <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                      </div>
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Controles de paginación */}
                {filteredOrders.length > ordersPerPage && (
                  <div className="card-footer bg-transparent border-top py-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                      <div className="text-muted small text-center text-md-start order-2 order-md-1">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length}{searchTerm && ` (filtrado de ${serviceOrders.length} total)`}
                      </div>
                      <div className="d-flex align-items-center justify-content-center gap-2 order-1 order-md-2">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="btn btn-outline-primary btn-sm px-3 py-2 d-flex align-items-center"
                          style={{minHeight: '40px'}}
                        >
                          <ChevronLeft size={16} className="d-none d-sm-inline me-1" />
                          <span className="d-inline d-sm-none">‹</span>
                          <span className="d-none d-sm-inline">Anterior</span>
                        </button>
                        <span className="text-muted small px-2" style={{minWidth: '80px', textAlign: 'center'}}>
                          <span className="d-none d-sm-inline">Página </span>
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="btn btn-outline-primary btn-sm px-3 py-2 d-flex align-items-center"
                          style={{minHeight: '40px'}}
                        >
                          <span className="d-none d-sm-inline">Siguiente</span>
                          <span className="d-inline d-sm-none">›</span>
                          <ChevronRight size={16} className="d-none d-sm-inline ms-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición - Solo para Admin */}
      {user?.role === 'admin' && editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleSaveOrder}
        />
      )}

      {/* Comanda de Impresión */}
      {showComanda && selectedOrder && selectedOrder.customer && (
        <div className="row mt-4">
          <div className="col-12">
            <ComandaPreview
              order={selectedOrder}
              customer={selectedOrder.customer}
              onClose={handleCloseComanda}
            />
          </div>
        </div>
      )}

      {/* Modal Unificado */}
      <CustomModal 
        {...modal} 
        onClose={closeModal}
        onConfirm={modal.onConfirm ? () => {
          modal.onConfirm?.()
          closeModal()
        } : closeModal}
      />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: any
  color: 'primary' | 'warning' | 'info' | 'success' | 'danger' | 'secondary' | 'dark'
  subtitle?: string
  trend?: string
  onClick?: () => void
  size?: 'sm' | 'md'
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle,
  trend,
  onClick,
  size = 'md'
}) => {
  const colorClasses = {
    primary: 'bg-primary',
    warning: 'bg-warning', 
    info: 'bg-info',
    success: 'bg-success',
    danger: 'bg-danger',
    secondary: 'bg-secondary',
    dark: 'bg-dark'
  }

  const hoverClasses = onClick ? 'hover-card' : ''
  const cardHeight = size === 'sm' ? 'h-auto' : 'h-100'

  return (
    <div 
      className={`card border-0 shadow-sm ${hoverClasses} ${cardHeight}`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        minHeight: size === 'sm' ? '100px' : '120px'
      }}
    >
      <div className="card-body p-3 p-sm-4 p-md-4">
        <div className="d-flex flex-row flex-sm-row align-items-center">
          <div className={`${colorClasses[color]} bg-opacity-10 rounded-3 p-2 p-sm-3 me-3 d-flex align-items-center justify-content-center flex-shrink-0`}
               style={{
                 width: size === 'sm' ? '48px' : '56px',
                 height: size === 'sm' ? '48px' : '56px'
               }}>
            <Icon size={size === 'sm' ? 20 : 24} className={`text-${color}`} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <h6 className="card-subtitle mb-1 text-muted small text-truncate">{title}</h6>
            {subtitle && (
              <p className="mb-1 text-muted d-none d-sm-block text-truncate" style={{fontSize: '0.75rem'}}>
                {subtitle}
              </p>
            )}
            <div className="d-flex align-items-baseline flex-wrap">
              <h4 className={`card-title mb-0 fw-bold ${size === 'sm' ? 'h5' : 'h3'} me-2`}>
                {value}
              </h4>
              {trend && (
                <small className="text-success">{trend}</small>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'outsourced'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      classes: 'bg-warning text-dark'
    },
    in_progress: {
      label: 'En Progreso',
      classes: 'bg-primary text-white'
    },
    completed: {
      label: 'Completada',
      classes: 'bg-success text-white'
    },
    delivered: {
      label: 'Entregada',
      classes: 'bg-secondary text-white'
    },
    outsourced: {
      label: 'Tercerizada',
      classes: 'bg-info text-white'
    }
  }

  const config = statusConfig[status]

  return (
    <span className={`badge ${config.classes} rounded-pill`}>
      {config.label}
    </span>
  )
}

export default Dashboard
