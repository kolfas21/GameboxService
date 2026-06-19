# Flujo de Impresión (Printing Flow)

Este documento describe la estrategia de impresión del sistema, la cual prioriza el uso de QZ Tray para impresión directa pero ofrece mecanismos de respaldo (fallback) transparentes.

## Modos de Impresión

La arquitectura soporta tres vías principales de salida:
1. **QZ Tray (Directa):** Impresión silenciosa en segundo plano que no requiere ventanas de diálogo ni clics adicionales del usuario.
2. **Navegador (Fallback Manual):** Abre una ventana de `window.print()` cuando QZ no está configurado.
3. **Guardar PDF:** Flujo manual nativo de Chrome/Navegador activable intencionalmente.

## Lógica de Decisión (Resolución de Impresión)

Todos los componentes de la aplicación (`ComandaPreview`, `MultipleOrdersComandaPreview`, `ManualSalesPage`) utilizan un verificador silencioso:

```typescript
const isReady = await checkPrinterReady('ticket' | 'sticker')
```

### Flujo QZ Directo (Prioridad 1)
- Si `checkPrinterReady` devuelve `true` (QZ conectado y hay nombre de impresora en localStorage), la aplicación renderiza el HTML internamente y se lo manda a la tiquetera usando las dimensiones configuradas.

### Flujo Fallback de Navegador (Automático)
- Si QZ Tray no responde (ej. servicio apagado) o el usuario no seleccionó una impresora, `checkPrinterReady` devuelve `false`.
- Sin mostrar alertas de interrupción, el sistema crea un objeto `window.open` e inyecta el mismo HTML que usaría QZ Tray, además de un bloque visual de "Instrucciones de PDF".
- Luego llama a `window.print()` y el usuario puede elegir su propia impresora mediante la interfaz nativa del sistema operativo.

## Regla Estricta: Estilos y Dimensiones
**Ninguna acción de QZ Tray debe alterar los tamaños de los contenedores CSS.**
- Los tamaños (`80mm` de ancho en tickets y `7cm x 5cm` en stickers) están manejados nativamente mediante `<style>` dentro de cada HTML con directivas directas en `@page`.
- QZ lee estos parámetros, al igual que lo haría el navegador. Por tanto, se usa **exactamente la misma plantilla** para QZ y para elFallback Manual.

## Escenarios de Prueba a verificar manualmente
1. **QZ no instalado/ejecutado:** Al hacer clic en "Imprimir Comanda", abre la ventana manual. No debe salir error duro.
2. **QZ activo pero sin configurar impresora:** Al imprimir, abre la ventana manual.
3. **QZ listo y configurado:** Al hacer clic, la impresora suelta el ticket sin confirmaciones del usuario.
4. **Venta manual sin QZ:** Genera el ticket manual y abre la ventana.
5. **Guardar PDF explícito:** El botón de guardar PDF debe forzar la apertura de la previsualización del ticket en formato PDF ignorando QZ de forma segura.
