-- Script para agregar/corregir la columna order_number en service_orders
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la columna order_number existe
DO $$
BEGIN
    -- Intentar agregar la columna si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'service_orders' 
        AND column_name = 'order_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE service_orders ADD COLUMN order_number TEXT;
        RAISE NOTICE 'Columna order_number agregada';
    ELSE
        RAISE NOTICE 'Columna order_number ya existe';
    END IF;
END$$;

-- 2. Generar números de orden para registros existentes que no los tengan
UPDATE service_orders 
SET order_number = 'OS-' || to_char(created_at, 'YYYYMMDD') || '-' || LPAD(CAST(EXTRACT(EPOCH FROM created_at) AS TEXT), 6, '0')
WHERE order_number IS NULL OR order_number = '';

-- 3. Hacer la columna NOT NULL después de rellenar los valores
ALTER TABLE service_orders ALTER COLUMN order_number SET NOT NULL;

-- 4. Agregar índice único para la columna order_number
CREATE UNIQUE INDEX IF NOT EXISTS service_orders_order_number_key ON service_orders(order_number);

-- 5. Agregar constraint único si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_orders_order_number_key' 
        AND table_name = 'service_orders'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE service_orders ADD CONSTRAINT service_orders_order_number_key UNIQUE (order_number);
        RAISE NOTICE 'Constraint único agregado a order_number';
    ELSE
        RAISE NOTICE 'Constraint único ya existe en order_number';
    END IF;
END$$;

-- 6. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;