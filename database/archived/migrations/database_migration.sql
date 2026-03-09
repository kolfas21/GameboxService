-- Migración para agregar campos de serial number y tracking de técnicos
-- Ejecutar en el SQL Editor de Supabase

-- 1. Agregar columna de número de serie
ALTER TABLE service_orders 
ADD COLUMN serial_number TEXT;

-- 2. Agregar columna para observaciones
ALTER TABLE service_orders 
ADD COLUMN observations TEXT;

-- 3. Agregar columna para técnico que completó la orden
ALTER TABLE service_orders 
ADD COLUMN completed_by_id UUID REFERENCES profiles(id);

-- 3. Verificar que las otras columnas existan (si no, agregarlas)
-- assigned_technician_id (debería existir)
-- received_by_id (debería existir)

-- Si no existen, descomenta las siguientes líneas:
-- ALTER TABLE service_orders 
-- ADD COLUMN assigned_technician_id UUID REFERENCES profiles(id);

-- ALTER TABLE service_orders 
-- ADD COLUMN received_by_id UUID REFERENCES profiles(id);

-- 4. Remover la columna priority si existe
ALTER TABLE service_orders 
DROP COLUMN IF EXISTS priority;

-- 5. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_service_orders_completed_by_id ON service_orders(completed_by_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_serial_number ON service_orders(serial_number);

-- 6. Actualizar la política RLS si es necesario (opcional)
-- Las políticas existentes deberían funcionar con las nuevas columnas