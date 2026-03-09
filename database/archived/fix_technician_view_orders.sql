-- ============================================
-- FIX COMPLETO: Políticas para Técnicos
-- ============================================
-- Problema 1: Técnicos no pueden ver órdenes pendientes
-- Problema 2: Técnicos no pueden tomar órdenes pendientes (UPDATE)
-- Problema 3: Técnicos no pueden completar órdenes asignadas
-- Solución: Actualizar políticas SELECT y UPDATE
-- Fecha: 2026-02-18
-- ============================================

-- PASO 1: Verificar que existe la función current_user_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'current_user_role'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.current_user_role()
      RETURNS TEXT AS $func$
        SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
      $func$ LANGUAGE SQL SECURITY DEFINER STABLE;
    ';
    RAISE NOTICE '✅ Función current_user_role() creada';
  ELSE
    RAISE NOTICE '✅ Función current_user_role() ya existe';
  END IF;
END $$;

-- PASO 2: Eliminar políticas antiguas
DROP POLICY IF EXISTS "service_orders_select" ON service_orders;
DROP POLICY IF EXISTS "service_orders_update" ON service_orders;

-- PASO 3: Crear política SELECT corregida
-- Ver órdenes:
-- - Admin y recepcionista: VEN TODAS (incluido outsourced para control)
-- - Técnico: SOLO ve PENDIENTES y ASIGNADAS A ÉL (NO ve outsourced ni de otros técnicos)
CREATE POLICY "service_orders_select"
ON service_orders FOR SELECT
USING (
  -- Admin y recepcionista ven TODAS (incluido outsourced)
  public.current_user_role() IN ('admin', 'receptionist')
  -- Técnico ve SOLO:
  OR (
    public.current_user_role() = 'technician' 
    AND status != 'outsourced'  -- NO ve órdenes de taller externo
    AND (
      -- 1. Órdenes pendientes (para tomarlas)
      status = 'pending'
      -- 2. Órdenes asignadas a ÉL (no de otros técnicos)
      OR assigned_technician_id = auth.uid()
    )
  )
);

-- PASO 4: Crear política UPDATE corregida
-- Permite:
-- 1. Admin y recepcionista: actualizar cualquier orden
-- 2. Técnico asignado: actualizar SU orden
-- 3. Quien recibió: actualizar la orden
-- 4. Técnico: TOMAR órdenes pendientes (asignarse a sí mismo)
-- 5. Técnico: COMPLETAR órdenes asignadas a él
CREATE POLICY "service_orders_update"
ON service_orders FOR UPDATE
USING (
  -- Admin y recepcionista pueden actualizar cualquier orden
  public.current_user_role() IN ('admin', 'receptionist')
  -- Técnico asignado puede actualizar su orden
  OR auth.uid() = assigned_technician_id
  -- Quien recibió puede actualizar
  OR auth.uid() = received_by_id
  -- Técnicos pueden TOMAR órdenes pendientes
  OR (
    public.current_user_role() = 'technician' 
    AND status = 'pending'
  )
)
WITH CHECK (
  -- Validaciones al actualizar:
  -- Admin y recepcionista pueden hacer cualquier cambio
  public.current_user_role() IN ('admin', 'receptionist')
  -- Técnico solo puede:
  OR (
    public.current_user_role() = 'technician' 
    AND (
      -- Tomar orden pendiente (asignarse a sí mismo)
      (status = 'in_progress' AND assigned_technician_id = auth.uid())
      -- Completar su orden asignada
      OR (status = 'completed' AND assigned_technician_id = auth.uid())
      -- Mantener su orden asignada en progreso
      OR (status = 'in_progress' AND assigned_technician_id = auth.uid())
    )
  )
  -- Quien recibió puede actualizar
  OR auth.uid() = received_by_id
);

-- PASO 5: Verificar las políticas
SELECT 
  'service_orders' as tabla,
  policyname,
  cmd,
  '✅ Política activa' as status
FROM pg_policies 
WHERE tablename = 'service_orders'
  AND cmd IN ('SELECT', 'UPDATE')
ORDER BY cmd, policyname;

-- PASO 6: Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Deshabilitado'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'service_orders';

SELECT '✅ Políticas actualizadas exitosamente!' as status,
       'Los técnicos ahora pueden: VER, TOMAR y COMPLETAR órdenes' as descripcion;
