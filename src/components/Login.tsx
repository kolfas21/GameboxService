import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCompanySettings } from '../hooks'
import {
  LogIn,
  User,
  Lock,
  ArrowRight,
  Wrench,
  ClipboardList,
  Users,
  BadgeCheck,
  Building,
  DollarSign,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react'
import logoGamebox from '../assets/logo-gamebox.png'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
  const { settings, loading: settingsLoading } = useCompanySettings()

  const companyName = settings?.company_name || 'GameBox Service'
  const companyInitial = companyName.charAt(0).toUpperCase()
  const hasWarranty = settings?.features_enabled?.warranty_tracking !== false
  const hasOutsourcing = settings?.features_enabled?.outsourcing !== false

  // Solo mostrar el logo una vez que la BD haya respondido
  // Si settingsLoading es true, displayLogo será null (no se muestra nada)
  // Una vez cargado, usar el logo de la BD o el hardcodeado como último recurso
  const displayLogo = settingsLoading
    ? null
    : (settings?.logo_url || logoGamebox)

  // Agregar timestamp dinámico para evitar cache del navegador
  const logoWithCacheBust = displayLogo && displayLogo.includes('supabase')
    ? `${displayLogo.split('?')[0]}?t=${Date.now()}`
    : displayLogo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor ingresa email y contraseña')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        console.error('❌ Error de login:', error)
        setError(`Error: ${error.message || 'Credenciales inválidas'}`)
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err)
      setError('Error de conexión. Verifica tu configuración.')
    }
    
    setLoading(false)
  }

  return (
    <div className="modern-login-page">
      <div className="container modern-login-container">
        <div className="modern-login-shell">
          <div className="modern-login-grid row g-0">
            <div className="col-12 col-lg-6 modern-login-aside d-flex">
              <div className="w-100 d-flex flex-column">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <span className="modern-login-brand-dot">{companyInitial}</span>
                  <div>
                    <p className="modern-login-eyebrow mb-0">Plataforma de Taller</p>
                    <h2 className="modern-login-brand mb-0">{companyName}</h2>
                  </div>
                </div>

                <div className="modern-login-copy mb-4">
                  <h1 className="modern-login-title">
                    Todo tu servicio tecnico,
                    <br />
                    en un solo lugar.
                  </h1>
                  <p className="modern-login-subtitle mb-0">
                    Gestiona ordenes de reparacion, clientes, garantias y control operativo
                    diario con una interfaz rapida y clara para tu equipo.
                  </p>
                </div>

                <div className="modern-login-stats row g-2 mb-4">
                  <div className="col-4">
                    <div className="modern-login-stat">
                      <strong>Ordenes</strong>
                      <span>Flujo completo</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="modern-login-stat">
                      <strong>Clientes</strong>
                      <span>Historial y busqueda</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="modern-login-stat">
                      <strong>Caja</strong>
                      <span>Control de cobros</span>
                    </div>
                  </div>
                </div>

                <div className="modern-login-features mt-auto">
                  <h3 className="modern-login-features-title">Incluido en tu plan</h3>
                  <ul className="modern-login-feature-list list-unstyled mb-0">
                    <li>
                      <ClipboardList size={16} />
                      <span>Ordenes de servicio y seguimiento por estados</span>
                    </li>
                    <li>
                      <Users size={16} />
                      <span>Gestion de clientes con historial por equipo</span>
                    </li>
                    <li>
                      <Wrench size={16} />
                      <span>Flujo por roles: administrador, recepcion y tecnico</span>
                    </li>
                    {hasWarranty && (
                      <li>
                        <BadgeCheck size={16} />
                        <span>Consultas y control de garantias</span>
                      </li>
                    )}
                    {hasOutsourcing && (
                      <li>
                        <Building size={16} />
                        <span>Gestion de talleres externos</span>
                      </li>
                    )}
                    <li>
                      <DollarSign size={16} />
                      <span>Control de caja y entregas</span>
                    </li>
                    <li>
                      <ShieldCheck size={16} />
                      <span>Datos privados y seguros</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6 modern-login-panel-wrap d-flex">
              <div className="modern-login-panel my-auto w-100">
                <div className="text-center mb-4">
                  <div className="d-flex justify-content-center align-items-center mb-2" style={{ minHeight: '80px' }}>
                    {logoWithCacheBust && (
                      <img
                        src={logoWithCacheBust}
                        alt={companyName}
                        className="img-fluid"
                        style={{ width: '210px', height: '80px', objectFit: 'contain' }}
                      />
                    )}
                  </div>                  
                </div>

                <div className="modern-login-form-head mb-3">
                  <h4 className="mb-1">Acceder</h4>
                  <p className="mb-0">Ingresa con tu usuario autorizado para continuar.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label modern-login-label">Email</label>
                    <div className="input-group modern-login-input-group">
                      <span className="input-group-text">
                        <User size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@taller.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label htmlFor="password" className="form-label modern-login-label mb-0">Contraseña</label>
                      <span className="modern-login-link-hint">
                        Recuperacion por administrador
                      </span>
                    </div>
                    <div className="input-group modern-login-input-group">
                      <span className="input-group-text">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimo 8 caracteres"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="input-group-text modern-login-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn modern-login-submit w-100 mt-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <LogIn size={16} className="me-2" />
                        Entrar al sistema
                        <ArrowRight size={16} className="ms-2" />
                      </>
                    )}
                  </button>

                  <p className="modern-login-register mb-0 mt-3 text-center">
                    ¿No tienes acceso? <span>Solicitalo al administrador</span>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login