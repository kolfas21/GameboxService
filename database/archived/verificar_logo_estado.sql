-- ============================================
-- VERIFICAR ESTADO DEL LOGO EN LA BASE DE DATOS
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Ver configuración actual con TODOS los campos
SELECT 
  id,
  company_name,
  logo_url,
  created_at,
  updated_at,
  features_enabled,
  required_fields
FROM company_settings
ORDER BY updated_at DESC
LIMIT 1;

-- 2. Verificar específicamente el logo_url
SELECT 
  CASE 
    WHEN logo_url IS NULL THEN '❌ Logo URL es NULL - NO HAY LOGO GUARDADO'
    WHEN logo_url = '' THEN '❌ Logo URL está vacío'
    WHEN logo_url LIKE '%company-assets/logos/%' THEN '✅ Logo URL correcta - está en Storage'
    ELSE '⚠️ Logo URL tiene formato incorrecto: ' || logo_url
  END as estado_logo,
  logo_url as url_completa,
  LENGTH(logo_url) as longitud_caracteres
FROM company_settings;

-- 3. Ver archivos de logos en Storage (últimos 5)
SELECT 
  name as archivo,
  bucket_id,
  created_at as fecha_subida,
  metadata->>'size' as tamaño_bytes
FROM storage.objects
WHERE bucket_id = 'company-assets'
  AND name LIKE 'logos/%'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Contar total de registros en company_settings
SELECT COUNT(*) as total_registros FROM company_settings;

-- ============================================
-- RESULTADO ESPERADO:
-- - Debe haber EXACTAMENTE 1 registro en company_settings
-- - logo_url debe ser: https://accgsxxauagpzzolysgz.supabase.co/storage/v1/object/public/company-assets/logos/logo-XXXXX.jpeg
-- - Debe haber al menos 1 archivo en storage.objects
-- ============================================

-- 5. Si el logo_url es NULL, actualízalo manualmente con el último logo subido
-- (DESCOMENTA Y EJECUTA SOLO SI ES NECESARIO)
/*
UPDATE company_settings 
SET logo_url = (
  SELECT 'https://accgsxxauagpzzolysgz.supabase.co/storage/v1/object/public/company-assets/' || name
  FROM storage.objects
  WHERE bucket_id = 'company-assets' AND name LIKE 'logos/%'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE id IS NOT NULL;

-- Verificar que se actualizó
SELECT company_name, logo_url FROM company_settings;
*/
