-- Script de verificación para debug
-- Ejecuta este SQL en Supabase SQL Editor para ver los datos

-- 1. Ver órdenes en progreso con técnicos asignados
SELECT 
    so.id,
    so.order_number,
    so.status,
    so.assigned_technician_id,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.role
FROM service_orders so
LEFT JOIN profiles p ON so.assigned_technician_id = p.id
WHERE so.status = 'in_progress';

-- 2. Ver todos los perfiles de técnicos
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles
WHERE role = 'technician';

-- 3. Verificar si existe la columna completed_by_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
AND column_name IN ('assigned_technician_id', 'completed_by_id');