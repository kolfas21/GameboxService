import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, UserRole } from '../types'

interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: UserRole
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Solo obtener perfiles existentes (evitamos el error de admin)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        throw profilesError
      }

      setUsers(profiles || [])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: CreateUserData) => {
    try {
      setError(null)
      
      // Crear usuario usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Crear perfil en la tabla profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role
          })
          .select()
          .single()

        if (profileError) {
          // Perfil puede haberse creado automáticamente
        }

        await fetchUsers()
        
        return { data: authData.user, error: null }
      }
      
      return { data: null, error: 'No se pudo crear el usuario' }
    } catch (error: any) {
      console.error('Error creating user:', error)
      setError(error.message)
      return { data: null, error: error.message }
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      setError(null)
      
      // Solo eliminar el perfil (no podemos eliminar de auth sin permisos admin)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        throw profileError
      }

      // Actualizar la lista local
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      
      return { error: null }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message)
      return { error: error.message }
    }
  }

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setError(null)
      
      // Intentar actualizar el perfil existente
      const { data, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (profileError) {
        // Si falla, puede que el perfil no exista - intentar crearlo
        const userToUpdate = users.find(u => u.id === userId)
        if (userToUpdate) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userToUpdate.email,
              full_name: userToUpdate.full_name,
              role: newRole,
              created_at: userToUpdate.created_at,
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            throw insertError
          }
        } else {
          throw profileError
        }
      }

      // Actualizar la lista local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId 
            ? { ...user, role: newRole, updated_at: new Date().toISOString() } 
            : user
        )
      )
      
      return { data, error: null }
    } catch (error: any) {
      console.error('Error updating user role:', error)
      setError(error.message)
      return { data: null, error: error.message }
    }
  }

  const updateUserSede = async (userId: string, newSede: string) => {
    try {
      setError(null)
      
      const { data, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          sede: newSede,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (profileError) {
        throw profileError
      }

      // Actualizar la lista local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId 
            ? { ...user, sede: newSede, updated_at: new Date().toISOString() } 
            : user
        )
      )
      
      return { data, error: null }
    } catch (error: any) {
      console.error('Error updating user sede:', error)
      setError(error.message)
      return { data: null, error: error.message }
    }
  }

  const updateUserBranchPhone = async (userId: string, newBranchPhone: string) => {
    try {
      setError(null)
      
      const { data, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          branch_phone: newBranchPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (profileError) {
        throw profileError
      }

      // Actualizar la lista local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId 
            ? { ...user, branch_phone: newBranchPhone, updated_at: new Date().toISOString() } 
            : user
        )
      )
      
      return { data, error: null }
    } catch (error: any) {
      console.error('Error updating user branch phone:', error)
      setError(error.message)
      return { data: null, error: error.message }
    }
  }

  const createMissingProfile = async (userId: string, email: string, fullName?: string) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || 'Usuario',
          role: 'receptionist',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Actualizar la lista local
      await fetchUsers()
      
      return { data, error: null }
    } catch (error: any) {
      console.error('Error creating missing profile:', error)
      setError(error.message)
      return { data: null, error: error.message }
    }
  }

  const createQuickUser = async (role: UserRole, name: string) => {
    const userData = {
      email: `${role}@gameboxservice.com`,
      password: '123456',
      full_name: name,
      role: role
    }
    return await createUser(userData)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    createUser,
    createQuickUser,
    deleteUser,
    updateUserRole,
    updateUserSede,
    updateUserBranchPhone,
    createMissingProfile,
    refreshUsers: fetchUsers
  }
}