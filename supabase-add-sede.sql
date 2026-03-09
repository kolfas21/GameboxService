-- Script para agregar campo de SEDE a los usuarios

-- 1. Agregar columna 'sede' a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sede TEXT DEFAULT 'Sede Principal';

-- 2. Actualizar usuarios existentes (opcional - puedes cambiar los valores)
UPDATE profiles 
SET sede = 'Sede Principal' 
WHERE sede IS NULL;

-- 3. Verificar que se agregó correctamente
SELECT id, email, full_name, role, sede, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- 4. Ver usuarios agrupados por sede
SELECT sede, COUNT(*) as cantidad_usuarios 
FROM profiles 
GROUP BY sede;
