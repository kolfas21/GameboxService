import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from '../contexts/RouterContext'
import { useCompanySettings } from '../hooks'
import { 
  LogOut, 
  Home, 
  Users, 
  Wrench, 
  ClipboardList, 
  Settings,
  User,
  Shield,
  UserCheck,
  Package,
  Building,
  DollarSign
} from 'lucide-react'
import logoGamebox from '../assets/logo-gamebox.png'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const { navigate, currentPage } = useRouter()
  const { settings, loading } = useCompanySettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigationItems = [
    { icon: Home, label: 'Dashboard', page: 'dashboard' as const, roles: ['admin', 'receptionist', 'technician'] },
    { icon: ClipboardList, label: 'Órdenes', page: 'orders' as const, roles: ['admin', 'receptionist', 'technician'] },
    { icon: Users, label: 'Clientes', page: 'customers' as const, roles: ['admin', 'receptionist'] },
    { icon: Package, label: 'Garantía', page: 'warranty' as const, roles: ['admin', 'receptionist'], requiresFeature: 'warranty_tracking' as const },
    { icon: Building, label: 'Talleres', page: 'external-workshops' as const, roles: ['admin', 'receptionist'], requiresFeature: 'outsourcing' as const },
    { icon: Users, label: 'Usuarios', page: 'users' as const, roles: ['admin'] },
    { icon: DollarSign, label: 'Caja', page: 'caja' as const, roles: ['admin'] },
    { icon: Settings, label: 'Configuración', page: 'settings' as const, roles: ['admin'] },
  ]

  const visibleItems = navigationItems.filter(item => {
    // Filtrar por rol
    const hasRole = user && item.roles.includes(user.role)
    if (!hasRole) return false

    // Filtrar por feature si es necesario
    if (item.requiresFeature) {
      const featureEnabled = settings?.features_enabled?.[item.requiresFeature]
      return featureEnabled !== false
    }

    return true
  })

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: 'Administrador',
      receptionist: 'Recepcionista',
      technician: 'Técnico'
    }
    return roleMap[role as keyof typeof roleMap] || role
  }

  const getRoleIcon = (role: string) => {
    const roleIcons = {
      admin: Shield,
      receptionist: UserCheck,
      technician: Wrench
    }
    return roleIcons[role as keyof typeof roleIcons] || User
  }

  const getRoleColor = (role: string) => {
    const roleColors = {
      admin: 'primary',
      receptionist: 'success', 
      technician: 'warning'
    }
    return roleColors[role as keyof typeof roleColors] || 'secondary'
  }

  const RoleIcon = getRoleIcon(user?.role || '')
  const roleColor = getRoleColor(user?.role || '')

  // Estado para forzar actualización del logo
  const [logoKey, setLogoKey] = useState(Date.now())

  // IMPORTANTE: Solo usar logo de BD cuando esté cargado (evita flash del logo hardcodeado)
  // Si settings aún no cargó (loading=true), usar logo hardcodeado SOLO como último recurso
  // Una vez cargado, priorizar siempre el logo de la BD
  const displayLogo = useMemo(() => {
    // Si está cargando Y no hay settings, mostrar logo temporal
    if (loading && !settings) {
      return logoGamebox
    }
    // Una vez cargado, usar SOLO el logo de la BD (o hardcodeado si BD no tiene)
    return settings?.logo_url || logoGamebox
  }, [settings?.logo_url, loading, settings])
  
  const companyName = settings?.company_name || 'GameBox Service'
  
  // Agregar timestamp dinámico para evitar cache del navegador
  const logoWithCacheBust = displayLogo.includes('supabase') 
    ? `${displayLogo.split('?')[0]}?t=${logoKey}` 
    : displayLogo

  // Actualizar logo cuando cambie settings.logo_url
  useEffect(() => {
    if (settings?.logo_url) {
      setLogoKey(Date.now())
      console.log('🔄 Logo de BD cargado:', settings.logo_url)
    }
  }, [settings?.logo_url])

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-bottom">
        <nav className="navbar navbar-expand-lg navbar-light bg-white px-2 px-sm-3 px-md-4 py-2">
          <div className="container-fluid p-0">
            {/* Brand - Clickeable Logo */}
            <button 
              onClick={() => navigate('dashboard')}
              className="navbar-brand d-flex align-items-center mb-0 me-auto btn border-0 p-0 bg-transparent"
              style={{ cursor: 'pointer' }}
              aria-label="Ir al inicio"
            >
              <img 
                src={logoWithCacheBust} 
                alt={companyName} 
                className="img-fluid"
                style={{ 
                  width: '140px', 
                  height: '40px', 
                  objectFit: 'contain' 
                }}
              />
            </button>

            {/* User Info Mobile - Between logo and toggle */}
            <div className="d-flex d-lg-none align-items-center me-2">
              <div className={`bg-${roleColor} bg-opacity-10 rounded-circle p-2`}>
                <RoleIcon size={14} className={`text-${roleColor}`} />
              </div>
            </div>

            {/* Mobile menu button */}
            <button 
              className="navbar-toggler border-0 p-1" 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            {/* Navigation Menu */}
            <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`}>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.page
                  return (
                    <li key={item.page} className="nav-item">
                      <button
                        onClick={() => {
                          navigate(item.page)
                          setMobileMenuOpen(false)
                        }}
                        className={`nav-link btn border-0 d-flex align-items-center px-3 py-2 ${
                          isActive 
                            ? `text-${roleColor} fw-semibold bg-${roleColor} bg-opacity-10 rounded` 
                            : 'text-dark hover-nav-link'
                        }`}
                      >
                        <Icon size={16} className="me-2" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {/* User Info & Sign Out - Desktop */}
              <div className="d-none d-lg-flex align-items-center">
                <div className="d-flex align-items-center me-3">
                  <div className={`bg-${roleColor} bg-opacity-10 rounded-circle p-2 me-2`}>
                    <RoleIcon size={16} className={`text-${roleColor}`} />
                  </div>
                  <div>
                    <div className="fw-semibold small text-truncate" style={{maxWidth: '150px'}}>
                      {user?.full_name || user?.email}
                    </div>
                    <small className="text-muted">
                      {getRoleDisplay(user?.role || '')}
                    </small>
                  </div>
                </div>
                
                <button
                  onClick={signOut}
                  className="btn btn-outline-danger btn-sm d-flex align-items-center"
                >
                  <LogOut size={14} className="me-1" />
                  <span>Salir</span>
                </button>
              </div>

              {/* Sign Out Mobile - Inside collapsed menu */}
              <div className="d-lg-none mt-3 pt-3 border-top">
                <div className="d-flex align-items-center mb-3 px-3">
                  <div className={`bg-${roleColor} bg-opacity-10 rounded-circle p-2 me-2`}>
                    <RoleIcon size={16} className={`text-${roleColor}`} />
                  </div>
                  <div>
                    <div className="fw-semibold small text-truncate" style={{maxWidth: '200px'}}>
                      {user?.full_name || user?.email}
                    </div>
                    <small className="text-muted">
                      {getRoleDisplay(user?.role || '')}
                    </small>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                >
                  <LogOut size={16} className="me-2" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1 bg-light" style={{ width: '100%', overflowX: 'hidden' }}>
        <div className="container-fluid px-2 px-sm-3 px-md-4 py-3 py-md-4">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
