-- ============================================
-- GAMEBOX SERVICE - POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================
-- Descripción: Configuración completa de Row Level Security
-- Versión: 3.0 (Consolidado)
-- Fecha: 2026-02-17
-- ============================================
-- IMPORTANTE: 
-- - Este script USA la función current_user_role() para EVITAR RECURSIÓN
-- - Ejecutar DESPUÉS de 01_init_database.sql
-- ============================================

-- ============================================
-- PARTE 1: HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_repairs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 2: POLÍTICAS PARA PROFILES
-- ============================================

-- Limpiar políticas existentes
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
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_staff" ON profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;

-- Políticas nuevas (SIN RECURSIÓN - usa current_user_role())
-- Todos los usuarios autenticados pueden ver perfiles (necesario para ver técnico asignado)
CREATE POLICY "profiles_select_authenticated"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
USING (public.current_user_role() = 'admin');

CREATE POLICY "profiles_insert_admin"
ON profiles FOR INSERT
WITH CHECK (public.current_user_role() = 'admin');

-- ============================================
-- PARTE 3: POLÍTICAS PARA CUSTOMERS
-- ============================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver clientes" ON customers;
DROP POLICY IF EXISTS "Recepcionistas y admins pueden crear clientes" ON customers;
DROP POLICY IF EXISTS "Recepcionistas y admins pueden actualizar clientes" ON customers;
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;

-- Políticas nuevas
-- Ver clientes: Todos los usuarios autenticados
CREATE POLICY "customers_select"
ON customers FOR SELECT
USING (auth.role() = 'authenticated');

-- Crear clientes: Admin y Recepcionista
CREATE POLICY "customers_insert"
ON customers FOR INSERT
WITH CHECK (
  public.current_user_role() IN ('admin', 'receptionist')
);

-- Actualizar clientes: SOLO Admin
CREATE POLICY "customers_update"
ON customers FOR UPDATE
USING (
  public.current_user_role() = 'admin'
);

-- Eliminar clientes: SOLO Admin
CREATE POLICY "customers_delete"
ON customers FOR DELETE
USING (
  public.current_user_role() = 'admin'
);

-- ============================================
-- PARTE 4: POLÍTICAS PARA SERVICE_ORDERS
-- ============================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver órdenes relacionadas" ON service_orders;
DROP POLICY IF EXISTS "Recepcionistas y admins pueden crear órdenes" ON service_orders;
DROP POLICY IF EXISTS "Usuarios pueden actualizar órdenes asignadas" ON service_orders;
DROP POLICY IF EXISTS "service_orders_select" ON service_orders;
DROP POLICY IF EXISTS "service_orders_insert" ON service_orders;
DROP POLICY IF EXISTS "service_orders_update" ON service_orders;
DROP POLICY IF EXISTS "service_orders_delete" ON service_orders;

-- Políticas nuevas
-- Ver órdenes: Técnico asignado, quien recibió, admin, recepcionista
CREATE POLICY "service_orders_select"
ON service_orders FOR SELECT
USING (
  auth.uid() = assigned_technician_id OR
  auth.uid() = received_by_id OR
  public.current_user_role() IN ('admin', 'receptionist')
);

-- Crear órdenes: Admin y Recepcionista
CREATE POLICY "service_orders_insert"
ON service_orders FOR INSERT
WITH CHECK (
  public.current_user_role() IN ('admin', 'receptionist')
);

-- Actualizar órdenes: Admin, Recepcionista, Técnico asignado, quien recibió
CREATE POLICY "service_orders_update"
ON service_orders FOR UPDATE
USING (
  public.current_user_role() IN ('admin', 'receptionist')
  OR auth.uid() = assigned_technician_id
  OR auth.uid() = received_by_id
);

-- Eliminar órdenes: SOLO Admin
CREATE POLICY "service_orders_delete"
ON service_orders FOR DELETE
USING (
  public.current_user_role() = 'admin'
);

-- ============================================
-- PARTE 5: POLÍTICAS PARA COMPANY_SETTINGS
-- ============================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Todos pueden ver configuración" ON company_settings;
DROP POLICY IF EXISTS "Solo admins pueden modificar configuración" ON company_settings;
DROP POLICY IF EXISTS "company_settings_select" ON company_settings;
DROP POLICY IF EXISTS "company_settings_update" ON company_settings;
DROP POLICY IF EXISTS "company_settings_insert" ON company_settings;
DROP POLICY IF EXISTS "company_settings_delete" ON company_settings;

-- Políticas nuevas
-- Ver configuración: Público (para logo, nombre, etc.)
CREATE POLICY "company_settings_select"
ON company_settings FOR SELECT
USING (true);

-- Modificar configuración: SOLO Admin
CREATE POLICY "company_settings_update"
ON company_settings FOR UPDATE
USING (public.current_user_role() = 'admin');

CREATE POLICY "company_settings_insert"
ON company_settings FOR INSERT
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "company_settings_delete"
ON company_settings FOR DELETE
USING (public.current_user_role() = 'admin');

-- ============================================
-- PARTE 6: POLÍTICAS PARA EXTERNAL_WORKSHOPS
-- ============================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver talleres" ON external_workshops;
DROP POLICY IF EXISTS "Solo admins pueden crear talleres" ON external_workshops;
DROP POLICY IF EXISTS "Solo admins pueden actualizar talleres" ON external_workshops;
DROP POLICY IF EXISTS "Solo admins pueden eliminar talleres" ON external_workshops;
DROP POLICY IF EXISTS "external_workshops_select" ON external_workshops;
DROP POLICY IF EXISTS "external_workshops_insert" ON external_workshops;
DROP POLICY IF EXISTS "external_workshops_update" ON external_workshops;
DROP POLICY IF EXISTS "external_workshops_delete" ON external_workshops;

-- Políticas nuevas
-- Ver talleres: Todos los usuarios autenticados
CREATE POLICY "external_workshops_select"
ON external_workshops FOR SELECT
USING (auth.role() = 'authenticated');

-- Crear talleres: SOLO Admin
CREATE POLICY "external_workshops_insert"
ON external_workshops FOR INSERT
WITH CHECK (public.current_user_role() = 'admin');

-- Actualizar talleres: SOLO Admin
CREATE POLICY "external_workshops_update"
ON external_workshops FOR UPDATE
USING (public.current_user_role() = 'admin');

-- Eliminar talleres: SOLO Admin
CREATE POLICY "external_workshops_delete"
ON external_workshops FOR DELETE
USING (public.current_user_role() = 'admin');

-- ============================================
-- PARTE 7: POLÍTICAS PARA EXTERNAL_REPAIRS
-- ============================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver reparaciones externas" ON external_repairs;
DROP POLICY IF EXISTS "Admins y recepcionistas pueden crear reparaciones externas" ON external_repairs;
DROP POLICY IF EXISTS "Admins y recepcionistas pueden actualizar reparaciones externas" ON external_repairs;
DROP POLICY IF EXISTS "Solo admins pueden eliminar reparaciones externas" ON external_repairs;
DROP POLICY IF EXISTS "external_repairs_select" ON external_repairs;
DROP POLICY IF EXISTS "external_repairs_insert" ON external_repairs;
DROP POLICY IF EXISTS "external_repairs_update" ON external_repairs;
DROP POLICY IF EXISTS "external_repairs_delete" ON external_repairs;

-- Políticas nuevas
-- Ver reparaciones externas: Todos los usuarios autenticados
CREATE POLICY "external_repairs_select"
ON external_repairs FOR SELECT
USING (auth.role() = 'authenticated');

-- Crear reparaciones externas: Admin y Recepcionista
CREATE POLICY "external_repairs_insert"
ON external_repairs FOR INSERT
WITH CHECK (
  public.current_user_role() IN ('admin', 'receptionist')
);

-- Actualizar reparaciones externas: Admin y Recepcionista
CREATE POLICY "external_repairs_update"
ON external_repairs FOR UPDATE
USING (
  public.current_user_role() IN ('admin', 'receptionist')
);

-- Eliminar reparaciones externas: SOLO Admin
CREATE POLICY "external_repairs_delete"
ON external_repairs FOR DELETE
USING (
  public.current_user_role() = 'admin'
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar políticas de profiles
SELECT 
  'profiles' as tabla,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Verificar políticas de customers
SELECT 
  'customers' as tabla,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'customers'
ORDER BY cmd, policyname;

-- Verificar políticas de service_orders
SELECT 
  'service_orders' as tabla,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'service_orders'
ORDER BY cmd, policyname;

-- Verificar políticas de company_settings
SELECT 
  'company_settings' as tabla,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'company_settings'
ORDER BY cmd, policyname;

-- Verificar políticas de external_workshops
SELECT 
  'external_workshops' as tabla,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'external_workshops'
ORDER BY cmd, policyname;

-- Verificar políticas de external_repairs
SELECT 
  'external_repairs' as tabla,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'external_repairs'
ORDER BY cmd, policyname;

-- ============================================
-- RESUMEN DE POLÍTICAS
-- ============================================
-- ✅ profiles: 4 políticas (SELECT authenticated, UPDATE own/admin, INSERT admin)
-- ✅ customers: 4 políticas (SELECT all, INSERT admin/recep, UPDATE/DELETE admin)
-- ✅ service_orders: 4 políticas (SELECT filtered, INSERT admin/recep, UPDATE filtered, DELETE admin)
-- ✅ company_settings: 4 políticas (SELECT public, INSERT/UPDATE/DELETE admin)
-- ✅ external_workshops: 4 políticas (SELECT all, INSERT/UPDATE/DELETE admin)
-- ✅ external_repairs: 4 políticas (SELECT all, INSERT/UPDATE admin/recep, DELETE admin)
-- ============================================
-- TOTAL: 24 políticas configuradas
-- ============================================

SELECT '✅ Políticas de seguridad (RLS) configuradas exitosamente!' as status,
       'Ahora ejecuta: 03_setup_storage.sql' as next_step;
