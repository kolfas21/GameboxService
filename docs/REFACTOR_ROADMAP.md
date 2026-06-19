# REFACTOR_ROADMAP.md — Hoja de ruta de refactorización

> **Fecha:** 2026-06-19  
> Organizado por prioridad y riesgo. Aplicar en orden. No saltar pasos.

---

## 1. Correcciones críticas

### 1.1 — Centralizar claves de `localStorage` para impresoras

| | |
|--|--|
| **Objetivo** | Mover las claves `gamebox_ticket_printer` y `gamebox_sticker_printer` a `constants/index.ts` |
| **Archivos afectados** | `services/qzPrinterService.ts`, `constants/index.ts` |
| **Nivel de riesgo** | Bajo |
| **Beneficio** | Evita cadenas mágicas duplicadas si se agregan más tipos de impresora |
| **Prueba manual** | Configurar impresora, recargar, verificar que sigue guardada |
| **Seguridad en producción** | ✅ Seguro — solo renombra constante interna |
| **APP_MAP.md requiere actualización** | No (no cambia estructura de módulos) |

---

### 1.2 — Agregar script `typecheck` en `package.json`

| | |
|--|--|
| **Objetivo** | `"typecheck": "tsc --noEmit"` para validar TypeScript sin compilar |
| **Archivos afectados** | `package.json` |
| **Nivel de riesgo** | Ninguno |
| **Beneficio** | CI/CD más rápido; permite detectar errores TS sin rebuild completo |
| **Prueba manual** | `pnpm typecheck` debe mostrar 0 errores |
| **Seguridad en producción** | ✅ Seguro — no modifica código |
| **APP_MAP.md requiere actualización** | No |

---

### 1.3 — Corregir script `render-build` para usar `pnpm`

| | |
|--|--|
| **Objetivo** | Cambiar `"render-build": "npm install && npm run build"` a `pnpm install && pnpm build` |
| **Archivos afectados** | `package.json`, `render.yaml` |
| **Nivel de riesgo** | Medio — afecta producción en Render |
| **Beneficio** | Consistencia entre desarrollo y producción; evita diferencias en lock file |
| **Prueba manual** | Hacer deploy en Render y verificar build exitoso |
| **Seguridad en producción** | ⚠️ Verificar que Render tenga `pnpm` disponible (v8+) |
| **APP_MAP.md requiere actualización** | No |

---

## 2. Limpieza de estructura segura

### 2.1 — Limpiar carpetas vacías

| | |
|--|--|
| **Objetivo** | Eliminar o documentar `presentation/components/` (vacía) y `presentation/contexts/` (vacía) |
| **Archivos afectados** | `src/presentation/components/`, `src/presentation/contexts/` |
| **Nivel de riesgo** | Bajo |
| **Beneficio** | Evita confusión sobre arquitectura esperada |
| **Prueba manual** | `pnpm build` sin errores |
| **Seguridad en producción** | ✅ Seguro |
| **APP_MAP.md requiere actualización** | Sí — actualizar sección de estructura |

---

### 2.2 — Crear `PRINTER_STORAGE_KEYS` en `constants/index.ts`

| | |
|--|--|
| **Objetivo** | Añadir las claves de impresora al archivo de constantes ya existente |
| **Archivos afectados** | `constants/index.ts`, `services/qzPrinterService.ts` |
| **Nivel de riesgo** | Bajo |
| **Beneficio** | Una sola fuente de verdad para las claves de almacenamiento |
| **Prueba manual** | Imprimir ticket y sticker de prueba desde `Settings` |
| **Seguridad en producción** | ✅ Seguro |
| **APP_MAP.md requiere actualización** | No |

---

## 3. Separación de lógica de negocio

### 3.1 — Extraer sub-componentes de `ManualSalesPage.tsx`

| | |
|--|--|
| **Objetivo** | Dividir el archivo de 50 KB en `SaleForm`, `SaleItemList`, `SaleSummary`, `SaleHistoryList` |
| **Archivos afectados** | `components/ManualSalesPage.tsx` + nuevos sub-componentes |
| **Nivel de riesgo** | Medio — afecta el módulo POS crítico |
| **Beneficio** | Más fácil de mantener, probar y extender |
| **Prueba manual** | Crear venta completa con múltiples productos, descuentos y pago mixto; imprimir ticket |
| **Seguridad en producción** | Hacer en rama separada y validar con QA antes de merge |
| **APP_MAP.md requiere actualización** | Sí |

---

### 3.2 — Extraer sub-componentes de `ServiceQueue.tsx`

| | |
|--|--|
| **Objetivo** | Dividir el archivo de 64 KB en `OrderCard`, `OrderFilters`, `OrderStatusBadge`, `TechnicianAssignModal` |
| **Archivos afectados** | `components/ServiceQueue.tsx` + nuevos sub-componentes |
| **Nivel de riesgo** | Medio — módulo principal de órdenes |
| **Beneficio** | Legibilidad y mantenimiento |
| **Prueba manual** | Crear, asignar, completar y entregar una orden; imprimir comanda |
| **Seguridad en producción** | Hacer en rama separada |
| **APP_MAP.md requiere actualización** | Sí |

---

### 3.3 — Separar `useServiceOrders.ts` por responsabilidad

| | |
|--|--|
| **Objetivo** | Separar en `useServiceOrdersQuery` (lectura) y `useServiceOrdersMutations` (escritura) |
| **Archivos afectados** | `hooks/useServiceOrders.ts` |
| **Nivel de riesgo** | Medio |
| **Beneficio** | Mejor separación de lectura/escritura; más fácil de testear |
| **Prueba manual** | Flujo completo de orden: crear → asignar → completar → entregar |
| **Seguridad en producción** | Requiere refactorizar todos los componentes que usan el hook |
| **APP_MAP.md requiere actualización** | Sí |

---

## 4. Mejoras en la capa de servicios

### 4.1 — Estado global de conexión QZ Tray

| | |
|--|--|
| **Objetivo** | Crear un contexto o hook `useQzConnection` que exponga el estado de conexión globalmente |
| **Archivos afectados** | `services/qzPrinterService.ts` + nuevo `contexts/QzContext.tsx` o `hooks/useQzConnection.ts` |
| **Nivel de riesgo** | Bajo-Medio |
| **Beneficio** | El vendedor puede ver en toda la app si QZ Tray está conectado antes de intentar imprimir |
| **Prueba manual** | Cerrar QZ Tray, verificar indicador visible en UI; abrir, verificar actualización |
| **Seguridad en producción** | ✅ No afecta lógica de impresión, solo agrega indicador |
| **APP_MAP.md requiere actualización** | Sí |

---

### 4.2 — Migrar `order_number` a PostgreSQL

| | |
|--|--|
| **Objetivo** | Crear trigger o sequence en PostgreSQL para generar `order_number` en la BD |
| **Archivos afectados** | `utils/orderNumber.ts`, `hooks/useServiceOrders.ts`, SQL de migración |
| **Nivel de riesgo** | Alto — afecta consecutivos de producción |
| **Beneficio** | Elimina riesgo de duplicados bajo concurrencia |
| **Prueba manual** | Crear múltiples órdenes simultáneas, verificar que no hay `order_number` duplicado |
| **Seguridad en producción** | Requiere migración de BD en Supabase + aprobación explícita |
| **APP_MAP.md requiere actualización** | No (flujo externo) |

---

### 4.3 — Tipos generados por `supabase gen types`

| | |
|--|--|
| **Objetivo** | Reemplazar tipos manuales en `lib/supabase.ts` con tipos generados por Supabase CLI |
| **Archivos afectados** | `lib/supabase.ts` + nuevo archivo `src/types/database.types.ts` |
| **Nivel de riesgo** | Medio |
| **Beneficio** | Tipos siempre sincronizados con la BD real |
| **Prueba manual** | `pnpm typecheck` sin errores después de generar |
| **Seguridad en producción** | Requiere revisar que todos los imports de tipos de DB sigan funcionando |
| **APP_MAP.md requiere actualización** | No |

---

## 5. Mejoras en el módulo de impresión

### 5.1 — Reducir tamaño de `ComandaPreview.tsx` y `MultipleOrdersComandaPreview.tsx`

| | |
|--|--|
| **Objetivo** | Extraer la construcción del HTML de comanda a `utils/printHelpers.ts` o helpers dedicados |
| **Archivos afectados** | `ComandaPreview.tsx`, `MultipleOrdersComandaPreview.tsx`, `utils/printHelpers.ts` |
| **Nivel de riesgo** | Medio |
| **Beneficio** | Separar "qué imprimir" de "cómo renderizar la previsualización" |
| **Prueba manual** | Imprimir comanda y sticker de servicio; verificar formato correcto |
| **Seguridad en producción** | Hacer prueba visual completa en modo preview |
| **APP_MAP.md requiere actualización** | No |

---

## 6. Mejoras de UI/UX

### 6.1 — Indicador visual de estado QZ Tray

| | |
|--|--|
| **Objetivo** | Mostrar ícono/badge en `Layout.tsx` que indique si QZ Tray está conectado |
| **Archivos afectados** | `components/Layout.tsx`, `hooks/useQzConnection.ts` (nuevo) |
| **Nivel de riesgo** | Bajo |
| **Beneficio** | El vendedor sabe antes de imprimir si habrá problema |
| **Prueba manual** | Conectar/desconectar QZ Tray y verificar cambio en indicador |
| **Seguridad en producción** | ✅ Seguro — solo visual |
| **APP_MAP.md requiere actualización** | Sí |

---

### 6.2 — Modularizar `index.css`

| | |
|--|--|
| **Objetivo** | Dividir en módulos: `base.css`, `components.css`, `utilities.css`, `print.css` |
| **Archivos afectados** | `src/index.css` |
| **Nivel de riesgo** | Bajo |
| **Beneficio** | Más fácil de mantener y localizar estilos relacionados con impresión |
| **Prueba manual** | Revisar visualmente todas las páginas después del cambio |
| **Seguridad en producción** | ✅ Si se importan todos los módulos correctamente |
| **APP_MAP.md requiere actualización** | No |

---

## 7. Validación de build y producción

### 7.1 — Validar build completo

```bash
pnpm install
pnpm build
```

### 7.2 — Validar TypeScript (después de agregar script)

```bash
pnpm typecheck
```

### 7.3 — Verificar lint

```bash
pnpm lint
```

### 7.4 — Prueba local

```bash
pnpm dev
```

### 7.5 — Verificar deploy en Render

- Confirmar que `render.yaml` apunta al branch correcto.
- Verificar variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Render.
- Verificar que `render-build` usa `pnpm` (ver ítem 1.3).

---

## Resumen de prioridades

| # | Tarea | Riesgo | Impacto | Estado |
|---|-------|--------|---------|--------|
| 1.1 | Centralizar claves localStorage | Bajo | Bajo | Pendiente |
| 1.2 | Script `typecheck` | Ninguno | Medio | **APLICADO** |
| 1.3 | Corregir `render-build` con pnpm | Medio | Alto | Pendiente |
| 2.1 | Limpiar carpetas vacías | Bajo | Bajo | Pendiente |
| 2.2 | `PRINTER_STORAGE_KEYS` en constants | Bajo | Bajo | Pendiente |
| 3.1 | Dividir `ManualSalesPage.tsx` | Medio | Alto | Pendiente |
| 3.2 | Dividir `ServiceQueue.tsx` | Medio | Alto | Pendiente |
| 3.3 | Separar `useServiceOrders.ts` | Medio | Medio | Pendiente |
| 4.1 | Estado global QZ Tray | Bajo-Medio | Medio | Pendiente |
| 4.2 | Migrar order_number a PostgreSQL | Alto | Alto | Pendiente |
| 4.3 | Tipos generados Supabase | Medio | Medio | Pendiente |
| 5.1 | Reducir ComandaPreview | Medio | Bajo | Pendiente |
| 6.1 | Indicador QZ Tray en UI | Bajo | Medio | Pendiente |
| 6.2 | Modularizar index.css | Bajo | Bajo | Pendiente |
