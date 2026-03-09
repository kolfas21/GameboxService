-- ============================================
-- VERIFICAR Y CREAR ADMINISTRADOR
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. VERIFICAR USUARIOS ACTUALES
SELECT 
    u.email,
    u.id,
    u.email_confirmed_at IS NOT NULL as email_confirmado,
    u.user_metadata,
    p.full_name,
    p.role,
    p.created_at as perfil_creado
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. VERIFICAR SI EXISTE EL ADMIN ORIGINAL
SELECT * FROM profiles WHERE email = 'admin@gameboxservice.com';

-- 3. CREAR/ACTUALIZAR ADMIN ORIGINAL (si no existe o tiene rol incorrecto)
-- Primero, asegúrate de que el usuario existe en auth.users
-- Ve a Authentication > Users en Supabase y crea admin@gameboxservice.com si no existe

-- Crear o actualizar perfil para admin@gameboxservice.com
INSERT INTO profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    'Administrador Principal', 
    'admin'
FROM auth.users 
WHERE email = 'admin@gameboxservice.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    full_name = 'Administrador Principal';

-- 4. VERIFICAR POLÍTICAS RLS
-- Verificar que las políticas permiten a admin ver perfiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. VERIFICAR PERMISOS ESPECÍFICOS
-- Esta consulta debe devolver el perfil del admin
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE email = 'admin@gameboxservice.com';

-- ============================================
-- SI AÚN HAY PROBLEMAS, EJECUTAR ESTO:
-- ============================================

-- Resetear políticas RLS para profiles (solo si es necesario)
/*
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;

-- Crear políticas básicas que funcionen
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.email() = 'admin@gameboxservice.com' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    auth.email() = 'admin@gameboxservice.com' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
*/

-- ============================================
-- CREDENCIALES PARA TESTING:
-- ============================================
-- Email: admin@gameboxservice.com
-- Password: admin123
-- 
-- Una vez que funcione, puedes crear otros usuarios desde el dashboard
-- ============================================