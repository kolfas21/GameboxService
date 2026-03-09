-- ============================================
-- CREAR USUARIO ADMINISTRADOR
-- ============================================
-- Ejecutar este script en Supabase SQL Editor después de crear las tablas

-- Método 1: Crear usuario manualmente en Authentication > Users y luego ejecutar:
UPDATE profiles SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@gameboxservice.com');

-- Si el perfil no existe, crearlo:
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'Administrador', 
  'admin'
FROM auth.users 
WHERE email = 'admin@gameboxservice.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.users.id);

-- ============================================
-- VERIFICAR USUARIO CREADO
-- ============================================
SELECT 
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmado,
    p.full_name,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@gameboxservice.com';

-- ============================================
-- CREDENCIALES:
-- Email: admin@gameboxservice.com
-- Password: admin123
-- ============================================