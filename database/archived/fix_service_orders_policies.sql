-- ============================================
-- FIX: Agregar políticas de DELETE y UPDATE para service_orders y customers
-- ============================================
-- Problema: Los admins no pueden borrar/editar órdenes ni clientes
-- Causa: Falta política de DELETE y las políticas usan recursión
-- Solución: Crear políticas usando current_user_role()
-- ============================================

-- PASO 1: Eliminar políticas problemáticas de service_orders
DROP POLICY IF EXISTS "Usuarios pueden actualizar órdenes asignadas" ON service_orders;
DROP POLICY IF EXISTS "service_orders_update_policy" ON service_orders;
DROP POLICY IF EXISTS "service_orders_delete_policy" ON service_orders;
DROP POLICY IF EXISTS "Admins pueden eliminar órdenes" ON service_orders;

-- PASO 2: Crear política de UPDATE para service_orders (sin recursión)
-- Los admins, recepcionistas, técnicos asignados y quien recibió pueden actualizar
CREATE POLICY "service_orders_update"
ON service_orders FOR UPDATE
USING (
  -- Si eres admin o recepcionista
  public.current_user_role() IN ('admin', 'receptionist')
  OR
  -- O eres el técnico asignado
  auth.uid() = assigned_technician_id
  OR
  -- O eres quien recibió la orden
  auth.uid() = received_by_id
);

-- PASO 3: Crear política de DELETE para service_orders (SOLO ADMINS)
CREATE POLICY "service_orders_delete"
ON service_orders FOR DELETE
USING (
  public.current_user_role() = 'admin'
);

-- ============================================
-- FIX PARA CUSTOMERS TAMBIÉN
-- ============================================

-- PASO 4: Eliminar políticas problemáticas de customers
DROP POLICY IF EXISTS "Recepcionistas y admins pueden actualizar clientes" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- PASO 5: Crear política de UPDATE para customers (SOLO ADMINS)
CREATE POLICY "customers_update"
ON customers FOR UPDATE
USING (
  public.current_user_role() = 'admin'
);

-- PASO 6: Crear política de DELETE para customers (SOLO ADMINS)
CREATE POLICY "customers_delete"
ON customers FOR DELETE
USING (
  public.current_user_role() = 'admin'
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- PASO 7: Verificar políticas de service_orders
SELECT 
  tablename,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'service_orders'
  AND cmd IN ('UPDATE', 'DELETE')
ORDER BY cmd, policyname;

-- PASO 8: Verificar políticas de customers
SELECT 
  tablename,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'customers'
  AND cmd IN ('UPDATE', 'DELETE')
ORDER BY cmd, policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- service_orders: 2 políticas (DELETE, UPDATE)
-- customers: 2 políticas (DELETE, UPDATE)
-- ============================================

SELECT '✅ Todas las políticas de UPDATE/DELETE creadas exitosamente!' as status;
