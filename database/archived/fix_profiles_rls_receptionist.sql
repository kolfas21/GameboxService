-- ============================================
-- FIX 1: Permitir que recepcionistas y técnicos vean perfiles
-- ============================================
-- PROBLEMA: La política RLS de 'profiles' solo permite ver el perfil propio
-- o al admin. Esto hace que el campo assigned_technician devuelva null
-- para recepcionistas y técnicos, impidiendo ver qué técnico tiene cada reparación.
-- ============================================

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_staff" ON profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;

-- Nueva política: todos los usuarios autenticados pueden ver todos los perfiles
CREATE POLICY "profiles_select_authenticated"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- ============================================
-- FIX 2: Cancelar tercerización de órdenes que NO están en_progreso
-- ============================================
-- PROBLEMA: Si una orden fue tercerizada y luego devuelta a pendientes
-- (o completada/entregada por el técnico), el registro de tercerización
-- sigue apareciendo como activo en la UI.
-- ============================================

-- Primero ampliar el CHECK CONSTRAINT para admitir el valor 'cancelled'
ALTER TABLE external_repairs
  DROP CONSTRAINT IF EXISTS external_repairs_external_status_check;

ALTER TABLE external_repairs
  ADD CONSTRAINT external_repairs_external_status_check
  CHECK (external_status IN ('sent', 'in_process', 'ready', 'returned', 'cancelled'));

-- Ahora sí, cancelar registros activos de órdenes que ya no están en progreso
UPDATE external_repairs
SET external_status = 'cancelled'
WHERE external_status NOT IN ('returned', 'cancelled')
  AND service_order_id IN (
    SELECT id FROM service_orders
    WHERE status IN ('pending', 'completed', 'delivered')
  );

-- También limpiar assigned_technician_id de órdenes pendientes que no deberían tenerlo
-- (órdenes que fueron devueltas a pendientes manualmente)
UPDATE service_orders
SET assigned_technician_id = NULL
WHERE status = 'pending'
  AND assigned_technician_id IS NOT NULL;

-- Verificar resultados
SELECT 
  so.order_number,
  so.status,
  er.external_status,
  ew.name as workshop_name
FROM service_orders so
JOIN external_repairs er ON er.service_order_id = so.id
JOIN external_workshops ew ON ew.id = er.workshop_id
WHERE so.status != 'in_progress'
  AND er.external_status NOT IN ('returned', 'cancelled')
ORDER BY so.created_at DESC;

SELECT '✅ Fixes aplicados exitosamente' as resultado;
