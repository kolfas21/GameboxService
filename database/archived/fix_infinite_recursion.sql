-- ============================================
-- FIX DEFINITIVO: Corregir Recursión Infinita
-- ============================================
-- Error: "infinite recursion detected in policy for relation profiles"
-- Solución: Usar función SECURITY DEFINER para romper la recursión
-- ============================================

-- PASO 1: Eliminar TODAS las políticas de profiles (incluyendo las nuevas)
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden crear perfiles" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden actualizar perfiles" ON profiles;
DROP POLICY IF EXISTS "Ver perfil propio" ON profiles;
DROP POLICY IF EXISTS "Admin ve todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Actualizar perfil propio" ON profiles;
DROP POLICY IF EXISTS "Admin actualiza perfiles" ON profiles;
DROP POLICY IF EXISTS "Admin crea perfiles" ON profiles;

-- PASO 2: Crear función helper que NO pasa por RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PASO 3: Crear políticas SIN RECURSIÓN usando la función
-- ============================================

-- Política 1: Ver tu propio perfil
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Política 2: Ver todos los perfiles si eres admin (USA LA FUNCIÓN - NO RECURSIÓN)
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
USING (public.current_user_role() = 'admin');

-- Política 3: Actualizar tu propio perfil
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Política 4: Admin puede actualizar cualquier perfil (USA LA FUNCIÓN)
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
USING (public.current_user_role() = 'admin');

-- Política 5: Admin puede insertar perfiles (USA LA FUNCIÓN)
CREATE POLICY "profiles_insert_admin"
ON profiles FOR INSERT
WITH CHECK (public.current_user_role() = 'admin');

-- PASO 4: Verificar políticas
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

SELECT '✅ Recursión eliminada - Políticas corregidas!' as status;
