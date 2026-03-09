-- ============================================
-- MIGRACIÓN: Sistema de Tercerización
-- ============================================
-- Fecha: 2026-02-16
-- Descripción: Agrega funcionalidad para rastrear reparaciones
--              enviadas a talleres externos (tercerizadas)
-- ============================================

-- PARTE 1: AGREGAR NUEVO ESTADO "outsourced"
-- ============================================

-- Modificar el CHECK constraint para incluir el nuevo estado
ALTER TABLE service_orders 
DROP CONSTRAINT IF EXISTS service_orders_status_check;

ALTER TABLE service_orders
ADD CONSTRAINT service_orders_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered', 'outsourced'));

-- ============================================
-- PARTE 2: CREAR TABLA DE TALLERES EXTERNOS
-- ============================================

CREATE TABLE IF NOT EXISTS external_workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTE 3: CREAR TABLA DE REPARACIONES EXTERNAS
-- ============================================

CREATE TABLE IF NOT EXISTS external_repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  workshop_id UUID REFERENCES external_workshops(id) NOT NULL,
  
  -- Información de envío
  sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  sent_by_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Información de seguimiento
  external_status TEXT CHECK (external_status IN ('sent', 'in_process', 'ready', 'returned')) DEFAULT 'sent',
  estimated_return_date TIMESTAMP WITH TIME ZONE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  
  -- Costos
  external_cost DECIMAL(10, 2),
  
  -- Notas y observaciones
  problem_sent TEXT NOT NULL, -- Descripción del problema enviado
  work_done TEXT, -- Trabajo realizado por el taller externo
  notes TEXT,
  
  -- Quién recibió de vuelta
  received_by_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: solo una reparación externa activa por orden
  UNIQUE(service_order_id, actual_return_date)
);

-- ============================================
-- PARTE 4: HABILITAR RLS EN NUEVAS TABLAS
-- ============================================

ALTER TABLE external_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_repairs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 5: POLÍTICAS DE SEGURIDAD
-- ============================================

-- Políticas para external_workshops
CREATE POLICY "Usuarios autenticados pueden ver talleres"
ON external_workshops FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden crear talleres"
ON external_workshops FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Solo admins pueden actualizar talleres"
ON external_workshops FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Solo admins pueden eliminar talleres"
ON external_workshops FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para external_repairs
CREATE POLICY "Usuarios autenticados pueden ver reparaciones externas"
ON external_repairs FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins y recepcionistas pueden crear reparaciones externas"
ON external_repairs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
  )
);

CREATE POLICY "Admins y recepcionistas pueden actualizar reparaciones externas"
ON external_repairs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
  )
);

CREATE POLICY "Solo admins pueden eliminar reparaciones externas"
ON external_repairs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- PARTE 6: FUNCIONES ÚTILES
-- ============================================

-- Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_external_workshops_updated_at ON external_workshops;
CREATE TRIGGER update_external_workshops_updated_at
  BEFORE UPDATE ON external_workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_repairs_updated_at ON external_repairs;
CREATE TRIGGER update_external_repairs_updated_at
  BEFORE UPDATE ON external_repairs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 7: DATOS DE EJEMPLO (OPCIONAL)
-- ============================================
-- Descomentar si quieres crear talleres de ejemplo

/*
INSERT INTO external_workshops (name, phone, contact_person, address, notes) VALUES
('Taller TechFix', '+57 300 123 4567', 'Carlos Gómez', 'Calle 10 #5-20', 'Especialistas en consolas Nintendo'),
('Reparaciones GamePro', '+57 301 987 6543', 'Ana Martínez', 'Carrera 15 #8-30', 'Expertos en PlayStation y Xbox'),
('Centro de Servicio Digital', '+57 302 555 1234', 'Luis Pérez', 'Avenida 20 #12-45', 'Reparaciones de alta complejidad');
*/

-- ============================================
-- PARTE 8: VISTAS ÚTILES
-- ============================================

-- Vista para ver reparaciones externas con información completa
CREATE OR REPLACE VIEW v_external_repairs_full AS
SELECT 
  er.id,
  er.service_order_id,
  so.order_number,
  so.device_type,
  so.device_brand,
  so.device_model,
  so.serial_number,
  c.full_name as customer_name,
  c.phone as customer_phone,
  ew.name as workshop_name,
  ew.phone as workshop_phone,
  ew.contact_person,
  er.sent_date,
  er.estimated_return_date,
  er.actual_return_date,
  er.external_status,
  er.external_cost,
  er.problem_sent,
  er.work_done,
  er.notes,
  sent_by.full_name as sent_by_name,
  received_by.full_name as received_by_name,
  er.created_at,
  er.updated_at
FROM external_repairs er
INNER JOIN service_orders so ON er.service_order_id = so.id
INNER JOIN customers c ON so.customer_id = c.id
INNER JOIN external_workshops ew ON er.workshop_id = ew.id
LEFT JOIN profiles sent_by ON er.sent_by_id = sent_by.id
LEFT JOIN profiles received_by ON er.received_by_id = received_by.id;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('external_workshops', 'external_repairs')
ORDER BY tablename;

-- Verificar estructura de external_workshops
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'external_workshops'
ORDER BY ordinal_position;

-- Verificar estructura de external_repairs
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'external_repairs'
ORDER BY ordinal_position;

-- Verificar que el nuevo estado 'outsourced' está disponible
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'service_orders_status_check';

-- ============================================
-- ROLLBACK (si necesitas deshacer)
-- ============================================
-- NO EJECUTAR a menos que quieras eliminar todo

/*
DROP VIEW IF EXISTS v_external_repairs_full;
DROP TABLE IF EXISTS external_repairs CASCADE;
DROP TABLE IF EXISTS external_workshops CASCADE;
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;
ALTER TABLE service_orders
ADD CONSTRAINT service_orders_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered'));
*/

-- ============================================
-- RESUMEN
-- ============================================
-- ✅ Nuevo estado 'outsourced' agregado a service_orders
-- ✅ Tabla external_workshops creada (talleres externos)
-- ✅ Tabla external_repairs creada (seguimiento de tercerizaciones)
-- ✅ Políticas RLS configuradas
-- ✅ Vista v_external_repairs_full creada
-- ✅ Triggers para updated_at configurados
-- ============================================
