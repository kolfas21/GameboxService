# Guía de Configuración — Nueva Base de Datos en Supabase

Sigue estos pasos **en orden** para dejar un taller funcionando desde cero.  
Solo se necesitan **3 scripts SQL** y crear el primer usuario admin.

---

## Requisitos previos

- Cuenta en [supabase.com](https://supabase.com)
- Proyecto nuevo creado (**New Project**)
- Acceso al **SQL Editor** del proyecto (`Project → SQL Editor`)

---

## Paso 1 — Estructura de tablas, funciones y triggers

**SQL Editor → New query → pegar `01_init_database.sql` → Run**

Crea:
- Tablas: `profiles`, `customers`, `service_orders` (con campos de cobro incluidos), `company_settings`, `external_workshops`, `external_repairs`
- Función `current_user_role()` — evita recursión infinita en las políticas RLS
- Función `handle_new_user()` — crea el perfil automáticamente al registrar un usuario
- Triggers `updated_at` en todas las tablas
- Índices de rendimiento
- Vista `v_external_repairs_full`
- Fila inicial en `company_settings` con datos de ejemplo (editar antes de ejecutar si deseas)

> ✅ Resultado esperado: tabla listando las 6 tablas con estado `✅`

---

## Paso 2 — Seguridad: RLS + GRANTs

**SQL Editor → New query → pegar `02_init_policies.sql` → Run**

Habilita Row Level Security y crea todas las políticas. También ejecuta los `GRANT` base y, si la base de datos viene de una versión anterior, agrega automáticamente los campos de cobro a `service_orders`.

### Qué puede hacer cada rol:

| Tabla | Admin | Recepcionista | Técnico |
|---|---|---|---|
| `profiles` | Todo | Ver | Ver |
| `customers` | Todo | Ver + Crear | Ver |
| `service_orders` | Todo | Ver + Crear + Editar | Ver pendientes + sus asignadas |
| `company_settings` | Todo | Ver | Ver |
| `external_workshops` | Todo | Ver | Ver |
| `external_repairs` | Todo | Ver + Crear + Editar | Ver |

> ✅ Resultado esperado: tablas listando las políticas activas por tabla

---

## Paso 3 — Storage para logos

**SQL Editor → New query → pegar `03_setup_storage.sql` → Run**

Crea:
- Bucket `company-assets` (público, máx. 10 MB, acepta JPEG/PNG/GIF/WebP/SVG)
- Políticas de acceso: lectura pública, subir/editar/borrar solo usuarios autenticados

> ✅ Resultado esperado: bucket `company-assets` visible en **Storage → Buckets**

---

## Paso 4 — Crear el primer usuario administrador

1. En Supabase: **Authentication → Users → Add user → Create new user**
2. Escribe el email y contraseña del admin → **Create user**
3. Espera unos segundos (el trigger `handle_new_user` crea el perfil automáticamente)
4. **SQL Editor → New query** → ejecutar (cambiando el email):

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Nombre del Administrador'
WHERE email = 'correo@del.admin.com';
```

5. Verificar:

```sql
SELECT id, email, full_name, role FROM profiles;
```

> ✅ El usuario debe aparecer con `role = admin`

---

## Paso 5 — Conectar la aplicación

En Supabase: **Settings → API** → copiar:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Project URL (ej. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

Crear/editar `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Iniciar la app:

```bash
npm run dev
```

---

## Paso 6 — Configurar datos del taller

Iniciar sesión con el admin → **Configuración** en el menú lateral → editar:

- Nombre del taller, logo, colores
- Datos de contacto (teléfono, email, dirección, redes sociales)
- Horario de atención

---

## Estructura de campos en service_orders

| Campo | Quién lo completa | Cuándo |
|---|---|---|
| `repair_result` | Técnico | Al marcar como "completada" |
| `repair_cost` | Admin / Recepcionista | Al entregar al cliente |
| `payment_method` | Admin / Recepcionista | Al entregar al cliente |
| `payment_collected_by_id` | Auto (usuario actual) | Al entregar al cliente |

---

## Errores comunes y soluciones

### `permission denied for table users` (código 42501)
**Causa:** Políticas RLS obsoletas que hacen `SELECT FROM auth.users` directamente.  
**Solución:** Asegúrate de haber ejecutado `02_init_policies.sql` en su versión actual (v3.1+). Si el error persiste, verifica con:

```sql
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%auth.users%' OR with_check LIKE '%auth.users%');
```

Si devuelve filas, ejecutar `DROP POLICY IF EXISTS "<nombre>" ON <tabla>;` para cada una.

### `Invalid Refresh Token`
Supabase cerró la sesión por token expirado/revocado. Es normal. La app lo maneja automáticamente limpiando el estado de auth y redirigiendo al login.

### Perfil no creado automáticamente
Si el trigger `handle_new_user` no corrió (usuario creado antes de ejecutar `01_init_database.sql`), insertar el perfil manualmente:

```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Nombre', 'admin'
FROM auth.users
WHERE email = 'correo@del.admin.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```


---

## Requisitos previos

- Cuenta en [supabase.com](https://supabase.com)
- Proyecto nuevo creado en Supabase (botón **New Project**)
- Acceso al **SQL Editor** del proyecto

---

## Paso 1 — Crear la estructura de tablas, funciones y triggers

Ve a **SQL Editor → New Query**, pega el contenido de `01_init_database.sql` y ejecuta.

Esto crea:
- Tablas: `profiles`, `customers`, `service_orders`, `company_settings`, `external_workshops`, `external_repairs`
- Función `current_user_role()` — **crítica**, evita recursión infinita en las políticas RLS
- Función `handle_new_user()` — crea el perfil automáticamente cuando alguien se registra
- Triggers `updated_at` en todas las tablas
- Índices de rendimiento
- Vista `v_external_repairs_full`
- Configuración inicial de la empresa (editar los datos en ese mismo script antes de ejecutar)

> ✅ Resultado esperado: aparece una tabla con todas las tablas marcadas como creadas.

---

## Paso 2 — Habilitar RLS y crear todas las políticas de seguridad

Nueva query → pega `02_init_policies.sql` y ejecuta.

### Resumen de políticas creadas:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Cualquier usuario autenticado | Solo admin | Propio perfil o admin | — |
| `customers` | Cualquier usuario autenticado | Admin y recepcionista | Solo admin | Solo admin |
| `service_orders` | Admin/recepcionista: todas. Técnico: pendientes + sus asignadas | Admin y recepcionista | Admin, recepcionista, técnico asignado | Solo admin |
| `company_settings` | Público (sin login) | Solo admin | Solo admin | Solo admin |
| `external_workshops` | Cualquier usuario autenticado | Solo admin | Solo admin | Solo admin |
| `external_repairs` | Cualquier usuario autenticado | Admin y recepcionista | Admin y recepcionista | Solo admin |

> ✅ Resultado esperado: aparece una tabla con todas las políticas por tabla.

---

## Paso 3 — Configurar Storage para logos

Nueva query → pega `03_setup_storage.sql` y ejecuta.

Esto crea:
- Bucket `company-assets` (público, máx. 10 MB, acepta JPEG/PNG/GIF/WebP/SVG)
- 4 políticas de storage (ver público, subir/actualizar/eliminar: usuarios autenticados)

> ✅ Resultado esperado: bucket `company-assets` aparece en **Storage** del dashboard.

---

## Paso 4 — Agregar campos de cobro a service_orders

Nueva query → pega `add_payment_fields.sql` y ejecuta.

Agrega a `service_orders`:
- `repair_result` — si la consola fue reparada o no (`repaired` / `not_repaired`)
- `repair_cost` — monto cobrado al cliente
- `payment_method` — método de pago (`efectivo` / `transferencia` / `tarjeta` / `otro`)
- `payment_collected_by_id` — quién registró el cobro

> ✅ Resultado esperado: lista los 4 campos con sus tipos de datos.

---

## Paso 5 — Fix de políticas para técnicos (ver órdenes pendientes)

Nueva query → pega `fix_technician_view_orders.sql` y ejecuta.

Reemplaza las políticas `SELECT` y `UPDATE` de `service_orders` con la versión correcta que permite a los técnicos:
- Ver **todas las órdenes pendientes** (para poder tomarlas)
- Ver y actualizar **sus propias órdenes asignadas**
- No ver órdenes tercerizadas ni asignadas a otros técnicos

> ✅ Resultado esperado: "Fixes aplicados exitosamente".

---

## Paso 6 — Crear el primer usuario administrador

1. En Supabase ve a **Authentication → Users → Add user → Create new user**
2. Escribe el email y contraseña del administrador y crea el usuario
3. Espera unos segundos (el trigger `handle_new_user` crea el perfil automáticamente con rol `technician` por defecto)
4. Ve a **SQL Editor** y ejecuta la siguiente query cambiando el email:

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Nombre del Admin'
WHERE email = 'correo@del.admin.com';
```

5. Verifica:

```sql
SELECT id, email, full_name, role FROM profiles;
```

> ✅ El usuario debe aparecer con `role = admin`.

---

## Paso 7 — Conectar la aplicación

En el proyecto de Supabase ve a **Settings → API** y copia:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

Crea o edita el archivo `.env` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Luego ejecuta:

```bash
npm run dev
```

---

## Paso 8 — Configurar los datos del taller

Inicia sesión con el usuario admin y ve a **Configuración** en el menú lateral. Desde ahí puedes editar:

- Nombre del taller
- Logo
- Teléfono, email, dirección
- Redes sociales
- Funcionalidades habilitadas (Garantía, Talleres externos)
- Campos obligatorios en órdenes

---

## Verificación final

Ejecuta esta query para confirmar que todo está en orden:

```sql
-- Tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  AND tablename IN ('profiles','customers','service_orders','company_settings','external_workshops','external_repairs')
ORDER BY tablename;

-- Funciones críticas
SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('current_user_role','handle_new_user','update_updated_at_column');

-- Total de políticas RLS
SELECT tablename, COUNT(*) as politicas
FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename ORDER BY tablename;

-- Bucket de storage
SELECT id, name, public FROM storage.buckets WHERE id = 'company-assets';

-- Columnas de cobro en service_orders
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'service_orders'
  AND column_name IN ('repair_result','repair_cost','payment_method','payment_collected_by_id');
```

**Resultado esperado:**
- 6 tablas
- 3 funciones
- Al menos 3 políticas por tabla
- 1 bucket `company-assets` con `public = true`
- 4 columnas de cobro

---

## Orden de ejecución rápida

```
01_init_database.sql
02_init_policies.sql
03_setup_storage.sql
add_payment_fields.sql
fix_technician_view_orders.sql
→ Crear usuario admin manualmente
→ UPDATE profiles SET role = 'admin' WHERE email = '...'
→ Editar .env con URL y clave del nuevo proyecto
```
