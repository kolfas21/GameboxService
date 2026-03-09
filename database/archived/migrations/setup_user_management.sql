-- Script para habilitar acceso a usuarios de auth desde la aplicación
-- Ejecutar en SQL Editor de Supabase

-- ================================================
-- FUNCIÓN PARA OBTENER TODOS LOS USUARIOS
-- ================================================

-- Esta función permite a los administradores ver todos los usuarios
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo permitir a administradores
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo los administradores pueden ver todos los usuarios';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.updated_at,
    u.raw_user_meta_data
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND u.email NOT LIKE '%supabase%'
  ORDER BY u.created_at DESC;
END;
$$;

-- ================================================
-- TRIGGER PARA CREAR PERFILES AUTOMÁTICAMENTE
-- ================================================

-- Función que se ejecuta cuando se crea un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    'receptionist'::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- POLÍTICAS DE SEGURIDAD
-- ================================================

-- Permitir a administradores ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- Permitir a administradores actualizar roles
DROP POLICY IF EXISTS "Admins can update roles" ON public.profiles;
CREATE POLICY "Admins can update roles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- ================================================
-- VERIFICACIÓN
-- ================================================

-- Ver todos los usuarios (solo si eres admin)
-- SELECT * FROM get_all_users();

-- Ver todos los perfiles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;