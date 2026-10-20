# Informe de caching

Fecha: 2026-10-19. Alcance: Next.js en `uis/backoffice`, FastAPI de incidencias
en `services/api` y FastAPI de autenticacion/inventario en `services-aut/api`.

## Evidencia y metodo

No hay telemetria de produccion disponible en este encargo. Las frecuencias de
las tablas siguientes son **hipotesis de carga**, no conteos observados. Los
costes de endpoints no seleccionados son evaluaciones del codigo, no latencias
medidas. Antes de dimensionar produccion deben contrastarse con trafico real.

Ambas aplicaciones incorporan middleware con `perf_counter`, logger `api.timing`
y cabecera `Server-Timing: app;dur=...`. Registra metodo, plantilla de ruta,
estado y milisegundos; no registra tokens, cuerpos, query strings ni IDs reales.
Configurar ese logger a nivel INFO permite observar las peticiones repetidas.
La cabecera mide el trabajo hasta obtener la respuesta, no la descarga en red.

`scripts/benchmark_caching.py` genera y elimina bases locales temporales. No
modifica las bases habituales ni carga datos en Supabase. Se ejecutaron 15
repeticiones por combinacion y se informa la mediana, no una garantia de SLA.
`--uncached` ejecuta el calculo original sin leer ni escribir la cache. En modo
cacheado la primera operacion es un miss y la mediana representa hits calientes.

- Incidencias: de 20 a 10.000 filas, categorias, estados, origenes y sedes
  validos y variados; titulos y descripciones distintos y fechas escalonadas.
- Inventario: de 20 a 10.000 movimientos y de 1 a 500 SKU, con claves foraneas
  reales, 12 clientes, 8 categorias, 4 almacenes, 20 operadores y cantidades
  variadas. Las salidas no exceden el stock acumulado de cada producto.
- Entorno: contenedor Linux, Python 3.14, TinyDB para incidencias y SQLite para
  simular el SQL de inventario. Los tiempos de PostgreSQL, red, autenticacion
  real y concurrencia distribuida **no** fueron medidos. El benchmark de
  inventario sustituye la autenticacion por un usuario fijo; las pruebas de
  integracion verifican separadamente el rechazo de accesos sin autenticar.

| Endpoint | Filas | Funcion sin cache (ms) | Funcion hit (ms) | HTTP sin cache (ms) | HTTP hit (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| GET /api/incidents/summary | 20 | 0.346 | 0.011 | 1.860 | 1.443 |
| GET /api/incidents/summary | 10.000 | 124.603 | 0.010 | 122.177 | 1.424 |
| GET /inventory/orders | 20 | 0.810 | 0.186 | 2.946 | 2.071 |
| GET /inventory/orders | 10.000 | 148.484 | 69.727 | 258.212 | 150.188 |

HTTP incluye la serializacion y el transporte en proceso de TestClient. Funcion
y HTTP se muestrean por separado; una mediana HTTP ligeramente menor que la
de funcion no implica tiempo negativo de transporte. Con pocas filas la mejora
es modesta. Con 10.000, el resumen reduce su tiempo HTTP un 98.8% y el historial
un 41.8%. El coste residual de este ultimo justifica evaluar paginacion en otro
encargo, no extender la cache indiscriminadamente.

## Decisiones en el frontend

### Dos componentes con carga diferida

`IncidentDashboard` y `IncidentForm` se importan mediante `next/dynamic` desde
sus paginas cliente en `/incidents/dashboard` y `/incidents/new`, con
`ssr: false`. Son vistas operativas distintas: consultar el panel no requiere
cargar el formulario, y registrar una incidencia no requiere el panel completo.
No son contenido SEO y sus datos/interacciones dependen del navegador.

El encabezado de cada pagina queda separado de su componente interactivo. Los
fallbacks anuncian carga con `role="status"` y reservan 480 px para reducir
saltos durante la descarga. No se agregaron botones o pasos extra al flujo.

Next 16 indica que importar dinamicamente un Client Component desde un Server
Component no garantiza code splitting automatico. Por eso los imports se
declaran en paginas cliente, fuera del render, siguiendo la guia instalada.

El build de produccion confirmo dos chunks independientes: dashboard 11.062
bytes (3.350 gzip) y formulario 7.847 bytes (2.502 gzip). Son tamanos de los
chunks actuales, **no** una reduccion medida del bundle total. Next ya dividia
por rutas: la mejora adicional es separar la logica interactiva del shell de
la pagina y posponer su montaje hasta el cliente. El prefetch de Next puede
adelantar descargas; no se afirma una mejora medida de TTI/LCP ni una ausencia
absoluta de descargas anticipadas. El cambio introduce un posible instante de
fallback y un viaje adicional por chunk en una visita sin cache de navegador.

### Un calculo no trivial con useMemo

El dashboard antes construia un `Intl.DateTimeFormat` por incidencia en cada
render. Para 1.000 filas, un microbenchmark en Node con cinco muestras obtuvo
81.23 ms de mediana. Reutilizar un formateador para todo el recorrido redujo
el calculo a 1.58 ms. No es un perfil de React ni una medicion de pintura DOM.

Ahora `useMemo` produce las filas con fechas formateadas y un unico formateador;
su dependencia es `[incidents]`. Una nueva lista o una actualizacion optimista
de estado cambia esa referencia y recalcula correctamente. Cambios solo en el
resumen, loading, errores o IDs pendientes reutilizan el resultado y evitan el
recorrido O(n). Hay un coste de memoria O(n) por las filas derivadas, acotado a
la vida del componente, sin retener datos al cerrar la pagina.

La prueba existente del resumen ahora espia el getter de `format`: recibir el
resumen manteniendo la misma lista no vuelve a formatear las fechas. No se
memoizaron `Object.entries` de cuatro grupos pequenos, conteos triviales ni
etiquetas estaticas. Un perfil completo en React DevTools queda pendiente.

## Inventario de endpoints FastAPI

Frecuencia hipotetica por instancia durante carga: alta = 30-60/min; media =
5-20/min; baja = 0-5/min. Los cambios expresan estabilidad esperada, no eventos
observados. N = registros leidos, M = movimientos y P = productos.

### API de incidencias y proveedores

| Metodo y ruta | Coste de la operacion | Frecuencia | Cambios subyacentes | Decision |
| --- | --- | --- | --- | --- |
| GET / | Constante, sin DB | Baja, health check | Solo despliegue | No: trivial |
| POST /api/incidents/analyze | Parseo y agregacion O(N) de CSV | Baja | Cada fichero es diferente | No: carga de usuario |
| GET /api/incidents/results/export | Serializacion del ultimo analisis | Baja | Cada analisis | No: estado global no aislado |
| POST /api/incidents | Validacion y escritura JSON | Media | Cada registro | No; invalida resumen |
| GET /api/incidents | Lectura JSON, filtros y validacion O(N) | Alta | Altas y estados durante el dia | No: descripciones privadas |
| GET /api/incidents/summary | Lectura, validacion y cuatro agregaciones O(N) | Alta | Altas y estados; tolera pequenos retrasos | Si: TTL 30 s |
| GET /api/incidents/{incident_id} | Lectura JSON y validacion individual | Media | Cambios de estado | No: detalle operativo |
| PATCH /api/incidents/{incident_id}/status | Validacion de transicion y escritura | Media | Cada transicion | No; invalida resumen |
| POST /suppliers | Validacion y escritura JSON | Baja | Alta de proveedor | No: escritura |
| GET /suppliers | Lectura JSON, filtros pais/categoria y validacion O(N) | Alta | Catalogo diario, tarifas y suspensiones | No: contactos/tarifas sin autenticacion |
| GET /suppliers/{supplier_id} | Lectura JSON y validacion individual | Media | Tarifas/estado | No: datos comerciales |
| PATCH /suppliers/{supplier_id}/rate | Escritura JSON | Baja | Revision de tarifa | No: escritura |
| PATCH /suppliers/{supplier_id}/status | Escritura JSON | Baja | Suspension/reactivacion | No: escritura |
| DELETE /suppliers/{supplier_id} | Escritura JSON | Baja | Baja del proveedor | No: escritura |

### API de autenticacion e inventario

| Metodo y ruta | Coste de la operacion | Frecuencia | Cambios subyacentes | Decision |
| --- | --- | --- | --- | --- |
| GET / | Constante, sin DB | Baja, health check | Solo despliegue | No: trivial |
| POST /auth/login | Consulta y verificacion bcrypt | Media | Credenciales, activacion | No: seguridad |
| GET /auth/me | JWT, usuario y perfil | Alta | Perfil, rol, tema, activacion | No: sesion personalizada |
| PATCH /auth/me/preferences | Actualizacion TinyDB | Baja | Cada cambio de tema | No: escritura |
| POST /auth/forgot-password | Token, escritura y envio externo | Baja | Cada solicitud | No: efecto externo sensible |
| POST /auth/reset-password | Validacion de token y hash bcrypt | Baja | Clave y token de un uso | No: seguridad |
| POST /auth/change-password | Verificacion y hash bcrypt | Baja | Clave de usuario | No: seguridad |
| POST /users | Hash, usuario y perfil | Baja | Cada registro | No: escritura |
| GET /users | Auth admin y listado TinyDB O(N) | Baja | Altas, roles, bajas | No: datos personales |
| GET /users/{user_id} | Auth y lectura individual | Baja | Perfil/rol/activacion | No: datos personales |
| PUT /users/{user_id} | Auth y actualizacion TinyDB | Baja | Cada edicion | No: escritura |
| DELETE /users/{user_id} | Auth y eliminacion TinyDB | Baja | Cada baja | No: escritura |
| GET /profiles/me | Auth y lectura TinyDB | Media | Edicion del propietario | No: direccion/telefono |
| PUT /profiles/me | Auth y actualizacion TinyDB | Baja | Cada edicion | No: escritura |
| GET /profiles | Auth admin y listado O(N) | Baja | Altas y ediciones | No: datos personales |
| GET /profiles/{user_id} | Auth y lectura individual | Baja | Edicion del perfil | No: datos personales |
| PATCH /profiles/{user_id} | Auth y actualizacion TinyDB | Baja | Cada edicion | No: escritura |
| GET /inventory/products | 1 consulta + 2 SUM por SKU, coste N+1 | Alta | Cada movimiento cambia stock | No: stock operativo sensible a frescura |
| POST /inventory/products | INSERT y commit SQL | Baja | Alta de SKU | No: escritura |
| GET /inventory/products/{product_id} | Lectura SKU y dos SUM | Media | Entradas/salidas | No: stock actualizado |
| GET /inventory/orders | Dos joins, transformacion O(M), orden O(M log M) | Alta | Nuevos movimientos; historial append-only | Si: usuario + TTL 15 s |
| POST /inventory/orders/inbound | INSERT y commit SQL | Media | Entrada de stock | No; invalida historial |
| POST /inventory/orders/outbound | SUM, comprobacion, INSERT y commit | Media | Salida de stock | No; invalida historial |

Ambas aplicaciones exponen ademas GET `/openapi.json`, `/docs`,
`/docs/oauth2-redirect` y `/redoc` automaticamente. Son metadatos/documentacion
de bajo trafico, estables entre despliegues y sin consultas de negocio. No se
anade una cache de aplicacion; FastAPI ya reutiliza su esquema OpenAPI.

## Decisiones en el backend

`packages/shared/cache.py` implementa una cache en proceso con reloj monotono,
TTL absoluto desde que finaliza el loader, capacidad LRU y copias independientes
de los valores. Expirar no renueva el TTL en hits. Los elementos vencidos se
eliminan al consultar; no hay un recolector de fondo. Una excepcion del loader
no se almacena. El bloqueo protege lecturas/inserciones/invalidaciones y evita
que misses concurrentes calculen la misma entrada varias veces, a cambio de
serializar tambien misses de claves distintas dentro de cada cache.

### GET /api/incidents/summary

Cachea solo los conteos agregados que la API ya devuelve, sin descripciones,
titulos, emails ni informacion de sesion. Clave: ruta de la base TinyDB, una
sola entrada de TTL 30 s. Costo alto medido a 10.000 filas; se espera repeticion
al abrir el panel y actualizarlo desde multiples estaciones.

`create_incident` y `update_incident_status` invalidan despues de escribir,
incluidas las llamadas directas desde el seeder habitual. El siguiente GET
recalcula todas las dimensiones; no se invalida por escrituras de proveedores
que no afectan a estos conteos.

### GET /inventory/orders

Clave: `(motor SQL, UUID del usuario autenticado)`; TTL 15 s y maximo 32
entradas. Antes, este GET no exigia autenticacion pese a devolver UUID de
operadores. Ahora ejecuta `get_current_user` **antes de todo hit**, como las
escrituras de inventario. El frontend existente ya envia el bearer token.
La ausencia de token pasa a devolver 401, cambio de contrato deliberado para
evitar introducir una cache compartida de datos privados. No se usan tokens
en bruto ni IDs enviados en query/payload como identidad de cache.

El historial operacional sigue teniendo el mismo alcance funcional para los
usuarios autenticados; esta optimizacion no introduce permisos por propietario
ni sustituye una futura politica de autorizacion por almacen o cliente.
`Cache-Control: private, no-store` evita almacenar esta respuesta en proxies
o navegador; solo existe la copia privada en el proceso backend.

Los commits de entradas y salidas invalidan **todas** las claves de usuario:
una escritura afecta el historial que consultan otros operadores. Una salida
rechazada no invalida y no escribe. La comprobacion de stock nunca usa cache.

## Intercambios reconocidos

30 s en el resumen permite absorber refrescos repetidos de un panel sin exigir
consistencia transaccional instantanea de sus indicadores. Para el historial se
eligieron 15 s, no 60 s: los operadores necesitan ver movimientos recientes,
pero la lista es informativa y no decide si se puede despachar mercancia.
Las escrituras locales invalidan inmediatamente antes de devolver su respuesta.

Un proceso distinto, cambios SQL directos o importaciones externas no ejecutan
esta invalidacion: otra instancia puede mostrar datos antiguos hasta el TTL.
Un miss vuelve a consultar la DB. No hay stale-while-revalidate ni valores
vencidos servidos deliberadamente. Reiniciar el proceso vacia la cache.

La capacidad limita el numero de entradas, no los bytes de cada historial.
32 copias grandes y los deepcopies de respuesta tienen un coste apreciable;
los 69.7 ms del hit de funcion para 10.000 movimientos lo hacen visible.
Antes de escalar a muchos usuarios/workers hacen falta mediciones de memoria,
paginacion y, si se exige invalidacion entre replicas, Redis con invalidacion
compartida. No se anadio Redis porque no existe esa infraestructura en el stack.

## Que no se cacheo y por que

Proveedores fue un candidato inicial por sus filtros y lecturas repetidas, pero
incluye contactos y tarifas y su API no autentica usuarios. No se introdujo
una clave global para esa respuesta. Tampoco se cachearon listados de
incidencias con texto libre, sesiones, perfiles, contrasenas ni flujos de
restablecimiento. Un bcrypt lento no convierte un login en candidato seguro.

Productos/stock tambien tiene coste alto por consultas N+1. El balance puede
cambiar con cada entrada/salida: evitar mostrar stock viejo y no comprometer
decisiones operativas tiene prioridad. Optimizar esas consultas con SQL agregado
es una alternativa futura, no un motivo para cachear el saldo.

La exportacion del ultimo CSV usa `LAST_ANALYSIS` global, sin aislamiento entre
sesiones en la implementacion existente. No se cachea ni se presenta como
segura para multiples usuarios; corregir ese aislamiento es un trabajo previo
a cualquier cache de exportaciones.

## Reproduccion y verificaciones

Ejecutar desde la raiz con las dependencias Python de los dos servicios y sus
grupos de pruebas instaladas. Para inventario, el script sustituye
`DATABASE_URL` por SQLite temporal; no necesita credenciales de produccion.

```bash
python scripts/benchmark_caching.py incidents --uncached
python scripts/benchmark_caching.py incidents
python scripts/benchmark_caching.py inventory --uncached
python scripts/benchmark_caching.py inventory
python -m pytest services/api/tests -q
DATABASE_URL=sqlite:///:memory: python -m pytest services-aut/api/tests -q
npm --prefix uis/backoffice test -- --runInBand --silent
npm --prefix uis/backoffice run build
npm --prefix uis/backoffice run lint -- src/app/incidents/dashboard/page.tsx src/app/incidents/new/page.tsx src/components/incidents/IncidentDashboard.tsx src/lib/incidents.test.ts
```

Resultado: 8 pruebas de API principal, 78 de API autenticada y 15 de frontend
pasaron; build y lint de archivos modificados pasaron. Se prueban hits,
expiracion al limite del TTL, capacidad, aislamiento de mutaciones, excepciones
no cacheadas, misses concurrentes, invalidacion de ambas escrituras de
inventario y de incidencias, separacion por usuario y rechazo sin token tras
calentar la cache. Se corrigio el fixture de la API principal para que tambien
redirija `DB_PATH` a un directorio temporal, no solo `DATA_DIR`.

Next advierte de multiples lockfiles al inferir la raiz de Turbopack; el build
termina correctamente. FastAPI/TestClient advierte de una futura migracion de
httpx a httpx2. No se modificaron dependencias ni lockfiles por estas advertencias.

Servidor local: `http://localhost:3000`, iniciado con
`npm --prefix uis/backoffice run dev -- --hostname 0.0.0.0 --port 3000`.
Ambas rutas devolvieron HTTP 200. Se necesita iniciar sesion para verlas y tener
las URLs/API configuradas para consultar datos reales.

La comprobacion Playwright de escritorio/movil no pudo ejecutarse: Chromium
carece de `libatk-1.0.so.0` en este contenedor. No se generaron capturas ni se
afirma haber validado visualmente layouts, Network o TTI. Quedan pendientes esa
comprobacion y React DevTools Profiler con trafico y volumen reales.