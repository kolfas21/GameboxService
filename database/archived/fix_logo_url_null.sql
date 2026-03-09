-- ============================================
-- FIX: Actualizar logo_url con el último logo de Storage
-- ============================================
-- Este script toma el último logo que subiste a Storage
-- y lo asigna a company_settings.logo_url
-- ============================================

-- PASO 1: Ver el estado actual
SELECT 
  id,
  company_name,
  logo_url,
  CASE 
    WHEN logo_url IS NULL THEN '❌ NULL - Hay que actualizarlo'
    WHEN logo_url = '' THEN '❌ Vacío - Hay que actualizarlo'
    WHEN logo_url LIKE '%company-assets/logos/%' THEN '✅ Correcto'
    ELSE '⚠️ Formato incorrecto'
  END as estado
FROM company_settings;

-- PASO 2: Ver los logos disponibles en Storage
SELECT 
  'https://accgsxxauagpzzolysgz.supabase.co/storage/v1/object/public/company-assets/' || name as url_completa,
  name,
  created_at
FROM storage.objects
WHERE bucket_id = 'company-assets' 
  AND name LIKE 'logos/%'
ORDER BY created_at DESC
LIMIT 5;

-- PASO 3: Actualizar logo_url con el último logo subido
UPDATE company_settings 
SET logo_url = (
  SELECT 'https://accgsxxauagpzzolysgz.supabase.co/storage/v1/object/public/company-assets/' || name
  FROM storage.objects
  WHERE bucket_id = 'company-assets' 
    AND name LIKE 'logos/%'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE id IS NOT NULL;

-- PASO 4: Verificar que se actualizó correctamente
SELECT 
  id,
  company_name,
  logo_url,
  '✅ Logo actualizado correctamente!' as status
FROM company_settings;

-- ============================================
-- RESULTADO ESPERADO:
-- logo_url debe ser: https://accgsxxauagpzzolysgz.supabase.co/storage/v1/object/public/company-assets/logos/logo-XXXXX.jpeg
-- ============================================
