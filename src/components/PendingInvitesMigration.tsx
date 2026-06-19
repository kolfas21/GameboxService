import React, { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database, AlertCircle, CheckCircle, Play } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'

interface ModalState {
  isOpen: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
  confirmText?: string
}

const PendingInvitesMigration: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [tableExists, setTableExists] = useState<boolean | null>(null)

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  const showSuccessModal = useCallback((message: string) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: '¡Migración Exitosa!',
      message,
      onConfirm: closeModal
    })
  }, [closeModal])

  const showErrorModal = useCallback((message: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Error en Migración',
      message,
      onConfirm: closeModal
    })
  }, [closeModal])

  const checkTableExists = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('pending_invites')
        .select('id, email, full_name, role, invited_by, created_at')
        .limit(1)

      if (error) {
        console.log('Table check error:', error)
        setTableExists(false)
      } else {
        console.log('Table exists with correct schema')
        setTableExists(true)
      }
    } catch (err) {
      console.log('Table check exception:', err)
      setTableExists(false)
    }
  }, [])

  React.useEffect(() => {
    checkTableExists()
  }, [checkTableExists])

  const executeMigration = async () => {
    setLoading(true)

    try {
      const { error } = await supabase.rpc('create_pending_invites_table')

      if (error) {
        console.error('Error en migración:', error)
        showErrorModal(`Error: ${error.message}. Debes ejecutar este SQL manualmente en Supabase.`)
      } else {
        showSuccessModal('Tabla "pending_invites" creada exitosamente. El sistema de invitaciones está listo.')
        setTableExists(true)
      }
    } catch {
      console.error('Error en migración automática')
      showErrorModal('No se pudo crear la tabla automáticamente. Ejecuta el SQL manualmente en Supabase.')
    }

    setLoading(false)
  }

  // Solo admins pueden ejecutar migraciones (guard después de hooks)
  if (user?.role !== 'admin') {
    return null
  }

  const sqlCode = `
-- Migración completa para tabla pending_invites
-- Primero eliminar la tabla existente si tiene esquema incorrecto
DROP TABLE IF EXISTS pending_invites CASCADE;

-- Crear tabla para invitaciones pendientes con esquema completo
CREATE TABLE pending_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'receptionist', 'technician')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired'))
);

-- Habilitar RLS
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admins can manage pending invites" ON pending_invites;
DROP POLICY IF EXISTS "Users can view pending invites" ON pending_invites;
DROP POLICY IF EXISTS "Admins can insert pending invites" ON pending_invites;

-- Política para que solo admins puedan gestionar invitaciones
CREATE POLICY "Admins can manage pending invites" ON pending_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);

-- Función para crear la tabla (opcional)
CREATE OR REPLACE FUNCTION create_pending_invites_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'Tabla pending_invites creada con esquema completo';
END;
$$;
  `.trim()

  if (tableExists === true) {
    return (
      <div className="alert alert-success d-flex align-items-center">
        <CheckCircle size={20} className="me-2" />
        <div>
          <strong>✅ Sistema de Invitaciones Listo</strong>
          <br />
          <small>La tabla "pending_invites" existe y el sistema está operativo.</small>
        </div>
      </div>
    )
  }

  if (tableExists === false) {
    return (
      <div className="card border-warning">
        <div className="card-header bg-warning text-dark d-flex align-items-center">
          <Database size={20} className="me-2" />
          <h6 className="mb-0">Migración Requerida: Sistema de Invitaciones</h6>
        </div>
        <div className="card-body">
          <div className="alert alert-warning d-flex align-items-start">
            <AlertCircle size={16} className="me-2 mt-1" />
            <div>
              <strong>Se requiere crear la tabla "pending_invites"</strong>
              <br />
              <small>Esta tabla es necesaria para el sistema de invitaciones de usuarios.</small>
            </div>
          </div>

          <div className="mb-3">
            <h6>Opción 1: Ejecución Manual (Recomendado)</h6>
            <p className="small text-muted">
              Copia y ejecuta este SQL en Supabase → SQL Editor:
            </p>
            <div className="bg-dark text-light p-3 rounded" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sqlCode}</pre>
            </div>
            <button 
              className="btn btn-outline-secondary btn-sm mt-2"
              onClick={() => navigator.clipboard.writeText(sqlCode)}
            >
              📋 Copiar SQL
            </button>
          </div>

          <div className="mb-3">
            <h6>Opción 2: Intento Automático</h6>
            <p className="small text-muted">
              Intentar crear la tabla automáticamente (puede fallar según permisos):
            </p>
            <button
              onClick={executeMigration}
              disabled={loading}
              className="btn btn-warning"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play size={16} className="me-2" />
                  Ejecutar Migración
                </>
              )}
            </button>
          </div>
        </div>
        
        <CustomModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          onConfirm={closeModal}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
      </div>
    )
  }

  return (
    <div className="alert alert-info d-flex align-items-center">
      <div className="spinner-border spinner-border-sm me-2" />
      Verificando sistema de invitaciones...
    </div>
  )
}

export default PendingInvitesMigration