-- Script para actualizar nombres de técnicos
-- Ejecuta este SQL en Supabase SQL Editor

-- 1. Ver técnicos actuales sin full_name
SELECT id, email, full_name, role 
FROM profiles 
WHERE role = 'technician' AND (full_name IS NULL OR full_name = '' OR full_name = email);

-- 2. Actualizar técnicos para que tengan nombres basados en su email
-- (Solo si no tienen un nombre ya)
UPDATE profiles 
SET full_name = CASE 
    WHEN full_name IS NULL OR full_name = '' OR full_name = email THEN 
        INITCAP(SPLIT_PART(email, '@', 1))  -- Convierte 'juan.perez' a 'Juan.Perez'
    ELSE 
        full_name  -- Mantener el nombre existente si ya tiene uno
END
WHERE role = 'technician';

-- 3. Verificar los cambios
SELECT id, email, full_name, role 
FROM profiles 
WHERE role = 'technician';

-- EJEMPLO MANUAL: Si quieres establecer nombres específicos para tus técnicos
-- Descomenta y modifica estas líneas según tus técnicos reales:

-- UPDATE profiles 
-- SET full_name = 'Juan Pérez' 
-- WHERE email = 'juan@example.com';

-- UPDATE profiles 
-- SET full_name = 'María González' 
-- WHERE email = 'maria@example.com';