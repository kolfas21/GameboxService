-- ============================================
-- GAMEBOX SERVICE - ELIMINAR POLÍTICAS OBSOLETAS
-- ============================================
-- PROBLEMA RAÍZ: "permission denied for table users" (código 42501)
--
-- CAUSA: Scripts antiguos (fix_policies.sql, fix_admin.sql) crearon políticas
-- que consultan auth.users DIRECTAMENTE. El rol 'authenticated' no tiene
-- acceso a auth.users, por lo que PostgreSQL falla al evaluar esas políticas.
--
-- Las políticas problemáticas son:
--   "Admins can view all profiles"   → USING ( auth.uid() IN (SELECT id FROM auth.users ...) )
--   "Admins can create profiles"     → WITH CHECK ( auth.uid() IN (SELECT id FROM auth.users ...) )
--
-- INSTRUCCIONES: Ejecutar en Supabase → SQL Editor → Run
-- ============================================

-- ============================================
-- PASO 1: ELIMINAR POLÍTICAS OBSOLETAS QUE CAUSAN EL ERROR
-- ============================================

-- Políticas de fix_policies.sql que usan auth.users directamente
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;

-- Políticas de fix_admin.sql (por si fueron aplicadas)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Políticas de scripts anteriores con nombres en inglés o distintos
DROP POLICY IF EXISTS "Allow admin email to view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin email to create profiles" ON profiles;
DROP POLICY IF EXISTS "Admin full access" ON profiles;

-- ============================================
-- PASO 2: VERIFICAR QUÉ POLÍTICAS QUEDAN EN PROFILES
-- ============================================
-- Deben existir SOLO estas 4 (las de 02_init_policies.sql):
--   profiles_select_authenticated  → SELECT (auth.role() = 'authenticated')
--   profiles_update_own            → UPDATE (auth.uid() = id)
--   profiles_update_admin          → UPDATE (current_user_role() = 'admin')
--   profiles_insert_admin          → INSERT (current_user_role() = 'admin')

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- PASO 3: VERIFICAR QUE NO HAY OTRAS POLÍTICAS PELIGROSAS
-- ============================================
-- Buscar cualquier política que todavía mencione auth.users en su expresión
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%auth.users%' OR with_check LIKE '%auth.users%')
ORDER BY tablename;

-- Si la consulta anterior devuelve filas, debes ejecutar:
-- DROP POLICY IF EXISTS "<nombre_exacto>" ON <tabla>;
-- para cada política que aparezca.

SELECT '✅ Políticas obsoletas eliminadas. Recarga la app y el error 403 debe desaparecer.' as resultado;
