import React, { lazy, Suspense } from 'react'
import { useRouter } from '../contexts/RouterContext'

// Lazy loading de componentes para code splitting
const Dashboard = lazy(() => import('./Dashboard'))
const ServiceQueue = lazy(() => import('./ServiceQueue'))
const CustomerSearch = lazy(() => import('./CustomerSearch'))
const CreateOrder = lazy(() => import('./CreateOrder'))
const WarrantySearch = lazy(() => import('./WarrantySearch'))
const Settings = lazy(() => import('./Settings'))
const ExternalWorkshops = lazy(() => import('./ExternalWorkshops'))
const UserManagement = lazy(() => import('./UserManagement'))
const CajaPage = lazy(() => import('./CajaPage'))

// Componente de carga mientras se cargan los componentes lazy
const LoadingFallback: React.FC = () => (
  <div className="container-fluid px-3 px-md-4 py-3">
    <div className="row">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mb-0">Cargando módulo...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const PageRenderer: React.FC = () => {
  const { currentPage } = useRouter()

  // Renderizar componente con Suspense para lazy loading
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'orders':
        return <ServiceQueue />
      case 'customers':
        return <CustomerSearch />
      case 'warranty':
        return <WarrantySearch />
      case 'create-order':
        return <CreateOrder />
      case 'external-workshops':
        return <ExternalWorkshops />
      case 'settings':
        return <Settings />
      case 'users':
        return <UserManagement />
      case 'caja':
        return <CajaPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {renderPage()}
    </Suspense>
  )
}

export default PageRenderer
