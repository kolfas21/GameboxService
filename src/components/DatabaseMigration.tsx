import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database, AlertTriangle, Play } from 'lucide-react'

const DatabaseMigration: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Solo mostrar para administradores
  if (!user || user.role !== 'admin') {
    return null
  }

  const runMigration = async () => {
    setIsRunning(true)
    setResults([])
    setError(null)

    try {
      // Verificar si las columnas ya existen
      const { error: checkError } = await supabase.rpc('check_columns_exist', {
        table_name: 'service_orders',
        column_names: ['delivery_notes', 'delivered_at']
      })

      if (checkError) {
        // Si la función no existe, intentamos crear las columnas directamente
        setResults(prev => [...prev, '🔍 Verificando estructura de la tabla...'])
        
        // Agregar columna delivery_notes
        try {
          const { error: error1 } = await supabase.rpc('add_column_if_not_exists', {
            table_name: 'service_orders',
            column_name: 'delivery_notes',
            column_type: 'TEXT'
          })
          
          if (error1) {
            setResults(prev => [...prev, '⚠️ No se pudo agregar delivery_notes automáticamente'])
          } else {
            setResults(prev => [...prev, '✅ Columna delivery_notes agregada'])
          }
        } catch (err) {
          setResults(prev => [...prev, '⚠️ Error agregando delivery_notes: Necesita hacerse manualmente en Supabase'])
        }

        // Agregar columna delivered_at
        try {
          const { error: error2 } = await supabase.rpc('add_column_if_not_exists', {
            table_name: 'service_orders',
            column_name: 'delivered_at',
            column_type: 'TIMESTAMPTZ'
          })
          
          if (error2) {
            setResults(prev => [...prev, '⚠️ No se pudo agregar delivered_at automáticamente'])
          } else {
            setResults(prev => [...prev, '✅ Columna delivered_at agregada'])
          }
        } catch (err) {
          setResults(prev => [...prev, '⚠️ Error agregando delivered_at: Necesita hacerse manualmente en Supabase'])
        }
      } else {
        setResults(prev => [...prev, '✅ Verificación completada, columnas ya existen'])
      }

      setResults(prev => [...prev, '🎉 Proceso completado'])
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      setResults(prev => [...prev, `❌ Error: ${errorMsg}`])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-transparent border-0 py-3">
        <div className="d-flex align-items-center">
          <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-2">
            <Database size={18} className="text-warning" />
          </div>
          <h5 className="mb-0 fw-semibold">Migración de Base de Datos</h5>
        </div>
      </div>
      
      <div className="card-body">
        <div className="alert alert-info d-flex align-items-start">
          <AlertTriangle size={16} className="me-2 mt-1" />
          <div>
            <h6 className="alert-heading">Actualización Requerida</h6>
            <p className="mb-2">
              Para usar el sistema de entregas, necesitamos agregar las columnas <code>delivery_notes</code> y <code>delivered_at</code> 
              a la tabla <code>service_orders</code>.
            </p>
            <p className="mb-0 small">
              <strong>Alternativa manual:</strong> Ejecuta este SQL en el panel de Supabase:
            </p>
          </div>
        </div>

        <div className="bg-light p-3 rounded mb-3">
          <pre className="mb-0 small">
{`-- Agregar columnas para entregas
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;`}
          </pre>
        </div>

        <div className="d-flex gap-2 mb-3">
          <button 
            className="btn btn-warning"
            onClick={runMigration}
            disabled={isRunning}
          >
            {isRunning ? (
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            ) : (
              <Play size={16} className="me-2" />
            )}
            {isRunning ? 'Ejecutando...' : 'Ejecutar Migración'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="border rounded p-3 bg-light">
            <h6 className="mb-2">Resultados:</h6>
            {results.map((result, index) => (
              <div key={index} className="small mb-1">
                {result}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert-danger mt-3">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default DatabaseMigration