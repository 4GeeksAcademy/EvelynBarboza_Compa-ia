# Propuesta de Arquitectura Backend para TrackFlow

## 1. Contexto y objetivo

TrackFlow es una empresa de logística de última milla y gestión de almacenes que opera en Estados Unidos y España, con almacenes en Los Ángeles y Zaragoza. El contexto actual del proyecto muestra una operación fragmentada entre sistemas distintos, con procesos manuales en inventario, asignación de transportistas, devoluciones, soporte y reporting ejecutivo.

El objetivo de este documento es proponer una arquitectura técnica para el futuro backend del proyecto transversal, alineada con el negocio real descrito en el repositorio y con una estructura reconocible para una aplicación FastAPI. Este entregable es documental: no define implementación funcional ni tecnologías no respaldadas por el contexto actual.

La propuesta parte de cuatro hechos observables en el repositorio:

- El negocio real está definido en CONTEXT.md alrededor de inventario, envíos, transportistas, devoluciones, clientes y operación ejecutiva.
- Ya existe lógica de negocio inicial modelada en TypeScript para productos, envíos, carriers, devoluciones y métricas operativas.
- El monorepo separa explícitamente interfaces de usuario y servicios backend.
- El frontend y el backend deben considerarse sistemas separados que se comunican por API HTTP.

Trazabilidad principal de este contexto:

- Contexto empresarial, áreas operativas, usuarios y flujos: CONTEXT.md.
- Narrativa pública del servicio y prioridades operativas (inventario, transportistas, devoluciones, CX): /index.html.
- Captura de datos de entrada desde interfaz pública: application.html y validation.js.
- Modelado inicial de entidades y reglas de negocio logísticas: src/types/models.ts, src/utils/transformations.ts y src/utils/validations.ts.
- Separación estructural frontend/backend en el monorepo: uis/README.es.md y services/README.es.md.

## 2. Características del sistema y necesidades arquitectónicas

La arquitectura propuesta debe responder a las características reales de TrackFlow:

- Opera sobre procesos de negocio conectados entre sí, no sobre un único CRUD aislado.
- Maneja datos operativos sensibles y reglas internas que no deben exponerse en el frontend.
- Necesita una visión unificada de inventario, envíos, carriers y devoluciones entre dos países.
- Tiene usuarios internos y externos con intereses distintos sobre la misma operación.
- Requiere una base técnica que permita crecer hacia integración, automatización y reporting sin introducir complejidad excesiva desde el inicio.

Estas características implican varias necesidades arquitectónicas:

- Separación clara entre capa HTTP, lógica de negocio, modelos de datos y configuración.
- Organización por dominios del negocio, no solo por pantallas o por tablas.
- Contratos de API estables entre frontend y backend.
- Configuración por entorno para soportar desarrollo y producción con orígenes distintos.
- Capacidad de evolucionar sin partir en múltiples servicios demasiado pronto.

Esta caracterización se apoya en la operación descrita en CONTEXT.md y en los artefactos ya construidos del repositorio: interfaz corporativa en /index.html, formulario en application.html y reglas de negocio iniciales en src/utils/transformations.ts.

## 3. Patrón arquitectónico elegido

El patrón elegido es un **monolito modular por dominios**, implementado con **arquitectura por capas** dentro de una aplicación FastAPI.

Esto significa:

- Una sola aplicación backend en esta etapa.
- Módulos separados por dominios del negocio.
- Routers HTTP separados de servicios, schemas, modelos y configuración.
- Dependencias compartidas centralizadas.

Principio explícito de diseño en capa API:

- Los routers manejan únicamente la capa HTTP/API (entrada/salida, validación de contrato e invocación de casos de uso).
- La lógica de negocio no debe implementarse directamente dentro de routers.

No se propone una arquitectura de microservicios ni una arquitectura dirigida por eventos como patrón principal para esta etapa.

## 4. Justificación de la elección según nuestra empresa

La elección del monolito modular responde a la naturaleza operativa de TrackFlow.

En el contexto del repositorio, el negocio no está dividido en unidades independientes con límites técnicos ya estabilizados. Al contrario, el inventario alimenta los envíos, los envíos dependen de transportistas, las devoluciones impactan inventario y soporte, y los KPIs ejecutivos se construyen sobre la operación completa. Separar prematuramente estos flujos en varios servicios haría más difícil coordinar reglas, datos y contratos cuando todavía no existe una API base consolidada.

Un monolito modular es más adecuado porque:

- Permite construir una API unificada para una operación logística altamente conectada.
- Mantiene bajo control la complejidad operativa inicial.
- Facilita compartir reglas de negocio entre dominios que hoy están muy relacionados.
- Encaja con el estado actual del proyecto, donde aún no hay backend implementado en services.
- Permite crecer por módulos sin bloquear una futura evolución a componentes más separados si el negocio lo exigiera.

La justificación anterior está respaldada por la interdependencia operativa documentada en CONTEXT.md y por el modelado inicial de entidades conectadas en src/types/models.ts (producto, envío, carrier, devolución, movimientos de inventario).

### Alternativas menos adecuadas en este contexto

| Alternativa | Por qué es menos adecuada ahora |
| --- | --- |
| Microservicios | Introducen complejidad de despliegue, observabilidad, coordinación y contratos internos antes de tener estabilizado el dominio y la primera API. |
| Backend organizado solo por CRUD o por tablas | Reduce demasiado un negocio que en el repositorio está definido por flujos operativos conectados, no por entidades aisladas. |
| Arquitectura orientada a eventos desde el inicio | Puede ser útil en evolución futura, pero el contexto actual no justifica convertirla en el patrón principal del primer backend. |

## 5. Estructura de carpetas y módulos propuesta

La propuesta respeta la estructura real del monorepo: el backend debe vivir dentro de services como un servicio concreto.

```text
services/
└── trackflow-api/
    ├── app/
    │   ├── main.py
    │   ├── api/
    │   │   └── routers/
    │   │       ├── inventory.py
    │   │       ├── shipments.py
    │   │       ├── carriers.py
    │   │       ├── returns.py
    │   │       ├── customers.py
    │   │       ├── operations.py
    │   │       └── executive.py
    │   ├── domains/
    │   │   ├── inventory/
    │   │   ├── shipments/
    │   │   ├── carriers/
    │   │   ├── returns/
    │   │   ├── customers/
    │   │   ├── operations/
    │   │   └── executive/
    │   ├── schemas/
    │   ├── models/
    │   ├── services/
    │   ├── repositories/
    │   ├── core/
    │   └── deps/
    └── tests/
        ├── api/
        ├── services/
        └── integration/
```

### Responsabilidad de cada parte

| Elemento | Responsabilidad |
| --- | --- |
| main.py | Punto de entrada de FastAPI. Crea la aplicación, registra routers, configura CORS, middlewares y settings globales. |
| api/routers | Expone la interfaz HTTP. Recibe requests, valida con schemas, delega a servicios y devuelve respuestas. |
| domains | Agrupa el conocimiento del negocio por dominio para evitar mezclar responsabilidades entre inventario, envíos, devoluciones y otras áreas. |
| schemas | Define contratos de entrada y salida de la API usando Pydantic. |
| models | Representa modelos de persistencia. Su diseño exacto queda pendiente hasta definir la capa de almacenamiento. |
| services | Contiene la lógica de negocio y la orquestación de casos de uso. |
| repositories | Aísla el acceso a persistencia e integraciones de bajo nivel cuando sea necesario. |
| core | Centraliza configuración, settings y utilidades transversales. |
| deps | Reúne dependencias reutilizables de FastAPI, como settings, acceso a sesión y futuras dependencias de autenticación. |
| tests | Separa pruebas de API, servicios e integración para validar el backend por capas. |

### Relación entre domains y services

Para evitar ambigüedad, domains y services no representan la misma capa:

- domains: organiza el backend por fronteras de negocio (inventory, shipments, carriers, returns, customers, operations, executive). Define el contexto funcional y evita mezclar conceptos de áreas distintas.
- services: implementa los casos de uso y reglas de negocio reutilizables invocados desde la capa API. Es la capa donde vive la lógica operativa, no en routers.

En otras palabras, domains responde al eje de organización del negocio; services responde al eje de ejecución de reglas de negocio.

### Decisiones pendientes

- La base de datos concreta no está definida en el repositorio actual.
- El tipo exacto de ORM o mecanismo de persistencia no puede cerrarse todavía.
- La necesidad de separar adapters o clients externos se evaluará cuando se definan integraciones concretas.

## 6. Criterio de separación por dominio/responsabilidad

La separación por dominio se define según áreas reales del negocio presentes en el contexto, no por preferencia técnica abstracta.

| Dominio | Responsabilidad | Datos principales | Operaciones probables | Motivo de separación |
| --- | --- | --- | --- | --- |
| Inventory | Unificar visibilidad y movimientos de stock entre almacenes | SKU, stock, almacén, umbrales, movimientos | Consultar stock, registrar movimientos, alertar bajo stock | Impacta múltiples áreas y necesita reglas propias de disponibilidad y estado |
| Shipments | Gestionar el ciclo operativo de los envíos | origen, destino, prioridad, estado, carrier, valor declarado | Crear envíos, consultar estado, actualizar tracking | Tiene estados y flujo propios distintos del inventario o devoluciones |
| Carriers | Gestionar catálogo y selección de transportistas | tarifas, cobertura, confiabilidad, peso máximo, prioridades | Consultar carriers, evaluar compatibilidad, recomendar transportista | Contiene lógica de selección y rendimiento específica |
| Returns | Gestionar la logística inversa | motivo, aprobación, estado, resolución | Crear devolución, aprobar o rechazar, registrar resolución | Tiene decisiones y reglas distintas del flujo de entrega |
| Customers | Representar marcas cliente y su relación operativa | datos de cliente, vínculos operativos, futuras reglas configurables | Consultar clientes, asociar operación por cliente | El contexto sí muestra clientes B2B con necesidades distintas |
| Operations | Consolidar visión operativa del día a día | estados agregados, incidencias, métricas operativas | Consultar dashboard operativo, resúmenes e incidencias | Es una vista transversal enfocada en ejecución interna |
| Executive | Consolidar KPIs para dirección | KPIs globales por país, comparativas, resúmenes | Consultar KPIs, comparativas y resúmenes ejecutivos | Consume datos agregados con foco distinto al operativo |

### Dominios que no se formalizan todavía

- CX o tickets como módulo propio: el contexto lo menciona, pero el repositorio aún no aporta modelos ni flujos concretos suficientes para diseñarlo con precisión.
- CRM o billing: aparecen de forma tangencial, sin información suficiente para proponer estructura detallada.

## 7. Organización de routers y endpoints de FastAPI

Los routers no deben concentrarse en un único archivo ni organizarse por pantalla. Deben agruparse por dominio para reflejar la estructura real del negocio y mantener la API legible.

### Criterios de organización

- Un router por dominio principal.
- Prefijos de ruta versionados.
- Tags coherentes por dominio para la documentación automática.
- Endpoints transaccionales separados de endpoints agregados.
- Routers limitados a responsabilidades HTTP/API, delegando la lógica de negocio a services.

### Ejemplos conceptuales de agrupación

| Router | Prefijo conceptual | Responsabilidad |
| --- | --- | --- |
| inventory router | /api/v1/inventory | Exponer stock, movimientos y alertas de inventario |
| shipments router | /api/v1/shipments | Gestionar envíos, estados y tracking |
| carriers router | /api/v1/carriers | Consultar catálogo y recomendación de transportistas |
| returns router | /api/v1/returns | Gestionar devoluciones, aprobación y resolución |
| customers router | /api/v1/customers | Consultar clientes y su vínculo con la operación |
| operations router | /api/v1/operations | Exponer vistas agregadas para operación diaria |
| executive router | /api/v1/executive | Exponer KPIs y resúmenes para dirección |

### Ejemplos conceptuales de rutas HTTP

| Grupo | Ejemplos conceptuales |
| --- | --- |
| Inventory | GET /api/v1/inventory/sku/{sku}, GET /api/v1/inventory/alerts/low-stock, POST /api/v1/inventory/movements |
| Shipments | GET /api/v1/shipments, POST /api/v1/shipments, GET /api/v1/shipments/{shipment_id}, PATCH /api/v1/shipments/{shipment_id}/status |
| Carriers | GET /api/v1/carriers, GET /api/v1/carriers/{carrier_id}, POST /api/v1/carriers/recommendation |
| Returns | GET /api/v1/returns, POST /api/v1/returns, PATCH /api/v1/returns/{return_id}/approval, PATCH /api/v1/returns/{return_id}/resolution |
| Customers | GET /api/v1/customers, GET /api/v1/customers/{customer_id}, GET /api/v1/customers/{customer_id}/shipments |
| Operations | GET /api/v1/operations/dashboard, GET /api/v1/operations/summary |
| Executive | GET /api/v1/executive/kpis, GET /api/v1/executive/countries-comparison, GET /api/v1/executive/weekly-summary |

Estos endpoints son conceptuales y documentales. No representan una definición cerrada ni una implementación comprometida.

## 8. Convenciones de estructura de proyectos FastAPI investigadas

La investigación sobre FastAPI muestra varias convenciones comunes en proyectos pequeños y medianos:

- main.py como punto de entrada del servidor.
- Routers separados y registrados con APIRouter e include_router.
- Agrupación de routers por recurso o dominio.
- Uso de schemas Pydantic para requests y responses.
- Separación entre modelos de API y modelos de persistencia.
- Servicios o capa de negocio entre routers y acceso a datos.
- Configuración central mediante settings y variables de entorno.
- Dependencias reutilizables centralizadas para DB, settings, autenticación y otros componentes.
- Tests organizados fuera de la app, frecuentemente por tipo de prueba.

Estas convenciones no obligan a replicar una plantilla fija, pero sí ofrecen una base clara para una aplicación que deba crecer con orden.

## 9. Cómo esas convenciones influyeron en nuestra propuesta

La propuesta backend para TrackFlow adopta esas convenciones solo cuando ayudan a resolver necesidades reales del proyecto.

| Convención FastAPI | Cómo impacta la propuesta |
| --- | --- |
| main.py delgado | Se propone un punto de entrada limitado a configuración y registro, evitando lógica de negocio mezclada |
| Routers separados | Se usan routers por dominio para reflejar la estructura operativa de TrackFlow |
| Schemas Pydantic | Se consideran necesarios porque frontend y backend estarán desacoplados por API |
| Servicios separados | Se incorporan para aislar reglas como selección de carrier, validaciones y métricas operativas |
| Configuración central | Se considera esencial por la separación de entornos y la necesidad de CORS |
| Dependencias reutilizables | Se incluyen para evitar repetir wiring transversal entre routers |

### Convenciones no introducidas todavía

- Microservicios o múltiples apps independientes.
- Event bus o arquitectura asíncrona como eje principal.
- Esquema de autenticación definitivo.
- Infraestructura de despliegue cerrada.

Estas decisiones se mantienen pendientes porque el repositorio actual no ofrece evidencia suficiente para fijarlas con rigor.

## 10. Frontend y backend como sistemas separados

La estructura del repositorio ya distingue interfaces de usuario en uis y servicios backend en services. Esa separación debe mantenerse también a nivel arquitectónico.

Trazabilidad de esta separación en el repositorio:

- Convención de frontends en uis: uis/README.es.md.
- Convención de backends en services: services/README.es.md.
- Ejemplo de frontend desacoplado por URL de API: uis/talent-pipeline-tracker/services/records.service.ts.

El frontend debe encargarse de:

- presentación;
- navegación;
- formularios;
- validación orientada a experiencia de usuario;
- consumo de datos expuestos por la API.

El backend debe encargarse de:

- reglas de negocio;
- validación de dominio;
- acceso a datos;
- consolidación de operación;
- integración con sistemas internos o externos;
- control de acceso cuando corresponda.

Esta decisión es especialmente importante porque el contexto real describe información y procesos que no deben quedar expuestos en el cliente, como rendimiento histórico de transportistas, reglas de aprobación de devoluciones, consolidación operativa y acceso a sistemas internos.

```mermaid
flowchart LR
    FE[Frontend] -->|API HTTP JSON| API[Capa API/HTTP]
    API --> BE[Backend FastAPI]
    BE --> BL[Logica de negocio]
    BL --> PS[Persistencia / servicios internos]
```

## 11. Comunicación mediante API

La comunicación propuesta entre frontend y backend es mediante API HTTP con intercambio de JSON.

### Implicaciones a documentar

- El frontend no debe acceder directamente a persistencia ni a sistemas internos.
- El backend se convierte en la única capa responsable de exponer datos y ejecutar lógica.
- Las respuestas deben seguir contratos claros y estables.
- La API debe versionarse para facilitar evolución sin romper clientes.

### Contrato de API

Debe documentarse un contrato claro al menos en estos puntos:

- estructura de request y response;
- nombres de campos;
- formatos de fecha y hora;
- códigos de estado HTTP;
- manejo de errores.

Esto es importante porque el frontend existente en el repositorio ya muestra la necesidad de conocer la URL base del backend por configuración y también evidencia que una API inconsistente obliga al cliente a normalizar estructuras distintas. En la propuesta futura conviene evitar esa situación para los dominios logísticos.

Trazabilidad concreta de esta observación:

- Configuración de URL base por entorno en frontend: uis/talent-pipeline-tracker/services/records.service.ts.
- Normalización de múltiples formas de respuesta en frontend: uis/talent-pipeline-tracker/app/page.tsx y uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx.

## 12. CORS y variables de entorno

Si frontend y backend se despliegan en orígenes diferentes, el navegador aplicará restricciones de cross-origin. Por eso debe documentarse CORS como parte de la arquitectura.

### CORS

CORS será necesario cuando:

- el frontend corra en un dominio distinto al backend;
- el frontend local de desarrollo consuma un backend en otro puerto o servidor;
- existan múltiples UIs que compartan la misma API.

La propuesta debe contemplar:

- lista explícita de orígenes permitidos;
- configuración distinta entre desarrollo y producción;
- restricción de orígenes en producción a los clientes realmente autorizados.

### Variables de entorno

Debe documentarse que la URL base del backend no debe quedar hardcodeada en el frontend.

Decisiones que sí conviene establecer:

- El frontend debe leer la URL del backend desde variables de entorno.
- El backend debe leer sus propias settings desde variables de entorno o un sistema equivalente de configuración.
- Los secretos y credenciales deben permanecer exclusivamente en el backend.

### Decisiones pendientes

- Nombres exactos de todas las variables de entorno del backend.
- Estrategia final de despliegue y gestión de secretos.

## 13. Riesgos y puntos de atención

| Riesgo | Impacto | Mitigación propuesta |
| --- | --- | --- |
| Contrato de API inestable entre frontend y backend | Rompe clientes, duplica adaptación en frontend y dificulta evolución | Definir schemas explícitos, respuestas consistentes y versionado de API |
| Mezcla de lógica de negocio entre frontend y backend | Genera reglas inconsistentes y errores difíciles de rastrear | Centralizar lógica en services del backend y dejar en frontend solo validación de UX |
| Crecimiento desordenado del backend sin límites de dominio | Produce routers grandes, acoplamiento alto y cambios con efectos colaterales | Modularizar desde el inicio por dominios reales y mantener separación por capas |
| Exposición de información sensible o interna al cliente | Riesgo operativo y de seguridad sobre datos de inventario, carriers o sistemas internos | Mantener secretos, integraciones y reglas internas exclusivamente en backend |

### Puntos de atención adicionales

- La autenticación y autorización sí parecen necesarias en el futuro por la existencia de múltiples tipos de usuarios, pero el mecanismo concreto sigue siendo una decisión pendiente.
- Los modelos de persistencia deben diseñarse cuando se defina la estrategia de almacenamiento, evitando asumir prematuramente una base relacional o no relacional sin respaldo documental.

## 14. Conclusión

La propuesta más adecuada para el backend de TrackFlow en esta etapa es una aplicación FastAPI organizada como monolito modular por dominios y por capas. Esta decisión responde a la realidad del negocio: una operación logística integrada donde inventario, envíos, carriers, devoluciones y reporting comparten reglas y datos.

La arquitectura propuesta no intenta resolver anticipadamente problemas que el repositorio todavía no define, como microservicios, mensajería, autenticación cerrada o infraestructura final. En cambio, establece una base sólida, entendible y escalable para construir una primera API backend coherente con el contexto real del proyecto y con la separación entre frontend y backend ya visible en el monorepo.

## 15. Referencias utilizadas para las convenciones de FastAPI

- FastAPI Documentation. Bigger Applications - Multiple Files. https://fastapi.tiangolo.com/tutorial/bigger-applications/
- FastAPI Documentation. Dependencies. https://fastapi.tiangolo.com/tutorial/dependencies/
- FastAPI Documentation. Security. https://fastapi.tiangolo.com/tutorial/security/
- FastAPI Documentation. Settings and Environment Variables. https://fastapi.tiangolo.com/advanced/settings/
- Pydantic Documentation. https://docs.pydantic.dev/
- SQLAlchemy Documentation. https://docs.sqlalchemy.org/