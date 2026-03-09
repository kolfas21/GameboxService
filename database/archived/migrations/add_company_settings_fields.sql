-- ============================================
-- MIGRACIÓN: Extender Company Settings
-- ============================================
-- Descripción: Agrega campos adicionales a la tabla company_settings
--              para personalización completa del sistema
-- Fecha: 2026-02-16
-- ============================================

-- 1. Agregar nuevos campos a company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Colombia',
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS business_hours TEXT;

-- 2. Actualizar datos iniciales si la fila ya existe
UPDATE company_settings
SET 
  phone = COALESCE(phone, '+57 XXX XXX XXXX'),
  email = COALESCE(email, 'contacto@gameboxservice.com'),
  address = COALESCE(address, 'Ingrese su dirección'),
  city = COALESCE(city, 'Manizales'),
  country = COALESCE(country, 'Colombia'),
  description = COALESCE(description, 'Centro de reparación de consolas y controles'),
  business_hours = COALESCE(business_hours, 'Lun-Vie: 9AM-6PM, Sáb: 9AM-1PM')
WHERE id IS NOT NULL;

-- 3. Si no existe ninguna configuración, crear una por defecto
INSERT INTO company_settings (
  company_name, 
  phone, 
  email, 
  address, 
  city, 
  country,
  description,
  business_hours
)
SELECT 
  'GameBox Service',
  '+57 XXX XXX XXXX',
  'contacto@gameboxservice.com',
  'Ingrese su dirección',
  'Manizales',
  'Colombia',
  'Centro de reparación de consolas y controles',
  'Lun-Vie: 9AM-6PM, Sáb: 9AM-1PM'
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar la migración:
-- SELECT * FROM company_settings;
-- ============================================
