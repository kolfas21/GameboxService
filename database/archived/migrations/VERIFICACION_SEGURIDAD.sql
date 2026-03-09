-- ============================================
-- SCRIPT DE VERIFICACIÓN DE SEGURIDAD
-- Ejecuta este script ANTES y DESPUÉS de las migraciones
-- para comprobar que NO se perdieron datos
-- ============================================

-- 📊 PASO 1: CONTAR REGISTROS ANTES DE LA MIGRACIÓN
-- ============================================
-- Ejecuta esto ANTES de aplicar las migraciones

SELECT 'VERIFICACIÓN ANTES DE MIGRACIÓN' as paso;

-- Contar órdenes de servicio
SELECT 'service_orders' as tabla, COUNT(*) as total_registros
FROM service_orders;

-- Contar clientes
SELECT 'customers' as tabla, COUNT(*) as total_registros
FROM customers;

-- Contar perfiles de usuario
SELECT 'profiles' as tabla, COUNT(*) as total_registros
FROM profiles;

-- Contar configuraciones de empresa
SELECT 'company_settings' as tabla, COUNT(*) as total_registros
FROM company_settings;

-- Ver estructura actual de company_settings
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;

-- Ver constraint actual de service_orders
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%status%';

-- ============================================
-- 📊 PASO 2: CONTAR REGISTROS DESPUÉS DE LA MIGRACIÓN
-- ============================================
-- Ejecuta esto DESPUÉS de aplicar las migraciones

SELECT 'VERIFICACIÓN DESPUÉS DE MIGRACIÓN' as paso;

-- Contar órdenes de servicio (debe ser EL MISMO número)
SELECT 'service_orders' as tabla, COUNT(*) as total_registros
FROM service_orders;

-- Contar clientes (debe ser EL MISMO número)
SELECT 'customers' as tabla, COUNT(*) as total_registros
FROM customers;

-- Contar perfiles (debe ser EL MISMO número)
SELECT 'profiles' as tabla, COUNT(*) as total_registros
FROM profiles;

-- Contar configuraciones (debe ser EL MISMO número)
SELECT 'company_settings' as tabla, COUNT(*) as total_registros
FROM company_settings;

-- Verificar que las nuevas columnas existen
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'company_settings'
  AND column_name IN ('features_enabled', 'required_fields');

-- Verificar que el nuevo estado 'outsourced' fue agregado
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'service_orders_status_check';

-- Verificar que las tablas nuevas se crearon
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('external_workshops', 'external_repairs');

-- ============================================
-- 🔍 PASO 3: VERIFICACIÓN DETALLADA DE DATOS
-- ============================================

-- Ver sample de órdenes (primeras 5)
SELECT id, order_number, status, device_type, created_at
FROM service_orders
ORDER BY created_at DESC
LIMIT 5;

-- Ver valores de configuración
SELECT id, company_name, features_enabled, required_fields
FROM company_settings;

-- ============================================
-- ✅ CRITERIOS DE ÉXITO:
-- ============================================
-- 1. El COUNT de service_orders ANTES == DESPUÉS
-- 2. El COUNT de customers ANTES == DESPUÉS  
-- 3. El COUNT de profiles ANTES == DESPUÉS
-- 4. El COUNT de company_settings ANTES == DESPUÉS
-- 5. Las columnas features_enabled y required_fields existen
-- 6. El constraint incluye 'outsourced' en la lista
-- 7. Las tablas external_workshops y external_repairs existen
-- 8. Los datos de sample se ven correctos
-- ============================================

-- ============================================
-- 📸 ALTERNATIVA: BACKUP MANUAL EN SUPABASE
-- ============================================
-- OPCIÓN 1: Backup automático de Supabase
--   1. Ve a tu proyecto en https://app.supabase.com
--   2. Haz clic en "Settings" → "Database"
--   3. Busca "Point-in-time Recovery" o "Backups"
--   4. Supabase guarda backups automáticamente
--   5. Puedes restaurar a cualquier punto si algo sale mal
--
-- OPCIÓN 2: Export manual
--   1. Ve a "Database" → "Tables"
--   2. Selecciona cada tabla
--   3. Haz clic en "Export" → "CSV"
--   4. Guarda los archivos localmente
-- ============================================
