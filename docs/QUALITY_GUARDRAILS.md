# GameboxService - Quality Guardrails

> **Fecha:** 2026-06-19
> **Objetivo:** Mantener el código libre de errores de linting, tipado estricto y prevenir regresiones durante el desarrollo.

Este documento establece las barreras de protección de calidad (Guardrails) que deben seguirse para mantener la estabilidad de la aplicación GameboxService.

## 1. Reglas de ESLint y Tipado Estricto

Hemos configurado ESLint y TypeScript para ser estrictos con la calidad del código:

- **No usar `any`**: Está prohibido el uso de `any`. Si el tipo es desconocido, usar `unknown` o tipar correctamente usando las interfaces de dominio en `src/types`.
- **Dependencias de Hooks**: Nunca deshabilitar `react-hooks/exhaustive-deps`. Si un hook o efecto tiene un warning de dependencias, la solución es:
  - Envolver las funciones en `useCallback`.
  - Mover las variables u objetos cacheados a `useMemo`.
  - Extraer las variables que no dependen del componente fuera de este.
- **Archivos con exportaciones múltiples**: Si un archivo exporta componentes y funciones/constantes adicionales, agregar `/* eslint-disable react-refresh/only-export-components */` al inicio del archivo o bloque para evitar problemas con Fast Refresh de Vite.

## 2. Scripts de Validación

Antes de cada commit o merge a la rama principal (`main`), se deben pasar con éxito los siguientes comandos:

1. **`pnpm typecheck`**: Valida que no haya errores de tipos en TypeScript.
2. **`pnpm lint`**: Ejecuta ESLint en todo el proyecto. **Debe terminar con 0 errores y 0 warnings.**
3. **`pnpm build`**: Valida que la aplicación compile correctamente con Vite.

**Regla de Oro:** Después de cualquier corrección de linting, siempre ejecuta `pnpm typecheck` y `pnpm build` antes de considerar la tarea como completada para evitar regresiones de tipado.

## 3. Prácticas Seguras de Refactorización

- **Mantener cambios pequeños:** No refactorizar el proyecto completo en un solo PR. Hacer cambios iterativos.
- **No ocultar errores:** Nunca usar `@ts-ignore` ni silenciar reglas globales de ESLint. Si un archivo requiere una excepción justificada, usar `eslint-disable-next-line` y documentar el porqué.
- **Evitar modificar lógica crítica si solo se está limpiando código:** Los módulos de ventas, tickets, garantías e inventario son críticos para el negocio.

## 4. Próximos Pasos Recomendados (CI/CD)

Para automatizar estas validaciones, se recomienda:
1. Instalar `husky` y `lint-staged` para ejecutar `pnpm lint` y `pnpm typecheck` antes de cada commit automáticamente.
2. Configurar GitHub Actions o la plataforma CI (como Render) para abortar el build si el linter o el typechecker fallan.
