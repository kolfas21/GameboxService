-- Script para corregir órdenes entregadas sin fecha de entrega
-- Actualiza delivered_at con updated_at para órdenes con status 'delivered'

UPDATE service_orders
SET delivered_at = updated_at
WHERE status = 'delivered' 
  AND delivered_at IS NULL;

-- Verificar cuántas órdenes se actualizaron
SELECT 
  COUNT(*) as ordenes_actualizadas,
  MIN(delivered_at) as fecha_mas_antigua,
  MAX(delivered_at) as fecha_mas_reciente
FROM service_orders
WHERE status = 'delivered';
