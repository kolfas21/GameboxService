-- Módulo de Ventas Manuales
-- Ejecutar después de 01_init_database.sql y 02_init_policies.sql.

CREATE SEQUENCE IF NOT EXISTS manual_sales_invoice_seq START 1;

CREATE TABLE IF NOT EXISTS manual_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  client_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL DEFAULT auth.uid(),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  warranty_type TEXT DEFAULT 'Tienda',
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_days INTEGER CHECK (warranty_days IS NULL OR warranty_days >= 0),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro')),
  payment_detail TEXT,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  client_name TEXT NOT NULL,
  client_document TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT manual_sales_warranty_dates_check CHECK (
    warranty_end_date IS NULL
    OR warranty_start_date IS NULL
    OR warranty_end_date >= warranty_start_date
  ),
  CONSTRAINT manual_sales_cancel_check CHECK (
    status = 'active'
    OR (cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL AND NULLIF(TRIM(cancel_reason), '') IS NOT NULL)
  )
);

ALTER TABLE manual_sales
  ADD COLUMN IF NOT EXISTS warranty_type TEXT DEFAULT 'Tienda';

CREATE TABLE IF NOT EXISTS manual_sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manual_sale_id UUID REFERENCES manual_sales(id) ON DELETE CASCADE NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('new_console', 'used_console', 'accessory', 'other')),
  product_name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  warranty_months INTEGER CHECK (warranty_months IS NULL OR warranty_months >= 0),
  warranty_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT manual_sale_items_discount_lte_gross_check CHECK (discount <= quantity * unit_price),
  CONSTRAINT manual_sale_items_subtotal_calculated_check CHECK (subtotal = quantity * unit_price - discount)
);

-- Cada producto de una venta manual puede tener su propia garantía
-- (ej. una consola 12 meses, un control 1 mes). Columna aditiva y segura
-- para instalaciones existentes que ya tengan la tabla creada.
ALTER TABLE manual_sale_items
  ADD COLUMN IF NOT EXISTS warranty_months INTEGER;

CREATE TABLE IF NOT EXISTS manual_sale_whatsapp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manual_sale_id UUID REFERENCES manual_sales(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL DEFAULT auth.uid(),
  phone TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message TEXT NOT NULL,
  ticket_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider TEXT NOT NULL DEFAULT 'openwa',
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_manual_sale_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR TRIM(NEW.invoice_number) = '' THEN
    NEW.invoice_number := 'VM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('manual_sales_invoice_seq')::TEXT, 5, '0');
  END IF;

  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION recalculate_manual_sale_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_sale_id UUID;
BEGIN
  target_sale_id := COALESCE(NEW.manual_sale_id, OLD.manual_sale_id);

  UPDATE manual_sales
  SET
    subtotal = COALESCE((
      SELECT SUM(quantity * unit_price)
      FROM manual_sale_items
      WHERE manual_sale_id = target_sale_id
    ), 0),
    discount_total = COALESCE((
      SELECT SUM(discount)
      FROM manual_sale_items
      WHERE manual_sale_id = target_sale_id
    ), 0),
    total = COALESCE((
      SELECT SUM(subtotal)
      FROM manual_sale_items
      WHERE manual_sale_id = target_sale_id
    ), 0),
    updated_at = NOW()
  WHERE id = target_sale_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_manual_sale_invoice_number_trigger ON manual_sales;
CREATE TRIGGER set_manual_sale_invoice_number_trigger
  BEFORE INSERT ON manual_sales
  FOR EACH ROW
  EXECUTE FUNCTION set_manual_sale_invoice_number();

DROP TRIGGER IF EXISTS update_manual_sales_updated_at ON manual_sales;
CREATE TRIGGER update_manual_sales_updated_at
  BEFORE UPDATE ON manual_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_manual_sale_items_updated_at ON manual_sale_items;
CREATE TRIGGER update_manual_sale_items_updated_at
  BEFORE UPDATE ON manual_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_manual_sale_whatsapp_logs_updated_at ON manual_sale_whatsapp_logs;
CREATE TRIGGER update_manual_sale_whatsapp_logs_updated_at
  BEFORE UPDATE ON manual_sale_whatsapp_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS recalculate_manual_sale_totals_insert ON manual_sale_items;
CREATE TRIGGER recalculate_manual_sale_totals_insert
  AFTER INSERT ON manual_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_manual_sale_totals();

DROP TRIGGER IF EXISTS recalculate_manual_sale_totals_update ON manual_sale_items;
CREATE TRIGGER recalculate_manual_sale_totals_update
  AFTER UPDATE ON manual_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_manual_sale_totals();

DROP TRIGGER IF EXISTS recalculate_manual_sale_totals_delete ON manual_sale_items;
CREATE TRIGGER recalculate_manual_sale_totals_delete
  AFTER DELETE ON manual_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_manual_sale_totals();

CREATE INDEX IF NOT EXISTS idx_manual_sales_invoice_number ON manual_sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_manual_sales_client_id ON manual_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_manual_sales_user_id ON manual_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_sales_sale_date ON manual_sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_manual_sales_status ON manual_sales(status);
CREATE INDEX IF NOT EXISTS idx_manual_sale_items_sale_id ON manual_sale_items(manual_sale_id);
CREATE INDEX IF NOT EXISTS idx_manual_sale_items_serial_number ON manual_sale_items(serial_number);
CREATE INDEX IF NOT EXISTS idx_manual_sale_whatsapp_logs_sale_id ON manual_sale_whatsapp_logs(manual_sale_id);
CREATE INDEX IF NOT EXISTS idx_manual_sale_whatsapp_logs_status ON manual_sale_whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_manual_sale_whatsapp_logs_created_at ON manual_sale_whatsapp_logs(created_at DESC);

ALTER TABLE manual_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_sale_whatsapp_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.manual_sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.manual_sale_whatsapp_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE manual_sales_invoice_seq TO authenticated;

DROP POLICY IF EXISTS "manual_sales_select" ON manual_sales;
CREATE POLICY "manual_sales_select"
ON manual_sales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR profiles.role = 'technician'
      OR (profiles.role = 'receptionist' AND manual_sales.user_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "manual_sales_insert" ON manual_sales;
CREATE POLICY "manual_sales_insert"
ON manual_sales FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'receptionist')
  )
);

DROP POLICY IF EXISTS "manual_sales_update_cancel" ON manual_sales;
CREATE POLICY "manual_sales_update_cancel"
ON manual_sales FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "manual_sale_items_select" ON manual_sale_items;
CREATE POLICY "manual_sale_items_select"
ON manual_sale_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM manual_sales
    WHERE manual_sales.id = manual_sale_items.manual_sale_id
  )
);

DROP POLICY IF EXISTS "manual_sale_items_insert" ON manual_sale_items;
CREATE POLICY "manual_sale_items_insert"
ON manual_sale_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM manual_sales
    JOIN profiles ON profiles.id = auth.uid()
    WHERE manual_sales.id = manual_sale_items.manual_sale_id
    AND manual_sales.user_id = auth.uid()
    AND profiles.role IN ('admin', 'receptionist')
    AND manual_sales.status = 'active'
  )
);

DROP POLICY IF EXISTS "manual_sale_items_update_admin" ON manual_sale_items;
CREATE POLICY "manual_sale_items_update_admin"
ON manual_sale_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "manual_sale_items_delete_admin" ON manual_sale_items;
CREATE POLICY "manual_sale_items_delete_admin"
ON manual_sale_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "manual_sale_whatsapp_logs_select" ON manual_sale_whatsapp_logs;
CREATE POLICY "manual_sale_whatsapp_logs_select"
ON manual_sale_whatsapp_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM manual_sales
    JOIN profiles ON profiles.id = auth.uid()
    WHERE manual_sales.id = manual_sale_whatsapp_logs.manual_sale_id
    AND (
      profiles.role = 'admin'
      OR (profiles.role = 'receptionist' AND manual_sales.user_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "manual_sale_whatsapp_logs_insert_staff" ON manual_sale_whatsapp_logs;
CREATE POLICY "manual_sale_whatsapp_logs_insert_staff"
ON manual_sale_whatsapp_logs FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'receptionist')
  )
);

DROP POLICY IF EXISTS "manual_sale_whatsapp_logs_update_staff" ON manual_sale_whatsapp_logs;
CREATE POLICY "manual_sale_whatsapp_logs_update_staff"
ON manual_sale_whatsapp_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'receptionist')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'receptionist')
  )
);

COMMENT ON TABLE manual_sales IS 'Facturas de ventas manuales sin afectación de inventario';
COMMENT ON TABLE manual_sale_items IS 'Productos escritos manualmente para cada factura de venta';
COMMENT ON TABLE manual_sale_whatsapp_logs IS 'Historial de envíos de tickets de venta manual por WhatsApp';
COMMENT ON COLUMN manual_sales.client_name IS 'Copia histórica del nombre del cliente en el momento de facturar';
COMMENT ON COLUMN manual_sales.client_document IS 'Copia histórica del documento del cliente en el momento de facturar';
COMMENT ON COLUMN manual_sales.client_phone IS 'Copia histórica del celular del cliente en el momento de facturar';
