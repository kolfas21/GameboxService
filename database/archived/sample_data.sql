-- Datos de ejemplo para GameBox Service
-- IMPORTANTE: Ejecutar DESPUÉS de setup.sql y configurar usuarios

-- 1. Clientes de ejemplo
INSERT INTO customers (cedula, full_name, phone, email) VALUES
  ('12345678', 'Juan Pérez González', '+57 300 123 4567', 'juan.perez@email.com'),
  ('87654321', 'María López Rodríguez', '+57 301 987 6543', 'maria.lopez@email.com'),
  ('11223344', 'Carlos Hernández Silva', '+57 302 111 2233', 'carlos.hernandez@email.com'),
  ('44332211', 'Ana García Martínez', '+57 303 444 3322', 'ana.garcia@email.com'),
  ('55667788', 'Diego Ramírez Castro', '+57 304 555 6677', 'diego.ramirez@email.com')
ON CONFLICT (cedula) DO NOTHING;

-- 2. Configuración de empresa actualizada
UPDATE company_settings SET 
  company_name = 'GameBox Service - Reparación de Consolas',
  primary_color = '#2563eb',
  secondary_color = '#64748b'
WHERE id = (SELECT id FROM company_settings LIMIT 1);

-- 3. Órdenes de servicio de ejemplo
-- NOTA: Debes reemplazar 'RECEPTION_USER_ID' con el ID real del usuario recepcionista
-- y 'TECHNICIAN_USER_ID' con el ID real del técnico

-- Ejemplo de cómo obtener los IDs:
-- SELECT id, email, role FROM profiles WHERE role IN ('receptionist', 'technician');

/*
-- Uncomment and replace with actual user IDs after creating users:

INSERT INTO service_orders (
  customer_id,
  device_type,
  device_brand,
  device_model,
  problem_description,
  status,
  priority,
  received_by_id
) VALUES
  (
    (SELECT id FROM customers WHERE cedula = '12345678'),
    'Consola',
    'PlayStation',
    'PS5',
    'No enciende, se escucha el ventilador pero no hay video en pantalla',
    'pending',
    'high',
    'RECEPTION_USER_ID'  -- Reemplazar con ID real
  ),
  (
    (SELECT id FROM customers WHERE cedula = '87654321'),
    'Control',
    'Xbox',
    'Series X Controller',
    'Stick derecho no responde correctamente, se queda pegado hacia la izquierda',
    'pending',
    'medium',
    'RECEPTION_USER_ID'  -- Reemplazar con ID real
  ),
  (
    (SELECT id FROM customers WHERE cedula = '11223344'),
    'Consola',
    'Nintendo',
    'Switch',
    'No carga la batería, conector USB-C suelto',
    'in_progress',
    'medium',
    'RECEPTION_USER_ID'  -- Reemplazar con ID real
  ),
  (
    (SELECT id FROM customers WHERE cedula = '44332211'),
    'Control',
    'PlayStation',
    'DualSense',
    'Botones L1 y R1 no funcionan',
    'completed',
    'low',
    'RECEPTION_USER_ID'  -- Reemplazar con ID real
  );

-- Para asignar técnico a las órdenes en progreso:
UPDATE service_orders 
SET assigned_technician_id = 'TECHNICIAN_USER_ID'  -- Reemplazar con ID real
WHERE status IN ('in_progress', 'completed');

-- Para agregar notas de completado:
UPDATE service_orders 
SET completion_notes = 'Botones L1 y R1 reemplazados. Pruebas realizadas exitosamente.'
WHERE status = 'completed';
*/

-- Mensaje de información
SELECT 'Datos de ejemplo creados. Recuerda actualizar los IDs de usuario en los comentarios.' as message;
