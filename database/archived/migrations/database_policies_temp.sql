-- Políticas RLS TEMPORALES para debugging
-- Ejecutar en Supabase SQL Editor para diagnóstico

-- Deshabilitar RLS temporalmente para testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;

-- O si prefieres mantener RLS habilitado pero con políticas muy permisivas:
-- (Comenta las líneas de arriba y descomenta las de abajo)

/*
-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

DROP POLICY IF EXISTS "service_orders_select_policy" ON service_orders;
DROP POLICY IF EXISTS "service_orders_insert_policy" ON service_orders;
DROP POLICY IF EXISTS "service_orders_update_policy" ON service_orders;
DROP POLICY IF EXISTS "service_orders_delete_policy" ON service_orders;

DROP POLICY IF EXISTS "company_settings_select_policy" ON company_settings;
DROP POLICY IF EXISTS "company_settings_insert_policy" ON company_settings;
DROP POLICY IF EXISTS "company_settings_update_policy" ON company_settings;
DROP POLICY IF EXISTS "company_settings_delete_policy" ON company_settings;

-- Crear políticas muy permisivas para testing
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_all_customers" ON customers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_all_service_orders" ON service_orders FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_all_company_settings" ON company_settings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
*/