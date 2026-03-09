-- ============================================
-- MIGRACIÓN COMPLETA - GAMEBOX SERVICE
-- ============================================
-- Descripción: Script completo para desplegar GameBox Service
--              en una nueva instancia de Supabase
-- Versión: 2.0
-- Fecha: 2026-02-16
-- ============================================
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Ve a Storage y crea un bucket llamado "company-assets" (público)
-- 3. Crea tu primer usuario admin desde Authentication
-- 4. Ejecuta el script final de creación de admin al final de este archivo
-- ============================================

-- ============================================
-- PARTE 1: CREAR TABLAS
-- ============================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'receptionist', 'technician')) NOT NULL DEFAULT 'technician',
  sede TEXT DEFAULT 'Parque Caldas',
  branch_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes de servicio
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  device_type TEXT NOT NULL,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  serial_number TEXT,
  problem_description TEXT NOT NULL,
  observations TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered', 'outsourced')) NOT NULL DEFAULT 'pending',
  assigned_technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  received_by_id UUID REFERENCES profiles(id) NOT NULL,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  delivery_notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'GameBox Service',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#64748B',
  -- Información de contacto
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Colombia',
  website TEXT,
  description TEXT,
  -- Redes sociales
  facebook_url TEXT,
  instagram_url TEXT,
  whatsapp_number TEXT,
  -- Información legal
  tax_id TEXT,
  business_hours TEXT,
  -- Configuración dinámica
  features_enabled JSONB DEFAULT '{
    "outsourcing": true,
    "warranty_tracking": true,
    "technician_stats": true
  }'::jsonb,
  required_fields JSONB DEFAULT '{
    "device_brand": true,
    "device_model": true,
    "serial_number": false,
    "problem_description": true,
    "observations": false,
    "estimated_completion": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de talleres externos
CREATE TABLE IF NOT EXISTS external_workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reparaciones externas
CREATE TABLE IF NOT EXISTS external_repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  workshop_id UUID REFERENCES external_workshops(id) NOT NULL,
  -- Información de envío
  sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  sent_by_id UUID REFERENCES profiles(id) NOT NULL,
  -- Información de seguimiento
  external_status TEXT CHECK (external_status IN ('sent', 'in_process', 'ready', 'returned')) DEFAULT 'sent',
  estimated_return_date TIMESTAMP WITH TIME ZONE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  -- Costos
  external_cost DECIMAL(10, 2),
  -- Notas y observaciones
  problem_sent TEXT NOT NULL,
  work_done TEXT,
  notes TEXT,
  -- Quién recibió de vuelta
  received_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTE 2: FUNCIONES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 3: TRIGGERS
-- ============================================

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_orders_updated_at ON service_orders;
CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_workshops_updated_at ON external_workshops;
CREATE TRIGGER update_external_workshops_updated_at
  BEFORE UPDATE ON external_workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_repairs_updated_at ON external_repairs;
CREATE TRIGGER update_external_repairs_updated_at
  BEFORE UPDATE ON external_repairs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 4: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_repairs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 5: POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Políticas para profiles
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Administradores pueden ver todos los perfiles" ON profiles;
CREATE POLICY "Administradores pueden ver todos los perfiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Administradores pueden crear perfiles" ON profiles;
CREATE POLICY "Administradores pueden crear perfiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Administradores pueden actualizar perfiles" ON profiles;
CREATE POLICY "Administradores pueden actualizar perfiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para customers
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

-- Políticas para service_orders
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

-- Políticas para company_settings
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

-- Políticas para external_workshops
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver talleres" ON external_workshops;
CREATE POLICY "Usuarios autenticados pueden ver talleres" ON external_workshops
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admins pueden crear talleres" ON external_workshops;
CREATE POLICY "Solo admins pueden crear talleres" ON external_workshops
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Solo admins pueden actualizar talleres" ON external_workshops;
CREATE POLICY "Solo admins pueden actualizar talleres" ON external_workshops
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Solo admins pueden eliminar talleres" ON external_workshops;
CREATE POLICY "Solo admins pueden eliminar talleres" ON external_workshops
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para external_repairs
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver reparaciones externas" ON external_repairs;
CREATE POLICY "Usuarios autenticados pueden ver reparaciones externas" ON external_repairs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins y recepcionistas pueden crear reparaciones externas" ON external_repairs;
CREATE POLICY "Admins y recepcionistas pueden crear reparaciones externas" ON external_repairs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "Admins y recepcionistas pueden actualizar reparaciones externas" ON external_repairs;
CREATE POLICY "Admins y recepcionistas pueden actualizar reparaciones externas" ON external_repairs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "Solo admins pueden eliminar reparaciones externas" ON external_repairs;
CREATE POLICY "Solo admins pueden eliminar reparaciones externas" ON external_repairs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- PARTE 6: ÍNDICES PARA RENDIMIENTO
-- ============================================

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_cedula ON customers(cedula);

-- Índices para service_orders
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_assigned_technician ON service_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_completed_by_id ON service_orders(completed_by_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_order_number ON service_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_service_orders_serial_number ON service_orders(serial_number);

-- Índices para external_repairs
CREATE INDEX IF NOT EXISTS idx_external_repairs_service_order_id ON external_repairs(service_order_id);
CREATE INDEX IF NOT EXISTS idx_external_repairs_workshop_id ON external_repairs(workshop_id);
CREATE INDEX IF NOT EXISTS idx_external_repairs_external_status ON external_repairs(external_status);

-- ============================================
-- PARTE 7: VISTAS ÚTILES
-- ============================================

-- Vista para ver reparaciones externas con información completa
CREATE OR REPLACE VIEW v_external_repairs_full AS
SELECT 
  er.id,
  er.service_order_id,
  so.order_number,
  so.device_type,
  so.device_brand,
  so.device_model,
  so.serial_number,
  c.full_name as customer_name,
  c.phone as customer_phone,
  ew.name as workshop_name,
  ew.phone as workshop_phone,
  ew.contact_person,
  er.sent_date,
  er.estimated_return_date,
  er.actual_return_date,
  er.external_status,
  er.external_cost,
  er.problem_sent,
  er.work_done,
  er.notes,
  sent_by.full_name as sent_by_name,
  received_by.full_name as received_by_name,
  er.created_at,
  er.updated_at
FROM external_repairs er
INNER JOIN service_orders so ON er.service_order_id = so.id
INNER JOIN customers c ON so.customer_id = c.id
INNER JOIN external_workshops ew ON er.workshop_id = ew.id
LEFT JOIN profiles sent_by ON er.sent_by_id = sent_by.id
LEFT JOIN profiles received_by ON er.received_by_id = received_by.id;

-- ============================================
-- PARTE 8: DATOS INICIALES
-- ============================================

-- Insertar configuración inicial de la empresa
INSERT INTO company_settings (
  company_name,
  phone,
  email,
  address,
  city,
  country,
  description,
  business_hours,
  features_enabled,
  required_fields
) VALUES (
  'GameBox Service',
  '+57 311 663 8302',
  'contacto@gameboxservice.com',
  'Parque Caldas',
  'Manizales',
  'Colombia',
  'Centro de reparación de consolas y controles',
  'Lun-Vie: 9AM-6PM, Sáb: 9AM-1PM',
  '{
    "outsourcing": true,
    "warranty_tracking": true,
    "technician_stats": true
  }'::jsonb,
  '{
    "device_brand": true,
    "device_model": true,
    "serial_number": false,
    "problem_description": true,
    "observations": false,
    "estimated_completion": false
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE profiles IS 'Perfiles de usuarios del sistema vinculados a auth.users';
COMMENT ON TABLE customers IS 'Clientes del taller de reparación';
COMMENT ON TABLE service_orders IS 'Órdenes de servicio/reparación';
COMMENT ON TABLE company_settings IS 'Configuración personalizable de la empresa';
COMMENT ON TABLE external_workshops IS 'Talleres externos para tercerización';
COMMENT ON TABLE external_repairs IS 'Seguimiento de reparaciones tercerizadas';

COMMENT ON COLUMN profiles.sede IS 'Nombre de la sede/sucursal del usuario (ejemplo: Parque Caldas)';
COMMENT ON COLUMN profiles.branch_phone IS 'Teléfono de contacto de la sede del usuario para comandas';
COMMENT ON COLUMN service_orders.order_number IS 'Número único de orden generado automáticamente';
COMMENT ON COLUMN service_orders.serial_number IS 'Número de serie del dispositivo';
COMMENT ON COLUMN service_orders.observations IS 'Observaciones adicionales sobre el dispositivo o reparación';
COMMENT ON COLUMN service_orders.delivery_notes IS 'Notas opcionales al momento de la entrega';
COMMENT ON COLUMN service_orders.delivered_at IS 'Fecha y hora de entrega al cliente';
COMMENT ON COLUMN company_settings.features_enabled IS 'Control de funcionalidades habilitadas (outsourcing, warranty_tracking, technician_stats)';
COMMENT ON COLUMN company_settings.required_fields IS 'Configuración de campos obligatorios en órdenes de servicio';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Listar todas las tablas creadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 
    'customers', 
    'service_orders', 
    'company_settings',
    'external_workshops',
    'external_repairs'
  )
ORDER BY tablename;

-- Verificar que se creó la configuración inicial
SELECT company_name, phone, city FROM company_settings LIMIT 1;

-- ============================================
-- PASOS SIGUIENTES (DESPUÉS DE EJECUTAR ESTE SCRIPT)
-- ============================================

-- 1. CREAR BUCKET DE STORAGE PARA LOGOS
-- ============================================
-- Ve a Storage en Supabase Dashboard:
-- - Crea un bucket llamado "company-assets"
-- - Márcalo como PÚBLICO
-- - File size limit: 2MB
-- - MIME types: image/jpeg, image/png, image/gif, image/webp

-- 2. POLÍTICAS DE STORAGE (ejecutar después de crear bucket)
-- ============================================
/*
-- Política para VER archivos (público)
CREATE POLICY "Ver logos públicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Política para SUBIR archivos (solo admins)
CREATE POLICY "Solo admins pueden subir logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para ACTUALIZAR archivos (solo admins)
CREATE POLICY "Solo admins pueden actualizar logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para ELIMINAR archivos (solo admins)
CREATE POLICY "Solo admins pueden eliminar logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
*/

-- 3. CREAR USUARIO ADMINISTRADOR
-- ============================================
-- Primero ve a Authentication > Users en Supabase Dashboard
-- Crea un usuario con email: admin@gameboxservice.com (o el que prefieras)
-- Luego ejecuta el siguiente SQL para darle rol de admin:
/*
UPDATE profiles 
SET role = 'admin', 
    full_name = 'Administrador',
    sede = 'Parque Caldas',
    branch_phone = '3116638302'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@gameboxservice.com');
*/

-- ============================================
-- RESUMEN DE LA MIGRACIÓN
-- ============================================
-- ✅ 6 Tablas principales creadas
-- ✅ Row Level Security habilitado
-- ✅ Políticas de seguridad configuradas
-- ✅ Funciones y triggers configurados
-- ✅ Índices para rendimiento creados
-- ✅ Vista v_external_repairs_full creada
-- ✅ Configuración inicial insertada
-- ============================================

SELECT '✅ Migración completada exitosamente!' as status;
