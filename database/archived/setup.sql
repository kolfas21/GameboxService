-- Configuración de Base de Datos para GameBox Service
-- Ejecutar estos scripts en Supabase SQL Editor

-- 1. Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'receptionist', 'technician')) NOT NULL DEFAULT 'technician',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de órdenes de servicio
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  device_type TEXT NOT NULL,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')) NOT NULL DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'medium',
  assigned_technician_id UUID REFERENCES profiles(id),
  completed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  received_by_id UUID REFERENCES profiles(id) NOT NULL,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de configuración de empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'GameBox Service',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#64748B',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'technician');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de seguridad para profiles
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Administradores pueden ver todos los perfiles" ON profiles;
CREATE POLICY "Administradores pueden ver todos los perfiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Políticas de seguridad para customers
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver clientes" ON customers;
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Recepcionistas y admins pueden crear clientes" ON customers;
CREATE POLICY "Recepcionistas y admins pueden crear clientes" ON customers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "Recepcionistas y admins pueden actualizar clientes" ON customers;
CREATE POLICY "Recepcionistas y admins pueden actualizar clientes" ON customers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- 10. Políticas de seguridad para service_orders
DROP POLICY IF EXISTS "Usuarios pueden ver órdenes relacionadas" ON service_orders;
CREATE POLICY "Usuarios pueden ver órdenes relacionadas" ON service_orders
  FOR SELECT USING (
    auth.uid() = assigned_technician_id OR
    auth.uid() = received_by_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "Recepcionistas y admins pueden crear órdenes" ON service_orders;
CREATE POLICY "Recepcionistas y admins pueden crear órdenes" ON service_orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar órdenes asignadas" ON service_orders;
CREATE POLICY "Usuarios pueden actualizar órdenes asignadas" ON service_orders
  FOR UPDATE USING (
    auth.uid() = assigned_technician_id OR
    auth.uid() = received_by_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- 11. Políticas de seguridad para company_settings
DROP POLICY IF EXISTS "Todos pueden ver configuración" ON company_settings;
CREATE POLICY "Todos pueden ver configuración" ON company_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Solo admins pueden modificar configuración" ON company_settings;
CREATE POLICY "Solo admins pueden modificar configuración" ON company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 12. Insertar configuración inicial
INSERT INTO company_settings (company_name) 
VALUES ('GameBox Service') 
ON CONFLICT DO NOTHING;

-- 13. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_customers_cedula ON customers(cedula);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_assigned_technician ON service_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at DESC);

-- 14. Funciones para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Triggers para actualizar timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
CREATE TRIGGER update_service_orders_updated_at
    BEFORE UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Mensaje de finalización
SELECT 'Base de datos configurada correctamente para GameBox Service' as message;
