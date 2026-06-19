# SCALABLE_STRUCTURE_PLAN.md — Plan de estructura escalable

> **Fecha:** 2026-06-19  
> Este documento describe la estructura actual, la estructura objetivo y la estrategia de migración.  
> **No se aplica ningún cambio aquí. Es solo documentación y planificación.**

---

## 1. Resumen de estructura actual

```text
src/
  App.tsx                    # OK — Raíz compacta
  main.tsx                   # OK — Entry point
  index.css                  # ⚠️ Demasiado grande (31 KB)
  application/               # Capa de aplicación (use cases, DTOs) — solo para servicio técnico
  components/                # ⚠️ Mezcla páginas completas + componentes UI + modales
    ui/                      # OK — Componentes base reutilizables
    auth/                    # OK — Guards de autenticación
    [30+ archivos de página] # ⚠️ Páginas masivas sin subdivisión
  config/                    # OK — Configuración de entorno
  constants/                 # OK — Constantes centralizadas
  contexts/                  # OK — AuthContext + RouterContext
  domain/                    # OK — Entidades y contratos (solo servicio técnico)
  hooks/                     # ⚠️ Hooks de acceso a datos + lógica de negocio mezclados
  infrastructure/            # OK — Repositorios Supabase (solo servicio técnico)
  lib/                       # OK — Re-exportación del cliente Supabase
  presentation/              # ⚠️ Vacía (contextos y componentes de presentación sin uso)
  services/                  # OK — QZ Tray + stats técnicos
  types/                     # OK — Barrel de tipos
  utils/                     # OK — Utilidades puras
```

---

## 2. Estructura futura propuesta

```text
src/
  App.tsx
  main.tsx
  index.css                        # Dividir en módulos CSS si crece más

  features/                        # Un directorio por feature de negocio
    service-orders/                # Órdenes de servicio técnico
      components/                  # ServiceQueue, CreateOrder, EditOrderModal, DeliverySection
      hooks/                       # useServiceOrders, useRealtimeSubscription
      types/                       # ServiceOrder, ServiceStatus, etc.
    manual-sales/                  # Ventas manuales (POS)
      components/                  # ManualSalesPage y sub-componentes
      hooks/                       # useManualSales
      types/                       # ManualSale, ManualSaleItem, etc.
    customers/                     # Clientes
      components/                  # CustomerSearch
      hooks/                       # useCustomers
    warranties/                    # Garantías
      components/                  # WarrantySearch
    printing/                      # Impresión (tickets, stickers, comandas)
      services/                    # qzPrinterService
      components/                  # ComandaPreview, CommandaPrint, MultipleOrdersComandaPreview
      constants/                   # PRINT_SETTINGS (mover desde constants/)
    external-workshops/            # Talleres externos
      components/                  # ExternalWorkshops
      hooks/                       # useExternalWorkshops, useExternalRepairs
    caja/                          # Caja/corte del día
      components/                  # CajaPage
    dashboard/                     # Dashboard
      components/                  # Dashboard

  shared/                          # Todo lo reutilizable entre features
    components/                    # UI (Badge, Button, Card, etc.) + Layout + PageRenderer
    hooks/                         # useAutoRefresh, useImageToBase64, useModal, useDynamicPageInfo
    utils/                         # dateFormatter, errorHandler, imageConverter, etc.
    types/                         # Barrel de tipos compartidos
    constants/                     # constants/index.ts (menos los de printing)

  auth/                            # Autenticación
    components/                    # Login, InviteAcceptance, ProtectedRoute
    contexts/                      # AuthContext
    hooks/                         # (futuros hooks de auth)

  settings/                        # Configuración
    components/                    # Settings, PrinterSettings, UserManagement, TechniciansManagement
    hooks/                         # useCompanySettings, useUsers

  contexts/                        # RouterContext (o mover a shared/)

  config/                          # Configuración de entorno (sin cambios)
  lib/                             # Cliente Supabase (sin cambios)

  domain/                          # Entidades + contratos (mantener o expandir)
  application/                     # Use cases + DTOs (mantener o expandir)
  infrastructure/                  # Repositorios Supabase (mantener o expandir)
```

---

## 3. Qué debe quedarse igual (no tocar)

| Elemento | Razón |
|----------|-------|
| `config/supabase.ts` + `lib/supabase.ts` + `infrastructure/supabase/supabaseClient.ts` | Funciona y es estable; refactorizar requiere validar todos los imports |
| `domain/entities/` | Entidades bien definidas; no romper contratos |
| `contexts/AuthContext.tsx` | Estable, toda la app depende de él |
| `contexts/RouterContext.tsx` | Estable, navegación funcional |
| `constants/index.ts` | Buenas prácticas ya aplicadas |
| `utils/*.ts` | Funciones puras, sin riesgo |
| `services/qzPrinterService.ts` | Crítico para impresión; mover pero no refactorizar aún |

---

## 4. Qué puede moverse más adelante (sin urgencia)

| Elemento | Destino propuesto | Esfuerzo |
|----------|------------------|---------|
| `components/Dashboard.tsx` | `features/dashboard/components/` | Bajo |
| `components/CajaPage.tsx` | `features/caja/components/` | Bajo |
| `components/ExternalWorkshops.tsx` | `features/external-workshops/components/` | Bajo |
| `components/WarrantySearch.tsx` | `features/warranties/components/` | Bajo |
| `hooks/useExternalWorkshops.ts` | `features/external-workshops/hooks/` | Bajo |
| `hooks/useExternalRepairs.ts` | `features/external-workshops/hooks/` | Bajo |

---

## 5. Qué debería separarse en algún momento

| Elemento | Problema | Separación propuesta |
|----------|---------|---------------------|
| `ServiceQueue.tsx` (64 KB) | Demasiado grande | Extraer `ServiceOrderCard`, `ServiceOrderFilters`, `ServiceOrderActions` |
| `ManualSalesPage.tsx` (50 KB) | Demasiado grande | Extraer `SaleForm`, `SaleItemList`, `SaleTicketPreview`, `SaleSummary` |
| `CreateOrder.tsx` (50 KB) | Demasiado grande | Extraer `CustomerStep`, `DeviceStep`, `OrderConfirmationStep` |
| `Dashboard.tsx` (48 KB) | Demasiado grande | Extraer `StatsSummary`, `RecentOrdersList`, `DashboardCharts` |
| `useServiceOrders.ts` | Hace demasiado | Separar en `useServiceOrdersQuery`, `useServiceOrdersMutations` |

---

## 6. Qué no debe tocarse todavía

| Elemento | Razón |
|----------|-------|
| Lógica de cálculo de garantías en `useManualSales.ts` | Sensible, requiere pruebas antes de mover |
| Lógica de `order_number` (aunque tiene riesgo de duplicados) | Cambio requiere trigger en la BD, coordinación con producción |
| Flujo de impresión QZ Tray | Crítico para el negocio; mover solo después de tests |
| `application/use-cases/` | Parcialmente implementado; requiere decisión de arquitectura |
| `infrastructure/repositories/` | Funcional; no mover hasta decidir el patrón definitivo |

---

## 7. Por qué cada cambio mejora el mantenimiento

| Cambio | Beneficio |
|--------|-----------|
| Carpeta `features/` | Agrupa todo lo de un dominio junto (componente + hook + tipos) |
| Subdivisión de páginas masivas | Archivos <300 líneas = más fácil de leer, probar y modificar |
| `shared/` centralizado | Evita importaciones cruzadas entre features |
| Mover `PRINT_SETTINGS` a `features/printing/` | Cohesión con el módulo que los usa |
| Tipos generados con `supabase gen types` | Previene desincronización silenciosa entre código y BD |
| Script `typecheck` separado | CI/CD más rápido sin rebuild completo |

---

*No aplicar estos cambios sin aprobación. Ver `REFACTOR_ROADMAP.md` para el plan paso a paso.*
