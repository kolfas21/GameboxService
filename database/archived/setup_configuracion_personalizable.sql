-- ============================================
-- SETUP COMPLETO: Sistema de Configuración Personalizable
-- ============================================
-- Descripción: Script completo para habilitar configuración 
--              personalizable del sistema (logo, datos empresariales, etc.)
-- Fecha: 2026-02-16
-- ============================================

-- ============================================
-- PARTE 1: EXTENSIÓN DE TABLA COMPANY_SETTINGS
-- ============================================

-- Agregar nuevos campos a company_settings
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

-- ============================================
-- PARTE 2: DATOS INICIALES
-- ============================================

-- Actualizar datos iniciales si la fila ya existe
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

-- Si no existe ninguna configuración, crear una por defecto
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
-- PARTE 3: STORAGE BUCKET PARA LOGOS
-- ============================================
-- IMPORTANTE: Esta parte debe ejecutarse en la consola de Supabase
-- desde la sección Storage, NO desde SQL Editor
-- ============================================

-- INSTRUCCIONES PARA CREAR EL BUCKET:
-- 1. Ve a Storage en el panel de Supabase
-- 2. Crea un nuevo bucket llamado "company-assets"
-- 3. Marca como PÚBLICO
-- 4. Opciones recomendadas:
--    - Public bucket: YES
--    - File size limit: 2MB
--    - Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp

-- ============================================
-- PARTE 4: POLÍTICAS DE STORAGE
-- ============================================
-- Estas políticas permiten a todos ver las imágenes
-- pero solo admins pueden subirlas/modificarlas
-- ============================================

-- Nota: Ejecuta estos comandos DESPUÉS de crear el bucket manualmente

-- Política para VER archivos (público)
-- CREATE POLICY "Ver logos públicamente"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'company-assets');

-- Política para SUBIR archivos (solo admins)
-- CREATE POLICY "Solo admins pueden subir logos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'company-assets' 
--   AND auth.role() = 'authenticated'
--   AND EXISTS (
--     SELECT 1 FROM profiles 
--     WHERE id = auth.uid() AND role = 'admin'
--   )
-- );

-- Política para ACTUALIZAR archivos (solo admins)
-- CREATE POLICY "Solo admins pueden actualizar logos"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'company-assets'
--   AND EXISTS (
--     SELECT 1 FROM profiles 
--     WHERE id = auth.uid() AND role = 'admin'
--   )
-- );

-- Política para ELIMINAR archivos (solo admins)
-- CREATE POLICY "Solo admins pueden eliminar logos"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'company-assets'
--   AND EXISTS (
--     SELECT 1 FROM profiles 
--     WHERE id = auth.uid() AND role = 'admin'
--   )
-- );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver configuración actual
SELECT * FROM company_settings;

-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;

-- ============================================
-- RESUMEN DE CAMBIOS
-- ============================================
-- ✅ Tabla company_settings extendida con:
--    - Información de contacto (teléfono, email, dirección)
--    - Ubicación (ciudad, país)
--    - Online presence (website, redes sociales)
--    - Info legal (RUC/tax_id)
--    - Horarios de atención
-- 
-- ✅ Datos iniciales insertados
-- 
-- 📁 Storage bucket "company-assets" debe crearse manualmente
-- 
-- 🔒 Políticas de seguridad:
--    - Todos pueden VER logos
--    - Solo ADMINS pueden SUBIR/MODIFICAR/ELIMINAR
-- ============================================

-- ============================================
-- PASOS SIGUIENTES (MANUAL)
-- ============================================
-- 1. ✅ Ejecutar este script en SQL Editor de Supabase
-- 2. 📁 Ir a Storage y crear bucket "company-assets" (público)
-- 3. 🔒 Descomentar y ejecutar las políticas de storage
-- 4. 🎨 Acceder a Configuración desde el dashboard del admin
-- 5. 🖼️ Subir logo y configurar datos de la empresa
-- ============================================
