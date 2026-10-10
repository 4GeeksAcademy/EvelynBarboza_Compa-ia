# AUDIT — Auditoría inicial

## Entorno de medición

- Fechas: 9 y 10 de octubre de 2026, según las marcas UTC de los JSON.
- Navegador: Chrome, con Lighthouse 13.4.1. No se registró por separado la versión del navegador.
- Entorno: GitHub Codespaces, con URLs HTTPS de puertos reenviados.
- Medición exploratoria: `npm run dev`, con extensiones del navegador. Los reportes advierten sobre datos almacenados en IndexedDB.
- Referencia de producción antes del skeleton: `npm run build` y `npm run start`, sin recursos de extensiones ni advertencias en los cuatro JSON iniciales de producción.
- Medición después del skeleton: producción, sin recursos de extensiones. Los dos JSON posteriores advierten sobre datos almacenados en IndexedDB; repetir en un perfil limpio para confirmar estabilidad.
- Dispositivos: Mobile y Desktop; throttling simulado de Lighthouse.
- Procedimiento: una ejecución guardada por página y dispositivo. No se calculó una mediana ni se verificó la variabilidad entre ejecuciones.
- API de datos: puerto 8000. API de autenticación: puerto 8001. Ambas deben estar disponibles y la sesión iniciada al medir.

URLs auditadas:

- Proveedores: `https://potential-xylophone-69rw9rppj5g35jww-3000.app.github.dev/suppliers`.
- Dashboard: `https://potential-xylophone-69rw9rppj5g35jww-3001.app.github.dev/incidents/dashboard`.
- Home corporativa `/`: pendiente de medición en Mobile y Desktop.

Los JSON corregidos de Incidencias corresponden al dashboard, no a la raíz `/`. Los informes anteriores de producción que medían `/` fueron reemplazados por el usuario y no se usan como evidencia del dashboard.

Ubicación actual: raíz del proyecto, como propone la guía. El usuario solicitó trasladar estos documentos a `audit/`, pero la operación se omitió; el traslado y la adaptación de enlaces relativos quedan pendientes.

## Puntuaciones iniciales

### Referencia de producción

Esta tabla es el punto de partida para optimizaciones posteriores. `N/D` indica una medición pendiente, no una puntuación de cero. LCP y FCP están en segundos; TBT está en milisegundos; CLS no tiene unidad.

| Frontend / URL | Modo | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Application / | Mobile | N/D | N/D | N/D | N/D | N/D | N/D | N/D | N/D |
| Application / | Desktop | N/D | N/D | N/D | N/D | N/D | N/D | N/D | N/D |
| Application /suppliers | Mobile | 98 | 94 | 96 | 60 | 2,1 | 0 | 40 | 1,1 |
| Application /suppliers | Desktop | 99 | 94 | 96 | 60 | 0,7 | 0 | 0 | 0,5 |
| Backoffice /incidents/dashboard | Mobile | 81 | 96 | 96 | 60 | 1,9 | 0,394 | 70 | 1,0 |
| Backoffice /incidents/dashboard | Desktop | 99 | 96 | 96 | 60 | 0,5 | 0 | 0 | 0,4 |

Evidencias:

- [Proveedores Mobile](audit/before/production/supplierrs-mobile.json), 2026-10-10 00:07:08 UTC.
- [Proveedores Desktop](audit/before/production/suppliers-desktop.json), 2026-10-10 00:11:07 UTC.
- [Dashboard Mobile](audit/before/production/incidents-mobile.json), 2026-10-10 00:21:23 UTC.
- [Dashboard Desktop](audit/before/production/incidents-desktop.json), 2026-10-10 00:20:46 UTC.

### Exploración en desarrollo: no comparable con producción

| Frontend / URL | Modo | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Application /suppliers | Mobile | 53 | 94 | 96 | 60 | 5,7 | 0 | 1180 |
| Backoffice /incidents/dashboard | Mobile | 36 | 96 | 96 | 60 | 5,5 | 0,394 | 1260 |

JSON originales del 9 de octubre:

- [Proveedores en desarrollo](audit/before/potential-xylophone-69rw9rppj5g35jww-3000.app.github.dev-2026100Suppiers.dev-2026100).
- [Dashboard en desarrollo](audit/before/potential-xylophone-69rw9rppj5g35jww-3001.app.github.dev-2026100).

Las capturas iniciales están en `audit/before/`. Los valores de esta documentación se toman de los JSON. No se presenta la diferencia desarrollo/producción como efecto de una corrección de rendimiento.

## Problemas detectados

### Problema 1 — Coste de desarrollo y extensiones en la medición

- Frontend y URL: ambos frontend, en las URLs indicadas.
- Indicador afectado: TBT, LCP y trabajo del hilo principal.
- Evidencia: los JSON exploratorios contienen chunks `next-devtools`, recursos `chrome-extension://` y aproximadamente 723 KiB de JavaScript sin usar de una extensión. La animación no compuesta señalada pertenece al indicador de Next.js.
- Archivo o recurso involucrado: recursos de desarrollo de Next.js y extensiones, no una dependencia funcional identificada de la aplicación.
- Causa raíz comprobada: la auditoría incluía costes ajenos a la distribución de producción.
- Solución: medir producción sin extensiones y establecer una nueva referencia. Ya realizada; no es una optimización del código ni demuestra por sí sola una mejora bajo condiciones equivalentes.

### Problema 2 — Desplazamiento del resumen en Incidencias Mobile

- Frontend y URL: Backoffice `/incidents/dashboard`, Mobile.
- Indicador afectado: CLS 0,394, por encima del objetivo de referencia de 0,1; Performance 81.
- Evidencia: en producción, `layout-shifts` atribuye 0,394239 al desplazamiento de `section.listSection` del dashboard. Desktop registra CLS 0.
- Archivos involucrados: [IncidentDashboard.tsx](uis/backoffice/src/components/incidents/IncidentDashboard.tsx) y [incident-dashboard.module.css](uis/backoffice/src/components/incidents/incident-dashboard.module.css).
- Causa: el componente reemplazaba una línea de carga por cuatro grupos de resumen sin reservar su espacio. En pantallas de hasta 560 px, los grupos se apilan en una columna y desplazaban la lista situada debajo. Los reportes posteriores registran CLS 0 tras reservar ese espacio.
- Solución implementada: cuatro grupos de resumen presentes desde la carga inicial, con placeholders estáticos basados en los estados, categorías, orígenes y sedes existentes. Los placeholders comparten celda de cuadrícula con los datos y permanecen ocultos como reserva de espacio después de cargar; no se recorta contenido ni se añaden valores ficticios al resumen accesible. Se conserva el último resumen durante recargas.
- Accesibilidad: placeholders con `aria-hidden`, estado de carga anunciado y sección con `aria-busy`. Sin animaciones ni nuevas dependencias de producción.
- Comprobación ejecutada: build de producción y 12 tests de autenticación e incidencias pasaron; dos tests nuevos comprueban estructura durante carga y conservación del resumen al actualizar un estado. Los tests de DOM no miden dimensiones reales.
- Verificación Lighthouse: Mobile pasa de Performance 81 a 94 y CLS 0,394 a 0; Desktop pasa de 99 a 100 y conserva CLS 0. Coinciden URL, versión de Lighthouse, pantalla y throttling. Son ejecuciones individuales, no medianas.
- Cautela: TBT Mobile pasa de 70 a 280 ms; Desktop de 0 a 10 ms. La puntuación mejora, pero no todas las métricas mejoran. Los nuevos reportes advierten sobre IndexedDB, por lo que hace falta repetir para determinar si el aumento es sostenido o variación de medición.
- Estado: implementado y medido. El objetivo de superar 90 y eliminar el desplazamiento móvil se cumple en estas ejecuciones. La prueba visual automatizada quedó bloqueada por bibliotecas del sistema ausentes; todavía deben comprobarse los flujos y la estabilidad entre ejecuciones.

Resultados posteriores y evidencia:

| Dashboard / Modo | Performance antes / después | LCP antes / después (s) | CLS antes / después | TBT antes / después (ms) |
|---|---|---|---|---|
| Mobile | 81 / 94 | 1,9 / 1,9 | 0,394 / 0 | 70 / 280 |
| Desktop | 99 / 100 | 0,5 / 0,6 | 0 / 0 | 0 / 10 |

- [Dashboard Mobile después](audit/after/incidents-mobile-after.json).
- [Dashboard Desktop después](audit/after/incidents-desktop-after.json).
- Accessibility y Best Practices se mantienen en 96, y SEO en 60, en ambos dispositivos.
- No hay solicitudes HTTP fallidas en los JSON después. Esto no sustituye probar operaciones y formularios.

### Problema 3 — Restricción de indexación

- Frontend y URL: ambas URLs, en Mobile y Desktop.
- Indicador afectado: SEO 60.
- Evidencia: el único control SEO fallido en los cuatro JSON es `is-crawlable`, con `x-robots-tag: noindex, nofollow`.
- Configuración revisada: [application/next.config.ts](uis/application/next.config.ts) y [backoffice/next.config.ts](uis/backoffice/next.config.ts); ambos layouts ya incluyen título, descripción e idioma.
- Causa comprobada: la respuesta auditada bloquea indexación. Las consultas locales no enviaron esa cabecera y no se encontró configurada en los frontend; el bloqueo se observa al acceder mediante el alojamiento/túnel de Codespaces.
- Decisión: conservar la restricción y documentarla. No hacer indexable un panel protegido para aumentar una puntuación. Una auditoría de SEO público debe realizarse sobre una página pública y un alojamiento adecuado.

### Problema 4 — Imports de Inventario que bloqueaban el build

- Frontend: Backoffice; bloqueo global de compilación, aunque la medición objetivo sea Incidencias.
- Evidencia: `npm run build` falló en cinco imports a una ruta inexistente de CSS.
- Causa raíz: se importaba `@/app/backoffice/inventory/inventory.module.css`, pero el archivo está en `src/components/inventory/inventory.module.css`.
- Solución aplicada: corregir únicamente las cinco rutas. Detalle y verificación en [REPORT.md](REPORT.md).
- Clasificación: corrección de compilación, no una mejora demostrada de Performance del dashboard.

### Problema 5 — Error previo de hidratación de React

- Frontend y URL: Backoffice `/incidents/dashboard`, Mobile y Desktop.
- Evidencia: los reportes de producción antes y después contienen `Minified React error #418` en `errors-in-console`. Best Practices permanece en 96.
- Causa raíz: hay una discrepancia entre HTML del servidor y el primer render del cliente. En el arranque previo de desarrollo se observó una discrepancia en `AuthNav`; los componentes de sesión leen tokens de navegador durante render. La atribución completa requiere una comprobación dirigida; no se presenta como un problema introducido por el skeleton.
- Archivos a revisar: `uis/backoffice/src/components/auth-nav.tsx` y `uis/backoffice/src/components/auth-guard.tsx`.
- Solución propuesta: sincronizar la sesión con un primer render consistente entre servidor y cliente, conservando la protección de rutas y las claves de almacenamiento. Pendiente, fuera del cambio de skeleton.

## Código duplicado

### Caso 1 — Gestión de tokens de autenticación

- Archivos: [application/lib/auth.ts](uis/application/lib/auth.ts) y [backoffice/src/lib/auth.ts](uis/backoffice/src/lib/auth.ts).
- Código repetido: lectura, escritura y borrado del token en `localStorage`, comprobación de entorno de navegador, logout y redirección al login.
- Por qué abstraerlo: evitar diferencias accidentales en el comportamiento de sesión y facilitar pruebas del almacenamiento.
- Abstracción propuesta: una utilidad de almacenamiento de sesión configurable por clave y ruta de login. Mantener `trackflow_token` y `backoffice_token` separados; conservar las APIs públicas existentes.
- Alcance: candidato documentado, no implementado. No introducir un paquete compartido sin verificar primero la infraestructura existente del monorepo.

### Caso 2 — Estado de sesión de la navegación

- Archivos: [application/auth-nav.tsx](uis/application/components/auth-nav.tsx) y [backoffice/auth-nav.tsx](uis/backoffice/src/components/auth-nav.tsx).
- Código repetido: lectura inicial del token, seguimiento del pathname y actualización del estado de sesión al navegar; selección entre enlaces públicos y privados.
- Por qué abstraerlo: concentrar la sincronización de sesión y probar una sola lógica, manteniendo menús y estilos propios de cada frontend.
- Abstracción propuesta: un Custom Hook `useAuthSession` que encapsule la lectura y sincronización del estado de sesión. El primer render de servidor y cliente debe ser consistente; no copiar sin revisar las actualizaciones de estado durante render existentes.
- Alcance: candidato documentado, no implementado. Debe integrarse y reutilizarse realmente para cumplir la consigna; su extracción no garantiza una mejora de Lighthouse.

## Pendientes de la auditoría

- Medir la home de Application en Mobile y Desktop, verificando que la URL final no redirija a otra vista ya medida. Si no existe una home corporativa distinta, acordar la adaptación de las tres páginas de la consigna.
- Repetir idealmente tres ejecuciones por combinación y comparar medianas bajo condiciones equivalentes.
- Confirmar con mediciones repetidas en un perfil limpio la mejora del CLS y revisar el aumento del TBT móvil; comprobar visualmente los flujos afectados.
- Investigar el error de hidratación previo con una validación dirigida antes de modificar autenticación.
- Extraer e integrar al menos una abstracción, con pruebas funcionales.
- Registrar capturas e informes finales en `audit/after/` con nombres correspondientes a las referencias iniciales.
- La comparación de producción antes/después del dashboard ya está registrada. Completar las páginas restantes, verificación funcional y commits. Hay evidencia de mejora del dashboard en una ejecución por dispositivo, no de una optimización de código en Proveedores ni de una mejora sostenida en cada frontend.