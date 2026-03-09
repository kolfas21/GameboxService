-- Script de verificación de la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla customers
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla service_orders
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'service_orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estructura de la tabla profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar foreign keys de service_orders
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table,
    a.attname AS column_name,
    af.attname AS foreign_column
FROM pg_constraint con
JOIN pg_attribute a ON a.attnum = ANY(con.conkey) AND a.attrelid = con.conrelid
JOIN pg_attribute af ON af.attnum = ANY(con.confkey) AND af.attrelid = con.confrelid
WHERE contype = 'f' AND con.conrelid::regclass::text = 'service_orders';

-- 5. Verificar índices únicos en customers
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'customers' AND schemaname = 'public';

-- 6. Verificar si hay datos de prueba
SELECT 'customers' as table_name, count(*) as record_count FROM customers
UNION ALL
SELECT 'profiles' as table_name, count(*) as record_count FROM profiles
UNION ALL
SELECT 'service_orders' as table_name, count(*) as record_count FROM service_orders;

-- 7. Verificar el usuario admin
SELECT id, email, role, created_at FROM profiles WHERE email = 'admin@gameboxservice.com';

-- 8. Ver un ejemplo de customer si existe
SELECT * FROM customers LIMIT 1;

-- 9. Ver un ejemplo de service_order si existe
SELECT * FROM service_orders LIMIT 1;