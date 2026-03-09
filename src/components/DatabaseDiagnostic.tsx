import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

const DatabaseDiagnostic: React.FC = () => {
  const { user } = useAuth()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [user])

  const runDiagnostics = async () => {
    setLoading(true)
    const testResults = []

    // Test 1: Verificar conexión básica
    try {
      const { error } = await supabase.from('profiles').select('count').single()
      testResults.push({
        name: 'Conexión a Supabase',
        status: !error ? 'success' : 'error',
        message: !error ? 'Conexión exitosa' : error.message
      })
    } catch (err) {
      testResults.push({
        name: 'Conexión a Supabase',
        status: 'error',
        message: 'Error de conexión'
      })
    }

    // Test 2: Verificar permisos en profiles
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      testResults.push({
        name: 'Lectura de Profiles',
        status: !error ? 'success' : 'error',
        message: !error ? `Lectura exitosa (${data?.length || 0} registros)` : error.message
      })
    } catch (err: any) {
      testResults.push({
        name: 'Lectura de Profiles',
        status: 'error',
        message: err.message
      })
    }

    // Test 3: Verificar permisos en customers
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1)
      
      testResults.push({
        name: 'Lectura de Customers',
        status: !error ? 'success' : 'error',
        message: !error ? `Lectura exitosa (${data?.length || 0} registros)` : error.message
      })
    } catch (err: any) {
      testResults.push({
        name: 'Lectura de Customers',
        status: 'error',
        message: err.message
      })
    }

    // Test 4: Verificar inserción en customers
    try {
      const testCustomer = {
        cedula: 'TEST123456',
        full_name: 'Cliente de Prueba',
        phone: '123456789',
        email: 'test@test.com'
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(testCustomer)
        .select()
        .single()

      if (!error) {
        // Limpiar el registro de prueba
        await supabase.from('customers').delete().eq('id', data.id)
        testResults.push({
          name: 'Inserción en Customers',
          status: 'success',
          message: 'Inserción y eliminación exitosa'
        })
      } else {
        testResults.push({
          name: 'Inserción en Customers',
          status: 'error',
          message: error.message
        })
      }
    } catch (err: any) {
      testResults.push({
        name: 'Inserción en Customers',
        status: 'error',
        message: err.message
      })
    }

    // Test 5: Verificar permisos en service_orders
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .limit(1)
      
      testResults.push({
        name: 'Lectura de Service Orders',
        status: !error ? 'success' : 'error',
        message: !error ? `Lectura exitosa (${data?.length || 0} registros)` : error.message
      })
    } catch (err: any) {
      testResults.push({
        name: 'Lectura de Service Orders',
        status: 'error',
        message: err.message
      })
    }

    // Test 6: Verificar usuario actual
    testResults.push({
      name: 'Usuario Autenticado',
      status: user ? 'success' : 'error',
      message: user ? `Usuario: ${user.email} (${user.role})` : 'No hay usuario autenticado'
    })

    // Test 7: Verificar búsqueda por cédula
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('cedula', '65456454')

      testResults.push({
        name: 'Búsqueda por Cédula',
        status: !error ? 'success' : 'error',
        message: !error ? `Búsqueda exitosa (${data?.length || 0} resultados)` : error.message
      })
    } catch (err: any) {
      testResults.push({
        name: 'Búsqueda por Cédula',
        status: 'error',
        message: err.message
      })
    }

    setTests(testResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Ejecutando diagnósticos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 py-3">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <AlertTriangle size={20} className="me-2 text-warning" />
                Diagnóstico de Base de Datos
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {tests.map((test, index) => (
                  <div key={index} className="col-12">
                    <div className={`alert ${test.status === 'success' ? 'alert-success' : 'alert-danger'} border-0 shadow-sm d-flex align-items-center`}>
                      <div className="me-3">
                        {test.status === 'success' ? (
                          <CheckCircle size={20} className="text-success" />
                        ) : (
                          <X size={20} className="text-danger" />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="alert-heading mb-1 fw-bold">{test.name}</h6>
                        <p className="mb-0 small">{test.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <button 
                  onClick={runDiagnostics}
                  className="btn btn-primary"
                >
                  Ejecutar Diagnósticos Nuevamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseDiagnostic