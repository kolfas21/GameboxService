-- ============================================
-- FIX: GRANTS DE PERMISOS PARA ROLES
-- ============================================
-- PROBLEMA: El rol 'authenticated' no tiene permisos de tabla 
-- (GRANT) sobre las tablas públicas, aunque las políticas RLS 
-- estén correctas. Sin GRANT, PostgreSQL devuelve:
--   "permission denied for table users" (error 42501)
-- 
-- SOLUCIÓN: Ejecutar este script en Supabase SQL Editor
-- ============================================

-- Permisos de esquema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Permisos de tabla para usuario autenticado
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_workshops TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_repairs TO authenticated;

-- Permisos de tabla para usuario anónimo (solo lectura donde corresponda)
GRANT SELECT ON public.company_settings TO anon;

-- Permisos de secuencias (para gen_random_uuid y columnas auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Permisos para funciones helper
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- Verificar que RLS está habilitado en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_repairs ENABLE ROW LEVEL SECURITY;

-- Verificar políticas activas después de ejecutar
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
