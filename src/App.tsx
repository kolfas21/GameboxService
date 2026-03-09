import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RouterProvider } from './contexts/RouterContext'
import { useDynamicPageInfo } from './hooks'
import Login from './components/Login'
import Layout from './components/Layout'
import PageRenderer from './components/PageRenderer'
import InviteAcceptance from './components/InviteAcceptance'

function AppContent() {
  const { user, loading } = useAuth()
  
  // Actualizar título y favicon dinámicamente desde la configuración
  useDynamicPageInfo()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Verificar si es una URL de invitación
  const urlParams = new URLSearchParams(window.location.search)
  const isInviteUrl = urlParams.has('token') || urlParams.has('confirmation_url') || window.location.hash.includes('access_token')

  // Si es una URL de invitación, mostrar el componente de aceptación
  if (isInviteUrl) {
    return <InviteAcceptance />
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <PageRenderer />
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  )
}

export default App
