---

name: gamebox-servtc
description: Guía de buenas prácticas para trabajar en el proyecto GameboxServtc, un sistema POS en React/TypeScript con impresión de tickets, stickers, ventas manuales, garantías, Supabase/PostgreSQL y despliegue en Render.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# GameboxServtc Skill

Usa esta skill cuando trabajes en el proyecto `GameboxServtc`, especialmente para modificar código, corregir errores, mejorar interfaz, organizar impresión, integrar ventas manuales, trabajar con garantías, conectar base de datos o preparar cambios para producción.

## Contexto del proyecto

GameboxServtc es un sistema de punto de venta para una tienda de consolas, accesorios, servicios técnicos y ventas manuales. El proyecto usa React, TypeScript, pnpm y una base de datos conectada a Supabase/PostgreSQL. También puede estar desplegado en Render.

El sistema debe priorizar estabilidad, claridad visual, tickets bien formateados, manejo correcto de descuentos, garantías, clientes, ventas manuales, inventario y roles de usuario.

## Reglas generales

Antes de modificar cualquier archivo:

1. Revisar primero la estructura actual del proyecto.
2. Identificar los archivos exactos que se deben tocar.
3. No cambiar lógica no relacionada con la solicitud.
4. No eliminar funcionalidades existentes sin justificación.
5. No inventar tablas, campos o rutas que no existan.
6. No hacer refactorizaciones grandes si el usuario pidió un cambio puntual.
7. Mantener compatibilidad con producción.
8. Evitar cambios que rompan tickets, ventas, garantías, roles o inventario.
9. Explicar siempre qué archivos se modificaron y por qué.
10. Entregar cambios por pasos cuando el ajuste sea delicado.

## Estándar de trabajo

Cuando se solicite una mejora o corrección:

1. Analizar el problema.
2. Ubicar los archivos relacionados.
3. Proponer un plan corto.
4. Hacer cambios pequeños y controlados.
5. Validar que no se rompa el flujo principal.
6. Revisar diseño responsive si afecta interfaz.
7. Confirmar pruebas manuales recomendadas.
8. Resumir el resultado final.

## Buenas prácticas para React y TypeScript

* Usar componentes claros y reutilizables cuando tenga sentido.
* Evitar duplicar lógica.
* Mantener nombres descriptivos.
* Validar datos antes de mostrarlos o guardarlos.
* Evitar valores quemados si ya existe configuración.
* No usar `any` sin necesidad.
* Manejar errores visibles para el usuario.
* Mantener los formularios compactos, claros y fáciles de usar.
* No sobrecargar visualmente las pantallas.

## Buenas prácticas para ventas y tickets

Cuando se trabaje en tickets o facturas:

* No mostrar descuentos en cero.
* Si un producto tiene descuento, mostrarlo por ítem.
* Evitar que aparezcan ceros sueltos debajo de los productos.
* Validar pago mixto para que no se desborde.
* Mantener el ticket legible para el cliente.
* Revisar impresión térmica en ancho reducido.
* No cambiar consecutivos sin validar.
* No alterar ventas históricas sin autorización.

## Buenas prácticas para garantías

Cuando se trabaje con garantías:

* La garantía debe calcularse desde la fecha de compra.
* Debe soportar rangos como 1 mes, 3 meses, 6 meses o 1 año.
* La fecha final debe calcularse automáticamente.
* El usuario no debe tener que escribir manualmente fechas si el sistema puede calcularlas.
* La interfaz debe mostrar la información de forma compacta y clara.

## Buenas prácticas para impresión

Cuando se trabaje con impresoras, QZ Tray, tickets o stickers:

* Separar configuración de impresora de tickets y stickers.
* Permitir seleccionar impresora desde el PC en producción.
* No dejar nombres de impresora quemados si se pueden configurar.
* Validar errores cuando QZ Tray no esté abierto.
* Evitar ventanas o permisos repetitivos si existe certificado o configuración segura.
* Mantener una experiencia simple para el vendedor.

## Buenas prácticas para base de datos

Cuando se trabaje con Supabase, PostgreSQL o migraciones:

* Nunca borrar datos sin autorización explícita.
* Validar conteos antes y después de restaurar información.
* Cuidar consecutivos de órdenes, ventas y tickets.
* No ejecutar SQL destructivo sin respaldo.
* Confirmar tablas reales antes de crear consultas.
* Si hay backup, comparar cantidad de registros antes de continuar.
* Si producción usa Render, validar variables de entorno antes de redeploy.

## Buenas prácticas para UI/UX

La interfaz debe ser:

* Limpia.
* Compacta.
* Fácil de entender.
* Responsive.
* Sin cajas demasiado grandes.
* Sin información desbordada.
* Con grillas bien alineadas.
* Con botones claros.
* Adecuada para uso rápido en tienda.

Cuando se mejore una vista, evitar saturarla. Priorizar que el vendedor encuentre rápido productos, garantías, clientes, totales y formas de pago.

## Flujo recomendado antes de entregar cambios

Antes de finalizar cualquier tarea, revisar:

1. Que el proyecto compile.
2. Que no haya errores TypeScript.
3. Que no se rompió la navegación principal.
4. Que los tickets sigan saliendo bien.
5. Que ventas manuales sigan funcionando.
6. Que garantías sigan calculando correctamente.
7. Que no se afecten datos existentes.
8. Que el diseño se vea bien en pantalla pequeña.

## Comandos útiles

Instalar dependencias:

```bash
pnpm install
```

Ejecutar en desarrollo:

```bash
pnpm dev
```

Compilar para producción:

```bash
pnpm build
```

Revisar errores de TypeScript o build:

```bash
pnpm build
```

Agregar dependencias:

```bash
pnpm add nombre-paquete
```

Agregar dependencias de desarrollo:

```bash
pnpm add -D nombre-paquete
```

## Forma esperada de responder

Cuando se trabaje en este proyecto, responder de forma clara y práctica:

* Qué problema se encontró.
* Qué archivo se debe modificar.
* Qué cambio se debe hacer.
* Qué se debe probar después.
* Qué riesgo puede existir.
* Qué paso sigue.

No entregar cambios gigantes sin explicar. No inventar soluciones modernas si el proyecto necesita algo simple, estable y entendible.
