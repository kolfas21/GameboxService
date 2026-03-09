-- Script para limpiar registros duplicados y regenerar order_numbers
-- CUIDADO: Este script puede eliminar datos. Hacer backup antes de ejecutar.

-- 1. Ver registros duplicados por order_number
SELECT 
    order_number, 
    COUNT(*) as count,
    string_agg(id::text, ', ') as ids
FROM service_orders 
WHERE order_number IS NOT NULL
GROUP BY order_number 
HAVING COUNT(*) > 1;

-- 2. Limpiar todos los order_numbers para regenerarlos
UPDATE service_orders SET order_number = NULL;

-- 3. Regenerar order_numbers únicos usando una secuencia
DO $$
DECLARE
    rec RECORD;
    counter INTEGER;
    date_str TEXT;
    new_order_number TEXT;
BEGIN
    counter := 1;
    
    FOR rec IN 
        SELECT id, created_at 
        FROM service_orders 
        ORDER BY created_at ASC
    LOOP
        date_str := to_char(rec.created_at, 'YYYYMMDD');
        new_order_number := 'OS-' || date_str || '-' || LPAD(counter::TEXT, 6, '0');
        
        UPDATE service_orders 
        SET order_number = new_order_number 
        WHERE id = rec.id;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Regenerados % números de orden', counter - 1;
END$$;

-- 4. Verificar que no hay duplicados
SELECT 
    order_number, 
    COUNT(*) as count 
FROM service_orders 
GROUP BY order_number 
HAVING COUNT(*) > 1;

-- 5. Verificar algunos ejemplos
SELECT id, order_number, created_at, device_brand, device_model 
FROM service_orders 
ORDER BY created_at DESC 
LIMIT 5;