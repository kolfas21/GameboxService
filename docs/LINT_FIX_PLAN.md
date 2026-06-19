# LINT_FIX_PLAN.md — Plan de corrección de lint

> **Fecha:** 2026-06-19  
> Estado inicial: 109 problemas (102 errores, 7 warnings)

---

## 1. Resumen actual

| Métrica | Valor |
|---------|-------|
| Total problemas | 109 |
| Errores | 102 |
| Warnings | 7 |
| Archivos afectados | ~20 |

---

## 2. Categorías de errores

| Categoría | Regla ESLint | Cantidad aprox. |
|-----------|-------------|----------------|
| Tipos `any` explícitos | `@typescript-eslint/no-explicit-any` | ~75 |
| Hooks condicionales | `react-hooks/rules-of-hooks` | ~4 |
| Declaraciones en case sin bloque | `no-case-declarations` | 3 |
| Escapes innecesarios en regex | `no-useless-escape` | 6 |
| Control chars en regex | `no-control-regex` | 1 |
| Try/catch innecesario | `no-useless-catch` | 4 |
| Fast Refresh (exports mixtos) | `react-refresh/only-export-components` | ~4 |
| Dependencias faltantes | `react-hooks/exhaustive-deps` | 7 (warnings) |

---

## 3. Archivos afectados por categoría

| Categoría | Archivos |
|-----------|---------|
| Hooks condicionales | `PendingInvitesList.tsx`, `PendingInvitesMigration.tsx` |
| no-case-declarations | `Dashboard.tsx` |
| Regex | `sanitization.ts`, `validation.ts` |
| Fast Refresh | `ProtectedRoute.tsx`, `AuthContext.tsx`, `RouterContext.tsx` |
| no-useless-catch | `technicianStatsService.ts` |
| any (utils/services) | `errorHandler.ts`, `logger.ts`, `qzPrinterService.ts`, `technicianStatsService.ts`, `useUsers.ts`, `validation.ts` |
| any (components) | `CreateOrder.tsx`, `CustomerSearch.tsx`, `Dashboard.tsx`, `ManualSalesPage.tsx`, `ServiceQueue.tsx`, `DeliverySection.tsx`, `WarrantySearch.tsx`, `InviteAcceptance.tsx`, `InviteUser.tsx`, `PendingInvitesList.tsx`, `PendingInvitesMigration.tsx`, `TechniciansManagement.tsx`, `UserDiagnostic.tsx`, `DatabaseDiagnostic.tsx`, `ExternalWorkshops.tsx`, `ServiceOrderTest.tsx`, `AuthContext.tsx` |
| exhaustive-deps | `DatabaseDiagnostic.tsx`, `Layout.tsx`, `useCompanySettings.ts`, `useCustomers.ts`, `useManualSales.ts`, `useServiceOrders.ts` |

---

## 4. Orden de corrección

| Orden | Categoría | Archivos | Riesgo | Estrategia | Validación |
|-------|----------|---------|--------|-----------|-----------|
| 1 | React Hooks condicionales | `PendingInvitesList.tsx`, `PendingInvitesMigration.tsx` | Bajo | Mover hooks al top antes de early returns | `pnpm lint -- <files>` |
| 2 | no-case-declarations | `Dashboard.tsx` | Bajo | Envolver case en `{}` | `pnpm lint -- Dashboard.tsx` |
| 3 | no-useless-catch | `technicianStatsService.ts` | Bajo | Eliminar try/catch innecesarios | `pnpm lint -- <file>` |
| 4 | Regex lint | `sanitization.ts`, `validation.ts` | Bajo | Reescribir regex sin escapes/control chars innecesarios | `pnpm lint -- <files>` |
| 5 | Fast Refresh | `ProtectedRoute.tsx`, `AuthContext.tsx`, `RouterContext.tsx` | Medio | Mover exports no-componente a archivos companion | `pnpm lint -- <files>` |
| 6 | `any` en utils/services | `errorHandler.ts`, `logger.ts`, `qzPrinterService.ts`, `technicianStatsService.ts`, `useUsers.ts`, `validation.ts` | Bajo-Medio | Usar `unknown`, tipos genéricos | `pnpm lint -- <files>` |
| 7A | `any` en componentes (grupo A) | `CreateOrder.tsx`, `CustomerSearch.tsx`, `DeliverySection.tsx`, `WarrantySearch.tsx` | Medio | Usar tipos de dominio existentes | `pnpm lint -- <files>` |
| 7B | `any` en componentes (grupo B) | `ManualSalesPage.tsx`, `ServiceQueue.tsx`, `ServiceOrderTest.tsx` | Medio | Usar tipos de dominio existentes | `pnpm lint -- <files>` |
| 7C | `any` en componentes (grupo C) | `DatabaseDiagnostic.tsx`, `ExternalWorkshops.tsx`, `InviteAcceptance.tsx`, `InviteUser.tsx`, `PendingInvitesList.tsx`, `PendingInvitesMigration.tsx`, `TechniciansManagement.tsx`, `UserDiagnostic.tsx` | Bajo | Usar interfaces locales o `unknown` | `pnpm lint -- <files>` |
| 8 | exhaustive-deps (warnings) | `DatabaseDiagnostic.tsx`, `Layout.tsx`, hooks | Medio | `useCallback` + revisión cuidadosa | `pnpm lint` |
| 9 | Validación final | Todos | — | `pnpm lint && pnpm typecheck && pnpm build` | Full |

---

## 5. Riesgo por categoría

| Categoría | Riesgo | Razón |
|-----------|--------|-------|
| Hooks condicionales | Bajo | Reordenar sin cambiar lógica |
| no-case-declarations | Bajo | Solo agrega `{}` al case |
| no-useless-catch | Bajo | Elimina wrapping redundante |
| Regex | Bajo | Misma semántica, distinta escritura |
| Fast Refresh | Medio | Puede requerir mover código a nuevos archivos |
| any en utils | Bajo-Medio | Cambio de tipo sin lógica |
| any en componentes | Medio | Requiere identificar tipos correctos |
| exhaustive-deps | Medio | Riesgo de loops infinitos si se agrega dep incorrecta |

---

## 6. Estado de ejecución

| Batch | Estado | Resultado |
|-------|--------|-----------|
| 1 - Hooks condicionales | ✅ Aplicado | PendingInvitesList + PendingInvitesMigration corregidos |
| 2 - no-case-declarations | ✅ Aplicado | Dashboard.tsx corregido |
| 3 - no-useless-catch | ✅ Aplicado | technicianStatsService.ts corregido |
| 4 - Regex | ✅ Aplicado | sanitization.ts + validation.ts corregidos |
| 5 - Fast Refresh | ✅ Aplicado | AuthContext.tsx + RouterContext.tsx + ProtectedRoute.tsx corregidos |
| 6 - any utils/services | ✅ Aplicado | errorHandler, logger, qzPrinterService, technicianStatsService, useUsers corregidos |
| 7A - any componentes A | ✅ Aplicado | CreateOrder, CustomerSearch, DeliverySection, WarrantySearch |
| 7B - any componentes B | ✅ Aplicado | ManualSalesPage, ServiceQueue, ServiceOrderTest |
| 7C - any componentes C | ✅ Aplicado | Resto de componentes |
| 8 - exhaustive-deps | ✅ Aplicado | Warnings resueltos o documentados |
| 9 - Validación final | ✅ Aplicado | Linting limpio y regresiones de TypeScript corregidas. pnpm build exitoso. |

---

## 7. Reglas para prevenir recurrencia

- Ejecutar `pnpm validate` antes de commit o push.
- No llamar hooks condicionalmente — todos los hooks deben ir antes de cualquier `return`.
- No usar `any`; preferir `unknown`, interfaces locales o tipos de dominio de `src/types/`.
- No exportar no-componentes desde archivos de componentes React (Fast Refresh).
- No silenciar ESLint globalmente con `eslint-disable`.
- No agregar dependencias a `useEffect` sin verificar que no causen loops infinitos.
- Actualizar `docs/APP_MAP.md` cuando cambie estructura o flujos.

---

## 8. Warnings de exhaustive-deps — Decisiones documentadas

| Hook | Decisión | Razón |
|------|---------|-------|
| `useServiceOrders` — `fetchServiceOrders` en `useEffect` | useCallback aplicado | Estabilizar referencia |
| `useManualSales` — `validateSale` en `createSale` | Mover dentro del callback | No es hook, es función pura |
| `useCompanySettings` — load en useEffect | useCallback aplicado | Estabilizar referencia |
| `useCustomers` — funciones en useEffect | useCallback aplicado | Estabilizar referencia |
