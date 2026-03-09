-- ============================================
-- ARREGLAR POLÍTICA DE RECURSIÓN INFINITA
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. ELIMINAR POLÍTICA PROBLEMÁTICA
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;

-- 2. CREAR POLÍTICAS CORREGIDAS (sin recursión)
-- Permitir que los usuarios vean todos los perfiles si son admin
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.email = 'admin@gameboxservice.com'
    )
  );

-- Permitir que los admins creen perfiles
CREATE POLICY "Admins can create profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.email = 'admin@gameboxservice.com'
    )
  );

-- 3. POLÍTICA ALTERNATIVA MÁS SIMPLE (si la de arriba no funciona)
-- Descomenta estas líneas si sigues teniendo problemas:

-- DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
-- DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;

-- CREATE POLICY "Allow admin email to view all profiles" ON profiles
--   FOR SELECT USING (
--     auth.email() = 'admin@gameboxservice.com'
--   );

-- CREATE POLICY "Allow admin email to create profiles" ON profiles
--   FOR INSERT WITH CHECK (
--     auth.email() = 'admin@gameboxservice.com'
--   );

-- ============================================
-- VERIFICAR QUE FUNCIONA
-- ============================================
-- Ejecutar para probar:
SELECT * FROM profiles LIMIT 5;