-- ============================================
-- GAMEBOX SERVICE - CONFIGURACIÓN DE STORAGE
-- ============================================
-- Descripción: Configurar bucket y políticas para almacenar logos
-- Versión: 3.0
-- Fecha: 2026-02-17
-- ============================================
-- IMPORTANTE: 
-- - Ejecutar DESPUÉS de 02_init_policies.sql
-- - Este script crea el bucket "company-assets" de forma automática
-- ============================================

-- ============================================
-- PARTE 1: CREAR BUCKET PARA LOGOS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,  -- Bucket público para acceso directo a logos
  10485760,  -- 10 MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- ============================================
-- PARTE 2: LIMPIAR POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Ver logos públicamente" ON storage.objects;
DROP POLICY IF EXISTS "Solo admins pueden subir logos" ON storage.objects;
DROP POLICY IF EXISTS "Solo admins pueden actualizar logos" ON storage.objects;
DROP POLICY IF EXISTS "Solo admins pueden eliminar logos" ON storage.objects;
DROP POLICY IF EXISTS "company_assets_select" ON storage.objects;
DROP POLICY IF EXISTS "company_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "company_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "company_assets_delete" ON storage.objects;

-- ============================================
-- PARTE 3: CREAR POLÍTICAS DE ACCESO
-- ============================================

-- Política 1: Todo el mundo puede VER los archivos (público)
CREATE POLICY "company_assets_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Política 2: Usuarios autenticados pueden SUBIR archivos
CREATE POLICY "company_assets_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- Política 3: Usuarios autenticados pueden ACTUALIZAR archivos
CREATE POLICY "company_assets_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- Política 4: Usuarios autenticados pueden ELIMINAR archivos
CREATE POLICY "company_assets_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver el bucket creado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  '✅' as status
FROM storage.buckets
WHERE id = 'company-assets';

-- Ver las políticas creadas
SELECT 
  policyname,
  cmd,
  '✅' as status
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%company_assets%'
ORDER BY cmd, policyname;

-- ============================================
-- RESUMEN
-- ============================================
-- ✅ Bucket "company-assets" creado
-- ✅ Límite de tamaño: 10 MB
-- ✅ Tipos permitidos: JPEG, PNG, GIF, WebP, SVG
-- ✅ Acceso público para ver logos
-- ✅ 4 Políticas de Storage configuradas
-- ============================================

SELECT '✅ Storage configurado exitosamente!' as status,
       'Ahora crea tu primer usuario administrador' as next_step;
