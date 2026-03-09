-- Script para agregar campo de teléfono de sede a usuarios (profiles)
-- Este script agrega el campo branch_phone a la tabla profiles para que cada usuario
-- pueda tener su propio teléfono que aparecerá en las comandas

-- Agregar columna para el teléfono de la sede del usuario
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS branch_phone TEXT;

-- Actualizar registros existentes con valor por defecto
UPDATE profiles
SET branch_phone = '3116638302'
WHERE branch_phone IS NULL;

-- Comentario explicativo
COMMENT ON COLUMN profiles.branch_phone IS 'Teléfono de la sede del usuario que aparecerá en las comandas y stickers';

-- Nota: El campo 'sede' ya existe en la tabla profiles
-- Si no existe, puedes agregarlo con:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sede TEXT;
