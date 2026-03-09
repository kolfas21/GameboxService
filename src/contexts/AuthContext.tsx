import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange es el único source of truth para el estado de auth.
    // Supabase v2 emite INITIAL_SESSION al montar (con sesión o null),
    // evitando la doble llamada que ocurre al combinar con getSession().
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      // No llamar funciones async directamente en el callback de Supabase
      setTimeout(() => fetchUserProfile(session.user), 0)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (supabaseUser: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        console.error('❌ Error obteniendo perfil:', error)
        if (error.code === 'PGRST116') {
          let role = 'receptionist'
          if (supabaseUser.email === 'admin@gameboxservice.com') {
            role = 'admin'
          } else if (supabaseUser.user_metadata?.role) {
            role = supabaseUser.user_metadata.role
          }
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
              role: role
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ Error creando perfil:', createError)
            setUser(null)
          } else {
            setUser(newProfile)
          }
        } else {
          setUser(null)
        }
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error('❌ Error inesperado obteniendo perfil:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    try {
      setUser(null)
      
      // Limpiar caché de configuración al cerrar sesión
      try {
        localStorage.removeItem('company_settings_cache')
        console.log('🗑️ Caché de settings limpiado al cerrar sesión')
      } catch (err) {
        console.warn('⚠️ No se pudo limpiar caché:', err)
      }
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error durante logout:', error)
      }
    } catch (error) {
      console.error('Error durante logout:', error)
    }
  }

  const value = {
    user,
    session,
    signIn,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
