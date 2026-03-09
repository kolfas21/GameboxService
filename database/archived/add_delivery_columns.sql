-- Agregar columnas para el sistema de entregas
-- Este script agrega las columnas necesarias para registrar las entregas

-- Agregar columna de notas de entrega
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Agregar columna de fecha/hora de entrega
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN service_orders.delivery_notes IS 'Notas opcionales al momento de la entrega del dispositivo al cliente';
COMMENT ON COLUMN service_orders.delivered_at IS 'Fecha y hora cuando se entregó el dispositivo al cliente';

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
AND column_name IN ('delivery_notes', 'delivered_at')
ORDER BY column_name;