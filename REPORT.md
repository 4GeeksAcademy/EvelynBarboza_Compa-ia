# REPORT — Mejoras de rendimiento

## Resumen

- Estado: informe de avance. No es una entrega final completa.
- Frontends auditados: Application (Proveedores) y Backoffice (Incidencias). La home corporativa sigue pendiente.
- Páginas medidas: `/suppliers` en el puerto 3000 y `/incidents/dashboard` en el puerto 3001, Mobile y Desktop.
- Fechas: 9 y 10 de octubre de 2026, según los reportes Lighthouse.
- Cambios principales: corrección de cinco imports CSS de Inventario, ejecución en producción sin extensiones y skeleton estático del resumen de Incidencias para reservar espacio durante la carga.
- Componente o Custom Hook extraído: ninguno todavía. Hay dos candidatos documentados en [AUDIT.md](AUDIT.md).
- No se modificaron SEO, endpoints, filtros ni reglas de actualización de datos. Después del skeleton, el dashboard registra Performance 94 Mobile y 100 Desktop, con CLS 0 en ambos modos.
- Ubicación actual: raíz del proyecto. El traslado solicitado a `audit/` se omitió y queda pendiente, junto con la adaptación de enlaces relativos. La guía propone la ubicación actual en la raíz.

## Correcciones aplicadas

### Corrección 1 — Recuperar la compilación del backoffice

- Problema original: el build de producción fallaba con cinco errores de resolución de CSS.
- Causa raíz: imports a una ruta inexistente, pese a que la hoja de estilos ya existía en otra carpeta.
- Archivos modificados:
  - [orders/inbound/page.tsx](uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx).
  - [orders/outbound/page.tsx](uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx).
  - [orders/page.tsx](uis/backoffice/src/app/backoffice/inventory/orders/page.tsx).
  - [products/page.tsx](uis/backoffice/src/app/backoffice/inventory/products/page.tsx).
  - [InventoryNav.tsx](uis/backoffice/src/components/inventory/InventoryNav.tsx).
- Cambio realizado: reemplazar `@/app/backoffice/inventory/inventory.module.css` por `@/components/inventory/inventory.module.css` en esos cinco archivos. No se movió ni modificó CSS y no se cambiaron reglas de negocio.
- Verificación: `npm run build` completó compilación, TypeScript y generación de páginas; el editor no reportó errores en los archivos corregidos. `npm test -- --runInBand` pasó 2 suites y 10 tests de autenticación e incidencias, con advertencias del entorno sobre `act(...)`.
- Verificación funcional de lectura: HTTP 200 en las cuatro rutas de Inventario, Proveedores, dashboard, consultas de proveedores, incidencias y resumen. Los recursos JS/CSS referenciados por Proveedores y dashboard respondieron HTTP 200.
- Limitación: las comprobaciones HTTP no sustituyen la prueba de formularios y operaciones en navegador. No hay pruebas automatizadas de Inventario en las suites ejecutadas; no se afirma ausencia absoluta de regresiones.
- Commit: pendiente; el asistente no creó commits.
- Medición antes: compilación fallida. No había una referencia de Performance en producción del dashboard anterior a esta reparación.
- Medición después: build exitoso y referencia de producción disponible. No se atribuye a estos imports una mejora cuantificada de Lighthouse.

### Ajuste de medición — Producción y navegador sin extensiones

- Problema original: las mediciones exploratorias incluían herramientas de desarrollo y JavaScript de extensiones.
- Causa raíz: ejecución con `npm run dev` y extensiones activas; no representa el coste de una distribución optimizada.
- Cambio realizado: compilar con `npm run build`, servir con `npm run start` en los mismos puertos y medir sin extensiones. Las API 8000 y 8001 siguieron disponibles.
- Archivo generado automáticamente: [uis/application/next-env.d.ts](uis/application/next-env.d.ts) cambió sus referencias de tipos de `.next/dev/types/` a `.next/types/` durante el build. No es una optimización manual.
- Verificación: ambos builds finalizaron; las páginas, datos y recursos consultados respondieron correctamente. Los cuatro JSON iniciales de producción no tienen advertencias ni recursos de extensiones. Los dos JSON después del skeleton sí advierten sobre IndexedDB, aunque tampoco contienen recursos de extensiones.
- Commit: pendiente.
- Medición exploratoria Mobile: Proveedores 53 y dashboard 36 en desarrollo.
- Nueva referencia Mobile: Proveedores 98 y dashboard 81 en producción.
- Interpretación: se cambió el entorno de ejecución y medición. Estas diferencias no prueban mejoras causadas por cambios de código y no satisfacen por sí solas la comparación equivalente de la consigna.

### Corrección 2 — Reservar espacio para el resumen de Incidencias

- Problema original: Performance 81 y CLS 0,394 en el dashboard Mobile de producción. La aparición del resumen desplazaba la lista situada debajo.
- Causa raíz: una línea de carga se reemplazaba por cuatro bloques que se apilan en móvil, sin una reserva de espacio equivalente.
- Archivos modificados: [IncidentDashboard.tsx](uis/backoffice/src/components/incidents/IncidentDashboard.tsx), [incident-dashboard.module.css](uis/backoffice/src/components/incidents/incident-dashboard.module.css) y [incidents.test.ts](uis/backoffice/src/lib/incidents.test.ts).
- Cambio realizado: los cuatro grupos existen desde la carga inicial. Un skeleton estático reserva espacio usando las etiquetas de las opciones existentes, con la misma cuadrícula responsive de cuatro, dos o una columna. Después de cargar, los placeholders permanecen ocultos en la misma celda que los datos para conservar la reserva. Esto puede añadir espacio vacío respecto de grupos con pocos resultados; no se recorta contenido ni se cambia la información mostrada.
- Recargas: el último resumen permanece visible mientras se consulta la actualización. Se mantienen mensajes de error y reintento; no se modifican filtros ni peticiones API.
- Accesibilidad: placeholders excluidos del árbol accesible, anuncio de carga y `aria-busy`. No se añadieron animaciones ni dependencias del frontend.
- Verificación ejecutada: build y TypeScript correctos; 2 suites y 12 tests pasaron. Dos tests nuevos comprueban los cuatro grupos durante la carga, ocultación de placeholders al llegar datos y conservación del resumen durante una actualización exitosa de estado. Se mantienen los tests de error, reintento de lista, filtros y rollback de estados.
- Verificación visual: pendiente. Playwright/Chromium se descargó únicamente en una caché externa, pero faltan bibliotecas del sistema y no pudo iniciarse. No se completó la preparación temporal de bibliotecas; no se modificaron manifests ni lockfiles del proyecto.
- Commit: pendiente.
- Medición antes: referencia guardada en `audit/before/production/`; dashboard Mobile 81, LCP 1,9 s, CLS 0,394, TBT 70 ms; Desktop 99, LCP 0,5 s, CLS 0, TBT 0 ms.
- Medición después: [Mobile](audit/after/incidents-mobile-after.json), Performance 94, LCP 1,9 s, CLS 0 y TBT 280 ms; [Desktop](audit/after/incidents-desktop-after.json), Performance 100, LCP 0,6 s, CLS 0 y TBT 10 ms.
- Comparabilidad: misma URL del dashboard, versión de Lighthouse, pantalla, método y configuración de throttling. Una ejecución antes y una después por modo, sin mediana; los informes posteriores advierten sobre IndexedDB.
- Resultado: +13 puntos en Mobile y +1 en Desktop. Se elimina el desplazamiento registrado y la puntuación de escritorio no baja. La pequeña variación Desktop no demuestra por sí sola una mejora sostenida.
- Cautelas: TBT Mobile aumenta de 70 a 280 ms; Desktop de 0 a 10 ms, y LCP Desktop de 0,5 a 0,6 s. Repetir mediciones limpias para evaluar variación y posibles regresiones; no afirmar que todas las métricas mejoraron. No se registran solicitudes HTTP fallidas.
- Error previo: React #418 (hidratación) aparece antes y después en ambos modos. No fue corregido por este cambio y debe investigarse por separado.

## Refactorización

- Casos identificados: 2, verificados en los archivos actuales y detallados en [AUDIT.md](AUDIT.md).
- Caso 1: almacenamiento de tokens y logout duplicados entre los servicios de autenticación.
- Caso 2: seguimiento de sesión duplicado entre los componentes `AuthNav`.
- Abstracción implementada: pendiente.
- Archivos que ahora la reutilizan: ninguno; aún no se refactorizó.
- Prueba de que sigue funcionando tras la extracción: pendiente; los tests actuales se ejecutaron antes de cualquier extracción.
- Criterio: preservar claves de sesión, rutas, estilos y comportamiento; no afirmar que eliminar duplicación mejora Performance sin medirlo.

## Comparación Lighthouse

### Producción antes y después del skeleton

Las cuatro referencias iniciales permanecen en `audit/before/production/`. Los dos JSON posteriores del dashboard están en `audit/after/`, añadidos por el usuario. No hay JSON de Proveedores después de una optimización de código ni mediciones de la home. Todas las puntuaciones van de 0 a 100.

| Frontend / URL / Modo | Perf. antes | Perf. después | Diferencia | LCP antes (s) | LCP después (s) | CLS antes | CLS después | TBT antes (ms) | TBT después (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Application / / Mobile | N/D | N/D | N/D | N/D | N/D | N/D | N/D | N/D | N/D |
| Application / / Desktop | N/D | N/D | N/D | N/D | N/D | N/D | N/D | N/D | N/D |
| Application /suppliers / Mobile | 98 | N/D | N/D | 2,1 | N/D | 0 | N/D | 40 | N/D |
| Application /suppliers / Desktop | 99 | N/D | N/D | 0,7 | N/D | 0 | N/D | 0 | N/D |
| Backoffice /incidents/dashboard / Mobile | 81 | 94 | +13 | 1,9 | 1,9 | 0,394 | 0 | 70 | 280 |
| Backoffice /incidents/dashboard / Desktop | 99 | 100 | +1 | 0,5 | 0,6 | 0 | 0 | 0 | 10 |

| Frontend / URL / Modo | Accessibility antes | Después | Best Practices antes | Después | SEO antes | Después |
|---|---:|---:|---:|---:|---:|---:|
| Application / / Mobile | N/D | N/D | N/D | N/D | N/D | N/D |
| Application / / Desktop | N/D | N/D | N/D | N/D | N/D | N/D |
| Application /suppliers / Mobile | 94 | N/D | 96 | N/D | 60 | N/D |
| Application /suppliers / Desktop | 94 | N/D | 96 | N/D | 60 | N/D |
| Backoffice /incidents/dashboard / Mobile | 96 | 96 | 96 | 96 | 60 | 60 |
| Backoffice /incidents/dashboard / Desktop | 96 | 96 | 96 | 96 | 60 | 60 |

`N/D` significa pendiente/no disponible. La diferencia de Performance es puntuación después menos puntuación antes, en puntos, no porcentaje. En estas ejecuciones la puntuación de escritorio no baja; esto no garantiza ausencia de regresiones funcionales o estabilidad de todas las métricas. Confirmar con medianas de tres mediciones, considerando la advertencia de IndexedDB posterior.

### Comparación exploratoria: condiciones distintas

Esta tabla describe la transición de entorno, no una prueba de optimización de código. Solo hay JSON Mobile originales para esta comparación.

| Página Mobile | Performance dev / prod | Accessibility dev / prod | Best Practices dev / prod | SEO dev / prod | LCP dev / prod (s) | CLS dev / prod | TBT dev / prod (ms) |
|---|---|---|---|---|---|---|---|
| Proveedores /suppliers | 53 / 98 | 94 / 94 | 96 / 96 | 60 / 60 | 5,7 / 2,1 | 0 / 0 | 1180 / 40 |
| Dashboard /incidents/dashboard | 36 / 81 | 96 / 96 | 96 / 96 | 60 / 60 | 5,5 / 1,9 | 0,394 / 0,394 | 1260 / 70 |

Fuentes y fechas de cada JSON: [AUDIT.md](AUDIT.md). Los informes actuales del dashboard reemplazan los que habían medido incorrectamente la raíz del backoffice.

## Uso del agente

- Agente: GitHub Copilot.
- Skill de rendimiento instalada/utilizada: ninguna. La guía permite no instalarlas; el análisis se realizó leyendo código y los JSON con un parser estructurado.
- Hallazgos comprobados: recursos de desarrollo/extensiones, imports CSS rotos, bloqueo de indexación y desplazamiento de la lista de Incidencias Mobile.
- Propuestas: medir producción sin extensiones, reparar imports, reservar espacio para el resumen si persistía el CLS y documentar duplicación.
- Cambios aplicados: cinco imports CSS, compilación y arranque de producción, documentación y skeleton del resumen con pruebas.
- Cambios no aplicados: extracción de una abstracción y cambios SEO. No se hicieron commits ni se publicaron cambios en GitHub.

## Conclusión

- El cambio de entorno redujo notablemente el coste de JavaScript observado, pero no permite atribuir esa variación a una optimización de código bajo condiciones equivalentes.
- Proveedores ya alcanza 98 Mobile y 99 Desktop en esta referencia. No conviene modificarlo solo para perseguir 100.
- La corrección de mayor impacto demostrada en esta comparación es la reserva de espacio del resumen: dashboard Mobile pasa de 81 a 94 y CLS de 0,394 a 0. Desktop pasa de 99 a 100 y mantiene CLS 0. Ambos superan 90 en las ejecuciones posteriores.
- El LCP Mobile se mantiene en 1,9 s. El TBT Mobile sube de 70 a 280 ms; no se oculta este resultado. Los informes nuevos advierten sobre IndexedDB y hace falta repetir mediciones limpias para confirmar estabilidad.
- SEO sigue en 60 por `x-robots-tag: noindex, nofollow`. Se conserva la restricción de las vistas protegidas, conforme a la guía; no se fuerza su indexación.
- Hay evidencia de mejora del dashboard tras el cambio de código, con las limitaciones indicadas, pero no de una optimización de Proveedores. No está completo el requisito de mejora demostrada en cada frontend. El error previo de hidratación de React sigue presente; no se afirma ausencia absoluta de regresiones funcionales.
- Aprendizaje: medir la URL correcta y mantener iguales navegador, extensiones, dispositivo, datos y modo de ejecución es indispensable para comparar resultados.

## Pendientes para la entrega

- [ ] Completar las seis combinaciones de página/dispositivo, incluyendo la home corporativa o una adaptación acordada a la aplicación real.
- [x] Implementar el skeleton del resumen y validar compilación y tests.
- [x] Registrar los JSON después del skeleton en Mobile y Desktop y compararlos con la referencia de producción.
- [ ] Repetir mediciones en un perfil limpio para confirmar estabilidad y revisar el aumento del TBT Mobile.
- [ ] Investigar por separado el error previo de hidratación de React.
- [ ] Extraer e integrar al menos un componente reutilizable o Custom Hook de los candidatos documentados.
- [ ] Repetir mediciones comparables en producción y registrar las cuatro puntuaciones, métricas y capturas finales en `audit/after/`.
- [ ] Verificar visualmente y probar los flujos afectados en móvil y escritorio, sin sacrificar funcionalidades para subir puntuaciones.
- [ ] Sustentar al menos una mejora de puntuación en cada frontend con mediciones equivalentes, conforme a la consigna; no inventar mejoras donde no hay evidencia.
- [ ] Completar las tablas finales, commits independientes y entrega en el mismo repositorio de empresa.