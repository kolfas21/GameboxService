# Flujo de Impresión (Printing Flow)

Este documento describe la estrategia de impresión del sistema, la cual prioriza el uso de QZ Tray para impresión directa pero ofrece mecanismos de respaldo (fallback) transparentes y específicos por sucursal.

## Modos de Impresión

La arquitectura soporta tres vías principales de salida:
1. **QZ Tray (Directa):** Impresión silenciosa en segundo plano que no requiere ventanas de diálogo ni clics adicionales del usuario.
2. **Navegador (Fallback Manual):** Abre una ventana de `window.print()` cuando QZ no está configurado, fue deshabilitado por el usuario, o presentó un problema de conectividad/certificados.
3. **Guardar PDF:** Flujo manual nativo de Chrome/Navegador activable intencionalmente.

## Configuración por Sucursal (Branch-Aware)

QZ Tray permite almacenar preferencias de manera local en el `localStorage` del navegador. Para soportar que diferentes sucursales compartan equipo de cómputo sin colisionar sus configuraciones de impresión (por ejemplo, una sucursal usa QZ y otra no), las configuraciones **están limitadas por sede**:

* Las claves de `localStorage` llevan el formato: `gamebox:printing:<branchKey>:<settingName>`
* Las preferencias incluyen si QZ está habilitado o no (`qzEnabled`) y las impresoras por defecto (`ticketPrinter`, `stickerPrinter`).
* Al deshabilitar QZ en la pantalla de *Ajustes de Impresión*, la aplicación omite cualquier intento de conexión y redirige inmediatamente al fallback manual *únicamente para esa sede*.

## Lógica de Decisión (Resolución de Impresión)

Todos los componentes de la aplicación (`ComandaPreview`, `MultipleOrdersComandaPreview`, `ManualSalesPage`) utilizan un verificador silencioso:

```typescript
const isReady = await checkPrinterReady('ticket' | 'sticker', user?.sede)
```

### Flujo QZ Directo (Prioridad 1)
- Si `checkPrinterReady` devuelve `true` (QZ habilitado para esta sucursal, QZ conectado y hay nombre de impresora en localStorage), la aplicación renderiza el HTML internamente y se lo manda a la tiquetera usando las dimensiones configuradas.

### Flujo Fallback de Navegador (Automático)
- Si QZ Tray fue **deshabilitado explícitamente** para la sucursal actual o el usuario no seleccionó una impresora, `checkPrinterReady` devuelve `false`.
- Sin mostrar alertas de interrupción, el sistema crea un objeto `window.open` e inyecta el mismo HTML que usaría QZ Tray.
- Luego llama a `window.print()` y el usuario puede elegir su propia impresora mediante la interfaz nativa del sistema operativo.

### QZ certificate/signature errors (Fallback Modal)
- Si `checkPrinterReady` verifica que todo está correcto e intenta mandar el HTML mediante `printTicketHtml` a QZ Tray, pero **ocurre un error como certificado inválido (`Failed to sign request`) o conexión rechazada**, la promesa arrojará un error.
- La aplicación capturará este error sin bloquearse (ni usar un modal rojo estándar).
- En su lugar, mostrará un `PrintFallbackModal` amigable, indicando que ocurrió un problema de certificados/firma y ofrecerá botones de acción inmediata:
  - **Imprimir manualmente:** Acciona la venta de navegador (fallback seguro).
  - **Deshabilitar QZ para esta sucursal:** Apaga el interruptor `qzEnabled` localmente, y para la siguiente vez ya no tratará de enviar datos a QZ, yéndose directo a impresión manual.

## Configuración del Backend para QZ (Supabase Edge Functions)
Para que QZ Tray confíe en la aplicación y suprima las advertencias de seguridad de forma transparente, se utiliza una Edge Function en Supabase (`qz-security`) que implementa la lógica de certificados y firma asimétrica requerida por QZ.
- **Endpoint de Certificado (`/certificate`):** Retorna la llave pública (certificado) almacenada de forma segura en `QZ_CERTIFICATE`.
- **Endpoint de Firma (`/sign`):** Firma dinámicamente las solicitudes de impresión usando la llave privada almacenada en el backend `QZ_PRIVATE_KEY`. *Regla Estricta: La llave privada NUNCA debe enviarse al frontend.*
- **Requisitos de CORS:** La función maneja dinámicamente los encabezados CORS validando si el `Origin` coincide con un allowlist seguro que incluye los dominios autorizados de la aplicación (ej. `https://gameboxservice.onrender.com`). Garantiza la presencia de headers de `Access-Control-Allow-Origin`, `Methods`, etc., tanto para respuestas correctas como en los errores o solicitudes preflight (`OPTIONS`).
- Si CORS, el certificado o la firma fallan, el sistema cae automáticamente en el `PrintFallbackModal` sin bloquear el flujo de trabajo.

### QZ Security Secrets

Para que la Edge Function de `qz-security` responda correctamente a las peticiones del frontend, debes configurar los siguientes secretos en tu proyecto Supabase.

**1. Nombres exactos requeridos:**
- `QZ_CERTIFICATE`: Contiene el certificado público completo de QZ Tray (`digital-certificate.txt`).
- `QZ_PRIVATE_KEY`: Contiene la llave privada (`private-key.pem`). NUNCA exponerla al frontend.

**2. Cómo configurarlos usando Supabase CLI:**
*(En PowerShell, envuelve las cadenas multilínea con comillas dobles y usa saltos de línea literales, o lee desde un archivo si es muy largo).*
```bash
pnpm dlx supabase secrets set QZ_CERTIFICATE="-----BEGIN CERTIFICATE-----
MII...
-----END CERTIFICATE-----"

pnpm dlx supabase secrets set QZ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MII...
-----END PRIVATE KEY-----"
```

**3. Cómo redesplegar la función:**
```bash
pnpm dlx supabase functions deploy qz-security --no-verify-jwt
```

**4. Cómo probar `/certificate`:**
```powershell
$origin = "https://gameboxservice.onrender.com"
$base = "https://pnnokruiikikuygyukbz.supabase.co/functions/v1/qz-security"

Invoke-WebRequest "$base/certificate" `
  -Method GET `
  -Headers @{
    Origin = $origin
  }
```

**5. Cómo probar `/sign`:**
```powershell
Invoke-WebRequest "$base/sign" `
  -Method POST `
  -Headers @{
    Origin = $origin
    "Content-Type" = "application/json"
  } `
  -Body '{"request": "test-data"}'
```

## Regla Estricta: Estilos y Dimensiones
**Ninguna acción de QZ Tray debe alterar los tamaños de los contenedores CSS.**
- Los tamaños (`80mm` de ancho en tickets y `7cm x 5cm` en stickers) están manejados nativamente mediante `<style>` dentro de cada HTML con directivas directas en `@page`.
- QZ lee estos parámetros, al igual que lo haría el navegador. Por tanto, se usa **exactamente la misma plantilla** para QZ y para el Fallback Manual.

## Escenarios de Prueba a verificar manualmente
1. **Sucursal con QZ deshabilitado:** Al hacer clic en imprimir, abre la ventana manual sin intentos de conexión.
2. **Sucursal con QZ habilitado y configurado:** Intento de imprimir directo.
3. **Falla de certificado/firma:** Tras activar QZ, la app captura `Failed to sign request` y muestra el `PrintFallbackModal`. Al darle a Imprimir manualmente, abre el popup.
4. **QZ sin impresora seleccionada:** Abre la ventana manual.
5. **Guardar PDF explícito:** Sigue abriendo su ventana nativa de forma segura.
