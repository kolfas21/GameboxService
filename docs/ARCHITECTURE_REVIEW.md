# ARCHITECTURE_REVIEW.md — Diagnóstico de Arquitectura GameboxServtc

> **Fecha:** 2026-06-19  
> Diagnóstico basado en inspección de estructura, tamaños de archivos e importaciones.

---

## Tabla de diagnóstico de problemas

| Prioridad | Problema | Archivo / Módulo | Riesgo | Recomendación |
|-----------|---------|-----------------|--------|---------------|
| 1 | **Componentes de página masivos** | `ServiceQueue.tsx` (64 KB), `ManualSalesPage.tsx` (50 KB), `CreateOrder.tsx` (50 KB), `Dashboard.tsx` (48 KB) | Crítico | Dividir en sub-componentes. Un archivo >40 KB mezcla UI, lógica y estado. |
| 2 | **Doble cliente Supabase** | `config/supabase.ts` + `infrastructure/supabase/supabaseClient.ts` + `lib/supabase.ts` | Alto | Existe re-exportación en `lib/supabase.ts` pero el servicio de impresión importa desde `config/supabase` directamente, creando acoplamiento inconsistente. |
| 3 | **Patrón de arquitectura mixto** | `hooks/` vs `application/use-cases/` + `infrastructure/repositories/` | Alto | La app tiene dos patrones de acceso a datos: hooks directos (todos los módulos) y Clean Architecture (solo servicio técnico). Duplica la responsabilidad y genera confusión. |
| 4 | **`useServiceOrders.ts` hace demasiado** | `hooks/useServiceOrders.ts` (425 líneas) | Alto | El hook maneja fetch, create, update, assign, complete, deliver, delete, realtime. Debería separarse por responsabilidad. |
| 5 | **`index.css` de 31 KB** | `src/index.css` | Medio | Un archivo CSS global de este tamaño con todos los estilos mezcla design system, utilidades, componentes y overrides de Bootstrap/Tailwind. |
| 6 | **Gestión de errores inconsistente** | `hooks/useServiceOrders.ts`, `hooks/useManualSales.ts` | Medio | `useServiceOrders` usa `setError + return false`, `useManualSales` usa `throw`. Dificulta el manejo en la UI. |
| 7 | **`presentation/` vacía** | `src/presentation/components/` | Bajo | La carpeta existe pero está vacía. Inconsistencia con la arquitectura declarada. |
| 8 | **Generación de `order_number` en el cliente** | `utils/orderNumber.ts` → `useServiceOrders.ts` | Alto | El número de orden se genera en el frontend. En producción puede causar duplicados bajo concurrencia. Debería generarse en la DB con una función PostgreSQL o trigger. |
| 9 | **Tipos `Database` en `lib/supabase.ts`** | `lib/supabase.ts` | Medio | Los tipos de la BD están definidos a mano en el código (no generados por `supabase gen types`). Si la BD cambia, los tipos quedan desactualizados silenciosamente. |
| 10 | **Sin `typecheck` en scripts** | `package.json` | Medio | No hay script `"typecheck"` separado. Solo `pnpm build` ejecuta TypeScript. En CI/CD conviene tener `tsc --noEmit`. |
| 11 | **`ComandaPreview.tsx` y `MultipleOrdersComandaPreview.tsx` muy grandes** | `ComandaPreview.tsx` (36 KB), `MultipleOrdersComandaPreview.tsx` (39 KB) | Medio | Ambos manejan lógica de construcción de HTML de impresión. Deberían delegarlo a helpers o templates. |
| 12 | **Dependencia QZ Tray sin fallback visible** | `qzPrinterService.ts` | Alto | Si QZ Tray no está abierto, el error solo llega al componente si este lo maneja. No hay un estado global de conexión/desconexión de QZ accesible en toda la app. |
| 13 | **`localStorage` para config de impresoras** | `qzPrinterService.ts`, `PRINTER_KEYS` | Medio | La config de impresora por `localStorage` es por navegador/PC, que es el comportamiento correcto. Sin embargo, las claves (`gamebox_ticket_printer`) no están centralizadas en `constants/`. |
| 14 | **Variables de entorno sin validación en runtime** | `config/validateConfig.ts` | Medio | Existe el archivo pero no se sabe si se ejecuta en todos los entornos de build. Validar que se llame desde `main.tsx`. |
| 15 | **`render.yaml` existe pero no es el deploy primario** | `render.yaml` + `package.json` script `render-build` usa `npm` no `pnpm` | Alto | El script `render-build` usa `npm install && npm run build` pero el proyecto usa `pnpm`. Puede causar diferencias en dependencias instaladas en producción. |
| 16 | **WhatsApp vía Edge Function sin retry** | `useManualSales.ts → sendWhatsappTicket()` | Medio | Si falla el envío de WhatsApp no hay mecanismo de reintento desde la UI. |
| 17 | **Realtime subscription en `useServiceOrders`** | `useRealtimeSubscription.ts` | Medio | La suscripción realtime se activa para todos los usuarios autenticados. Para técnicos, el hook filtra en el query pero el realtime puede recibir todos los cambios igualmente. |
| 18 | **`AutoRefreshIndicator` + `useAutoRefresh` posiblemente redundante** | `useAutoRefresh.ts` + `AutoRefreshIndicator.tsx` | Bajo | Con realtime activo, el auto-refresh por polling puede ser innecesario o conflictivo. |

---

## Resumen por categoría de riesgo

### 🔴 Crítico
- Componentes de página masivos (`ServiceQueue`, `ManualSalesPage`, `CreateOrder`, `Dashboard`)
- Generación de `order_number` en el cliente (riesgo de duplicados en producción)

### 🟠 Alto
- Patrón de arquitectura mixto (hooks directos vs Clean Architecture)
- `useServiceOrders.ts` con demasiadas responsabilidades
- Sin estado global de conexión QZ Tray
- Script `render-build` usa `npm` en lugar de `pnpm`
- Dos puntos de acceso al cliente Supabase (`config/supabase.ts` vs `infrastructure/`)

### 🟡 Medio
- `index.css` de 31 KB sin modularizar
- Tipos de BD definidos a mano (sin `supabase gen types`)
- Sin script `typecheck` separado
- Componentes de comandas muy grandes
- Claves de localStorage no centralizadas en `constants/`
- Sin retry en envío de WhatsApp

### 🟢 Bajo
- `presentation/components/` vacía (inconsistencia de estructura)
- Auto-refresh posiblemente redundante con realtime
- `presentation/contexts/` vacía

---

*Ver `APP_MAP.md` para el mapa completo de módulos y dependencias.*
