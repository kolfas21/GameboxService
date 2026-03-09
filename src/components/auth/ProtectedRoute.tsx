/**
 * Componente de Orden Superior (HOC) para protección de rutas
 * Permite proteger componentes basándose en roles de usuario
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from '../../contexts/RouterContext'
import type { Page } from '../../contexts/RouterContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: Array<'admin' | 'receptionist' | 'technician'>
  redirectTo?: Page
  showLoading?: boolean
}

/**
 * Componente que protege rutas basándose en roles
 * 
 * Uso:
 * ```tsx
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminContent />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = 'dashboard',
  showLoading = false
}) => {
  const { user, loading } = useAuth()
  const { navigate } = useRouter()

  useEffect(() => {
    // Solo redirigir si ya terminó de cargar y el usuario no tiene permiso
    if (!loading && user && !allowedRoles.includes(user.role)) {
      console.warn(`⚠️ Access denied. User role: ${user.role}. Required roles: ${allowedRoles.join(', ')}`)
      navigate(redirectTo)
    }
  }, [user, loading, allowedRoles, redirectTo, navigate])

  // Mostrar loading mientras se verifica autenticación
  if (loading && showLoading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Verificando permisos...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No renderizar nada mientras redirige o si no hay usuario
  if (!user) return null
  if (!allowedRoles.includes(user.role)) return null

  // Usuario autorizado, mostrar contenido
  return <>{children}</>
}

/**
 * HOC que envuelve un componente para protegerlo
 * 
 * Uso:
 * ```tsx
 * export default withProtectedRoute(AdminPanel, ['admin'])
 * ```
 */
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Array<'admin' | 'receptionist' | 'technician'>,
  redirectTo: Page = 'dashboard'
) => {
  return (props: P) => (
    <ProtectedRoute allowedRoles={allowedRoles} redirectTo={redirectTo}>
      <Component {...props} />
    </ProtectedRoute>
  )
}

/**
 * Hook personalizado para verificar permisos
 * 
 * Uso:
 * ```tsx
 * const { hasRole, hasAnyRole, hasAllRoles } = usePermissions()
 * 
 * if (hasRole('admin')) {
 *   // Mostrar contenido de admin
 * }
 * ```
 */
export const usePermissions = () => {
  const { user } = useAuth()

  const hasRole = (role: 'admin' | 'receptionist' | 'technician'): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: Array<'admin' | 'receptionist' | 'technician'>): boolean => {
    return user ? roles.includes(user.role) : false
  }

  const hasAllRoles = (roles: Array<'admin' | 'receptionist' | 'technician'>): boolean => {
    // Para un sistema con un solo rol por usuario, esto solo tiene sentido con un rol
    return user ? roles.length === 1 && roles[0] === user.role : false
  }

  const isAdmin = (): boolean => hasRole('admin')
  const isReceptionist = (): boolean => hasRole('receptionist')
  const isTechnician = (): boolean => hasRole('technician')

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isReceptionist,
    isTechnician,
    currentRole: user?.role
  }
}

// Constantes de roles para facilitar el uso
export const ROLE = {
  ADMIN: 'admin' as const,
  RECEPTIONIST: 'receptionist' as const,
  TECHNICIAN: 'technician' as const
}
