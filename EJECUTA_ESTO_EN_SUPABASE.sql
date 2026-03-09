-- =============================================
-- 🔍 QUERY DE DEBUG CRÍTICO
-- Ejecuta esto en Supabase SQL Editor
-- =============================================

-- ✅ QUERY #1: Ver órdenes completadas (esta es la CLAVE)
-- Esto confirmará si completed_by_id es NULL
SELECT 
  so.order_number,
  so.status,
  so.assigned_technician_id,
  so.completed_by_id,        -- ⚠️ Si esto es NULL, ahí está el problema
  at.full_name as assigned_tech,
  cb.full_name as completed_by,
  so.updated_at
FROM service_orders so
LEFT JOIN profiles at ON so.assigned_technician_id = at.id
LEFT JOIN profiles cb ON so.completed_by_id = cb.id
WHERE so.status = 'completed'
ORDER BY so.updated_at DESC;

-- Resultado Esperado:
-- Si ves NULL en completed_by_id → Ese es el problema ❌
-- Si ves un UUID en completed_by_id → El problema está en otro lado ✅


-- =============================================
-- 📊 QUERY #2: Contar usando completed_by_id
-- =============================================
SELECT 
  p.full_name,
  COUNT(so.id) as completadas_con_completed_by_id
FROM profiles p
LEFT JOIN service_orders so 
  ON so.completed_by_id = p.id 
  AND so.status = 'completed'
WHERE p.role = 'technician'
GROUP BY p.full_name
ORDER BY completadas_con_completed_by_id DESC;

-- Si Daniel muestra 0 aquí → completed_by_id es NULL ❌


-- =============================================
-- 📊 QUERY #3: Contar usando assigned_technician_id (FALLBACK)
-- =============================================
SELECT 
  p.full_name,
  COUNT(so.id) as completadas_con_assigned
FROM profiles p
LEFT JOIN service_orders so 
  ON so.assigned_technician_id = p.id 
  AND so.status = 'completed'
WHERE p.role = 'technician'
GROUP BY p.full_name
ORDER BY completadas_con_assigned DESC;

-- Si Daniel muestra 7 aquí → El fallback funciona ✅


-- =============================================
-- 🔧 QUERY #4: Script de Corrección (OPCIONAL)
-- Solo ejecuta si quieres actualizar la BD
-- =============================================
/*
UPDATE service_orders
SET completed_by_id = assigned_technician_id
WHERE status = 'completed' 
  AND completed_by_id IS NULL
  AND assigned_technician_id IS NOT NULL;

-- Verificar cuántas se actualizaron
SELECT COUNT(*) as actualizadas
FROM service_orders
WHERE status = 'completed' 
  AND completed_by_id IS NOT NULL;
*/
