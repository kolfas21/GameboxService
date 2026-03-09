-- ============================================
-- MIGRATION: Sistema de cobro y resultado de reparación
-- ============================================
-- Agrega campos para registrar:
-- 1. Si la consola fue reparada o no (por el técnico al completar)
-- 2. Cuánto se cobró al cliente y con qué método (al entregar)
-- ============================================

-- Resultado de la reparación (lo pone el técnico al marcar como completada)
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS repair_result TEXT CHECK (repair_result IN ('repaired', 'not_repaired'));

-- Costo cobrado al cliente (lo pone el admin/recepcionista al entregar)
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(10, 2);

-- Método de pago
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'otro'));

-- Quién registró el cobro
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS payment_collected_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Verificar que los campos se crearon
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_orders'
  AND column_name IN ('repair_result', 'repair_cost', 'payment_method', 'payment_collected_by_id')
ORDER BY column_name;

SELECT '✅ Campos de cobro agregados exitosamente' as resultado;
