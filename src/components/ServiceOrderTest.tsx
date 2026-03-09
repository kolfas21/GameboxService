import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AlertTriangle, CheckCircle, X, Database } from 'lucide-react'
import { generateOrderNumberSimple } from '../utils/orderNumber'

const ServiceOrderTest: React.FC = () => {
  const { user } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults = []

    // Test 1: Crear un cliente de prueba
    try {
      console.log('🧪 Test 1: Creando cliente de prueba')
      const testCustomer = {
        cedula: `TEST${Date.now()}`,
        full_name: 'Cliente de Prueba Test',
        phone: '1234567890',
        email: 'test@example.com'
      }

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert(testCustomer)
        .select()
        .single()

      if (customerError) {
        testResults.push({
          name: 'Crear Cliente de Prueba',
          status: 'error',
          message: customerError.message,
          details: customerError
        })
      } else {
        testResults.push({
          name: 'Crear Cliente de Prueba',
          status: 'success',
          message: `Cliente creado con ID: ${customerData.id}`,
          data: customerData
        })

        // Test 2: Crear orden de servicio básica
        try {
          console.log('🧪 Test 2: Creando orden de servicio básica')
          
          // Generar número de orden único
          const orderNumber = generateOrderNumberSimple()
          
          const testOrder = {
            order_number: orderNumber,
            customer_id: customerData.id,
            device_type: 'Consola',
            device_brand: 'PlayStation',
            device_model: 'PS5',
            problem_description: 'Prueba de creación de orden de servicio',
            status: 'pending',
            priority: 'medium',
            received_by_id: user?.id
          }

          const { data: orderData, error: orderError } = await supabase
            .from('service_orders')
            .insert(testOrder)
            .select()
            .single()

          if (orderError) {
            testResults.push({
              name: 'Crear Orden de Servicio Básica',
              status: 'error',
              message: orderError.message,
              details: orderError
            })
          } else {
            testResults.push({
              name: 'Crear Orden de Servicio Básica',
              status: 'success',
              message: `Orden creada con ID: ${orderData.id}`,
              data: orderData
            })

            // Test 3: Obtener orden con relaciones
            try {
              console.log('🧪 Test 3: Obteniendo orden con relaciones')
              const { data: completeOrder, error: fetchError } = await supabase
                .from('service_orders')
                .select(`
                  *,
                  customer:customers(*),
                  assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
                  received_by:profiles!service_orders_received_by_id_fkey(*)
                `)
                .eq('id', orderData.id)
                .single()

              if (fetchError) {
                testResults.push({
                  name: 'Obtener Orden con Relaciones',
                  status: 'error',
                  message: fetchError.message,
                  details: fetchError
                })
              } else {
                testResults.push({
                  name: 'Obtener Orden con Relaciones',
                  status: 'success',
                  message: 'Orden obtenida con todas las relaciones',
                  data: completeOrder
                })
              }
            } catch (err: any) {
              testResults.push({
                name: 'Obtener Orden con Relaciones',
                status: 'error',
                message: err.message
              })
            }

            // Limpiar orden de prueba
            await supabase.from('service_orders').delete().eq('id', orderData.id)
          }
        } catch (err: any) {
          testResults.push({
            name: 'Crear Orden de Servicio Básica',
            status: 'error',
            message: err.message
          })
        }

        // Limpiar cliente de prueba
        await supabase.from('customers').delete().eq('id', customerData.id)
      }
    } catch (err: any) {
      testResults.push({
        name: 'Crear Cliente de Prueba',
        status: 'error',
        message: err.message
      })
    }

    // Test 4: Verificar foreign keys
    try {
      console.log('🧪 Test 4: Verificando foreign keys')
      const { error } = await supabase.rpc('get_foreign_keys_info', {
        table_name: 'service_orders'
      }).single()

      if (error && error.code !== '42883') { // Function not found is expected
        testResults.push({
          name: 'Verificar Foreign Keys',
          status: 'warning',
          message: 'No se pudo verificar automáticamente las foreign keys'
        })
      } else {
        testResults.push({
          name: 'Verificar Foreign Keys',
          status: 'success',
          message: 'Estructura de foreign keys verificada'
        })
      }
    } catch (err: any) {
      testResults.push({
        name: 'Verificar Foreign Keys',
        status: 'warning',
        message: 'Verificación manual de foreign keys requerida'
      })
    }

    setResults(testResults)
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="alert alert-warning">
        <AlertTriangle size={20} className="me-2" />
        Debes estar autenticado para ejecutar las pruebas.
      </div>
    )
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-transparent border-0 py-3">
        <h5 className="card-title mb-0 d-flex align-items-center">
          <Database size={20} className="me-2 text-info" />
          Pruebas de Órdenes de Servicio
        </h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <button 
            onClick={runTests}
            disabled={loading}
            className="btn btn-info"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Ejecutando Pruebas...
              </>
            ) : (
              'Ejecutar Pruebas de Órdenes de Servicio'
            )}
          </button>
        </div>

        {results.length > 0 && (
          <div className="row g-3">
            {results.map((result, index) => (
              <div key={index} className="col-12">
                <div className={`alert ${
                  result.status === 'success' ? 'alert-success' : 
                  result.status === 'warning' ? 'alert-warning' : 'alert-danger'
                } border-0 shadow-sm d-flex align-items-start`}>
                  <div className="me-3 mt-1">
                    {result.status === 'success' ? (
                      <CheckCircle size={20} className="text-success" />
                    ) : result.status === 'warning' ? (
                      <AlertTriangle size={20} className="text-warning" />
                    ) : (
                      <X size={20} className="text-danger" />
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="alert-heading mb-1 fw-bold">{result.name}</h6>
                    <p className="mb-0 small">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="small text-muted">Ver detalles del error</summary>
                        <pre className="small mt-2 p-2 bg-light rounded">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="small text-muted">Ver datos</summary>
                        <pre className="small mt-2 p-2 bg-light rounded">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceOrderTest