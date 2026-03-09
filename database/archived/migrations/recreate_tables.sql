-- Script de recreación de tablas para GameBox Service
-- CUIDADO: Este script elimina las tablas existentes
-- Solo ejecutar si es necesario recrear la estructura

-- Eliminar tablas existentes (en orden correcto para evitar errores de foreign key)
DROP TABLE IF EXISTS service_orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;

-- Crear tabla profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'receptionist', 'technician')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla customers
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cedula TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla service_orders
CREATE TABLE service_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL,
    device_brand TEXT NOT NULL,
    device_model TEXT,
    problem_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    received_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla company_settings
CREATE TABLE company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL DEFAULT 'GameBox Service',
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#007bff',
    secondary_color TEXT NOT NULL DEFAULT '#6c757d',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_customers_cedula ON customers(cedula);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_service_orders_customer_id ON service_orders(customer_id);
CREATE INDEX idx_service_orders_assigned_technician_id ON service_orders(assigned_technician_id);
CREATE INDEX idx_service_orders_completed_by_id ON service_orders(completed_by_id);
CREATE INDEX idx_service_orders_received_by_id ON service_orders(received_by_id);
CREATE INDEX idx_service_orders_created_at ON service_orders(created_at);

-- Insertar usuario admin inicial
INSERT INTO profiles (id, email, full_name, role) 
VALUES ('04b1057f-7421-4ba0-95be-2de7f591acc3', 'admin@gameboxservice.com', 'Administrador', 'admin')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Insertar configuración inicial de la empresa
INSERT INTO company_settings (company_name, primary_color, secondary_color)
VALUES ('GameBox Service', '#007bff', '#6c757d');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (pero sin políticas restrictivas por ahora)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para usuarios autenticados
CREATE POLICY "allow_authenticated_profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated_customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated_service_orders" ON service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_authenticated_company_settings" ON company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);