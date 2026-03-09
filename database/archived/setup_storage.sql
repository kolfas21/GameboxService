-- ============================================
-- CONFIGURAR STORAGE PARA COMPANY-ASSETS
-- ============================================
-- Este script crea el bucket y todas las políticas necesarias
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- PASO 1: Crear el bucket público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,  -- Bucket público
  10485760,  -- 10 MB en bytes
  NULL  -- Permitir todos los tipos de archivos
)
ON CONFLICT (id) DO NOTHING;

-- PASO 2: Crear políticas de acceso
-- ============================================

-- Política 1: Todo el mundo puede VER los archivos (público)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Política 2: Usuarios autenticados pueden SUBIR archivos
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- Política 3: Usuarios autenticados pueden ACTUALIZAR archivos
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- Política 4: Usuarios autenticados pueden ELIMINAR archivos
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- PASO 3: Verificar que todo se creó correctamente
-- ============================================

-- Ver el bucket creado
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'company-assets';

-- Ver las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%company-assets%'
  OR policyname LIKE '%Authenticated%'
  OR policyname LIKE '%Public%'
ORDER BY policyname;

SELECT '✅ Bucket y políticas de Storage configurados correctamente!' as status;
