-- Políticas RLS para GameBox Service
-- Ejecutar estas consultas en el SQL Editor de Supabase

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si existen
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

-- 3. Políticas para la tabla PROFILES
-- Todos los usuarios autenticados pueden leer perfiles
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Usuarios pueden insertar su propio perfil
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');

-- Usuarios pueden actualizar su propio perfil, o administradores pueden actualizar cualquier perfil
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE 
    USING (
        auth.uid() = id OR 
        (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    );

-- Solo administradores pueden eliminar perfiles
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 4. Políticas para la tabla CUSTOMERS
-- Todos los usuarios autenticados pueden leer clientes
CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Administradores y recepcionistas pueden crear clientes
CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'receptionist')
        )
    );

-- Administradores y recepcionistas pueden actualizar clientes
CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'receptionist')
        )
    );

-- Solo administradores pueden eliminar clientes
CREATE POLICY "customers_delete_policy" ON customers
    FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 5. Políticas para la tabla SERVICE_ORDERS
-- Todos los usuarios autenticados pueden leer órdenes de servicio
CREATE POLICY "service_orders_select_policy" ON service_orders
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Administradores y recepcionistas pueden crear órdenes
CREATE POLICY "service_orders_insert_policy" ON service_orders
    FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'receptionist')
        )
    );

-- Administradores, recepcionistas y técnicos pueden actualizar órdenes
CREATE POLICY "service_orders_update_policy" ON service_orders
    FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'receptionist', 'technician')
        )
    );

-- Solo administradores pueden eliminar órdenes
CREATE POLICY "service_orders_delete_policy" ON service_orders
    FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 6. Políticas para la tabla COMPANY_SETTINGS
-- Todos los usuarios autenticados pueden leer configuración
CREATE POLICY "company_settings_select_policy" ON company_settings
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Solo administradores pueden insertar configuración
CREATE POLICY "company_settings_insert_policy" ON company_settings
    FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Solo administradores pueden actualizar configuración
CREATE POLICY "company_settings_update_policy" ON company_settings
    FOR UPDATE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Solo administradores pueden eliminar configuración
CREATE POLICY "company_settings_delete_policy" ON company_settings
    FOR DELETE 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 7. Función para crear perfiles automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario'), 'receptionist');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para ejecutar la función automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Verificar que el usuario admin tiene el rol correcto
UPDATE profiles SET role = 'admin' WHERE email = 'admin@gameboxservice.com';

-- 10. Insertar configuración inicial de la empresa si no existe
INSERT INTO company_settings (company_name)
SELECT 'GameBox Service'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);