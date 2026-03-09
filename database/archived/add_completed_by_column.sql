-- Agregar columna completed_by_id a la tabla service_orders
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS completed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_service_orders_completed_by_id ON service_orders(completed_by_id);

-- Actualizar las órdenes completadas existentes para asignar el técnico que las completó
-- (Si el técnico asignado completó la orden, asumir que fue el mismo técnico)
UPDATE service_orders 
SET completed_by_id = assigned_technician_id 
WHERE status = 'completed' 
  AND assigned_technician_id IS NOT NULL 
  AND completed_by_id IS NULL;

-- Comentario informativo
-- Esta migración agrega el campo completed_by_id para rastrear qué técnico 
-- completó específicamente cada orden de reparación.