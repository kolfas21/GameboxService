-- ============================================
-- DIAGNÓSTICO: Problema con Logo No Actualiza
-- ============================================
-- Ejecuta estas consultas EN ORDEN en el SQL Editor de Supabase
-- para diagnosticar por qué el logo no se está actualizando
-- ============================================

-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;

-- Este debería mostrar:
-- - id, company_name, logo_url, phone, email, address, city, country, etc.
-- - NO debería mostrar primary_color ni secondary_color


-- 2. VER DATOS ACTUALES EN COMPANY_SETTINGS
-- ============================================
SELECT 
  id,
  company_name,
  logo_url,
  phone,
  email,
  created_at,
  updated_at
FROM company_settings
ORDER BY created_at DESC;

-- Revisa:
-- ✅ ¿Hay alguna fila? (debe haber AL MENOS una)
-- ✅ ¿El logo_url tiene una URL de Supabase?
-- ✅ ¿El logo_url es NULL?


-- 3. VERIFICAR BUCKET DE STORAGE
-- ============================================
-- Ve a: Storage > company-assets en el panel de Supabase
-- Verifica:
-- ✅ ¿El bucket "company-assets" existe?
-- ✅ ¿Es PÚBLICO? (debe estar marcado como público)
-- ✅ ¿Hay archivos en la carpeta logos/?
-- ✅ ¿Cuántos logos hay? (debería haber solo 1, el más reciente)


-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'company_settings'
ORDER BY policyname;

-- Debe mostrar 4 políticas:
-- - company_settings_select_policy (SELECT)
-- - company_settings_insert_policy (INSERT)  
-- - company_settings_update_policy (UPDATE)
-- - company_settings_delete_policy (DELETE)


-- 5. VERIFICAR SI RLS ESTÁ HABILITADO
-- ============================================
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'company_settings';

-- rowsecurity debe ser TRUE


-- 6. VERIFICAR TU USUARIO ADMIN
-- ============================================
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role = 'admin';

-- Verifica:
-- ✅ Tu usuario aparece aquí
-- ✅ El role es exactamente 'admin' (no 'Admin' ni 'ADMIN')


-- 7. PRUEBA DE ACTUALIZACIÓN MANUAL
-- ============================================
-- ⚠️ IMPORTANTE: Reemplaza 'URL_DE_TU_LOGO' con una URL real
-- Por ejemplo: https://tuproyecto.supabase.co/storage/v1/object/public/company-assets/logos/logo-1234567890.png

UPDATE company_settings
SET 
  logo_url = 'URL_DE_TU_LOGO',
  updated_at = NOW()
WHERE id IS NOT NULL;

-- Después de ejecutar esto, verifica en la aplicación si el logo cambia


-- 8. SI NO EXISTE company_settings, CREAR UNO
-- ============================================
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


-- 9. VERIFICAR POLÍTICAS DE STORAGE
-- ============================================
-- Ve a: Storage > Policies en el panel de Supabase
-- Verifica que existan políticas para company-assets:
--
-- ✅ SELECT (público) - para ver logos
-- ✅ INSERT (solo admin) - para subir logos  
-- ✅ UPDATE (solo admin) - para reemplazar logos
-- ✅ DELETE (solo admin) - para eliminar logos viejos

-- Si NO existen, créalas manualmente en el panel de Storage


-- 10. LIMPIAR LOGOS VIEJOS (OPCIONAL)
-- ============================================
-- Si tienes varios logos en storage/company-assets/logos/
-- y solo quieres mantener el más reciente, ve a:
-- Storage > company-assets > logos/
-- y elimina manualmente los archivos viejos


-- ============================================
-- RESULTADOS ESPERADOS
-- ============================================
-- 
-- ✅ Tabla company_settings tiene columna logo_url
-- ✅ Existe AL MENOS una fila en company_settings
-- ✅ El bucket company-assets existe y es PÚBLICO
-- ✅ Hay políticas RLS para company_settings
-- ✅ Tu usuario tiene role = 'admin'
-- ✅ Existen políticas en Storage para company-assets
--
-- Si TODO lo anterior está bien, el problema es de CACHE
-- en el navegador. Solución:
-- 1. Ctrl + Shift + R (forzar recarga sin cache)
-- 2. Borrar cache del navegador
-- 3. Probar en ventana incógnito
--
-- ============================================
