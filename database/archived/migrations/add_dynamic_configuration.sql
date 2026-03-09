-- ============================================
-- Migración: Sistema de Configuración Dinámica
-- Descripción: Agrega columnas JSONB para control de funcionalidades y campos obligatorios
-- Fecha: 2026-02-16
-- ============================================

-- Agregar columnas JSONB a company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{
  "outsourcing": true,
  "warranty_tracking": true,
  "technician_stats": true
}'::jsonb;

ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS required_fields JSONB DEFAULT '{
  "device_brand": true,
  "device_model": true,
  "serial_number": false,
  "observations": false,
  "estimated_completion": false
}'::jsonb;

-- Comentarios para documentación
COMMENT ON COLUMN company_settings.features_enabled IS 'Control de funcionalidades habilitadas en el sistema (outsourcing, warranty_tracking, technician_stats)';
COMMENT ON COLUMN company_settings.required_fields IS 'Configuración de campos obligatorios en órdenes de servicio (device_brand, device_model, serial_number, observations, estimated_completion)';

-- Actualizar registros existentes con valores por defecto
UPDATE company_settings 
SET 
  features_enabled = '{
    "outsourcing": true,
    "warranty_tracking": true,
    "technician_stats": true
  }'::jsonb,
  required_fields = '{
    "device_brand": true,
    "device_model": true,
    "serial_number": false,
    "observations": false,
    "estimated_completion": false
  }'::jsonb
WHERE features_enabled IS NULL OR required_fields IS NULL;

-- ============================================
-- ROLLBACK (Si necesitas revertir los cambios)
-- ============================================
/*
ALTER TABLE company_settings DROP COLUMN IF EXISTS features_enabled;
ALTER TABLE company_settings DROP COLUMN IF EXISTS required_fields;
*/
