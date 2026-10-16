# Auditoría de serialización FastAPI

## A. Resumen ejecutivo

**Alcance y diagnóstico inicial (16-10-2026):** se auditaron las aplicaciones `services/api/main.py` (Trackflow Incidents API) y `services-aut/api/main.py` (Company API). Las importaciones y el código declaran FastAPI `0.142.2` y Pydantic `2.13.5` en el entorno disponible. El proyecto requiere Python `>=3.12`; la app autónoma requiere además `DATABASE_URL`.

| Métrica | Cantidad |
| --- | ---: |
| Operaciones HTTP de negocio en OpenAPI | 36 |
| Ya serializadas | 11 |
| Parcialmente serializadas | 4 |
| Sin serializar | 20 |
| Excepción técnica no JSON | 1 |
| Necesitaban cambios | 24 |
| Corregidas | 24 |
| Contratos finales validados en OpenAPI | 36 (35 JSON + 1 CSV) |
| Pendientes bloqueantes | 0 |

La extracción de OpenAPI se ejecutó sobre ambas aplicaciones: 14 operaciones en `services/api` y 22 en `services-aut/api`. FastAPI 0.142 incluye routers de forma diferida en `app.routes`; por eso el conteo se contrastó con `app.openapi()` y no únicamente con instancias `APIRoute` directas. La importación de `services-aut/api` se hizo con `DATABASE_URL=sqlite://` (SQLite en memoria). No se enviaron solicitudes de negocio en esta etapa.

Se excluyen `/docs`, `/redoc`, `/openapi.json` y `/docs/oauth2-redirect`, generadas por FastAPI. `GET /api/incidents/results/export` entrega un archivo CSV (`text/csv`), no JSON, y se registra como excepción técnica. No se encontraron WebSockets ni subaplicaciones montadas en los dos archivos de entrada inspeccionados.

### Diagnóstico inicial congelado

El estado y `response_model` de esta tabla describen el código **antes de las correcciones** y se conservan como línea base de la auditoría.

| Método | Ruta | Archivo / handler | Propósito | Estado inicial | `response_model` inicial | Problema identificado | Esquema final | Estado final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/` | `services/api/main.py` · `root` | Estado del servicio | ❌ | Ninguno | JSON sin contrato | `HealthResponse` | Validado |
| POST | `/api/incidents/analyze` | `services/api/main.py` · `analyze_incidents` | Analizar CSV | ❌ | Ninguno | Resumen estructurado sin contrato | `IncidentAnalysisResponse` | Validado |
| GET | `/api/incidents/results/export` | `services/api/main.py` · `export_results` | Descargar resultados CSV | Excepción técnica | Ninguno | Archivo `text/csv`, no es JSON | No aplica | Excepción técnica justificada |
| POST | `/api/incidents` | `services/api/routes/incidents.py` · `create_incident_endpoint` | Crear incidencia | ⚠️ | `IncidentResponse` | Respuestas JSON manuales eluden el modelo y no se declaraban | `IncidentResponse` + `IncidentValidationError` (400) | Validado |
| GET | `/api/incidents` | `services/api/routes/incidents.py` · `list_incidents_endpoint` | Listar/filtrar incidencias | ⚠️ | `list[IncidentResponse]` | Error de filtro manual sin respuesta declarada | `list[IncidentResponse]` + `IncidentValidationError` (400) | Validado |
| GET | `/api/incidents/summary` | `services/api/routes/incidents.py` · `incidents_summary_endpoint` | Resumen agregado | ✅ | `IncidentSummary` | Contrato estructurado explícito | `IncidentSummary` | Validado |
| GET | `/api/incidents/{incident_id}` | `services/api/routes/incidents.py` · `get_incident_endpoint` | Consultar incidencia | ⚠️ | `IncidentResponse` | El 404 manual eludía validación de modelo | `IncidentResponse` + `IncidentNotFoundError` (404) | Validado |
| PATCH | `/api/incidents/{incident_id}/status` | `services/api/routes/incidents.py` · `update_incident_status_endpoint` | Cambiar estado de incidencia | ⚠️ | `IncidentResponse` | Errores 400/404 manuales eludían validación | `IncidentResponse` + errores tipados (400/404) | Validado |
| POST | `/suppliers` | `services/api/routes/suppliers.py` · `create_supplier_endpoint` | Crear proveedor | ✅ | `SupplierResponse` | Contrato explícito | `SupplierResponse` | Validado |
| GET | `/suppliers` | `services/api/routes/suppliers.py` · `list_suppliers_endpoint` | Listar proveedores filtrados | ✅ | `list[SupplierResponse]` | Contrato explícito | `list[SupplierResponse]` | Validado |
| GET | `/suppliers/{supplier_id}` | `services/api/routes/suppliers.py` · `get_supplier_endpoint` | Consultar proveedor | ✅ | `SupplierResponse` | Contrato explícito | `SupplierResponse` | Validado |
| PATCH | `/suppliers/{supplier_id}/rate` | `services/api/routes/suppliers.py` · `update_supplier_rate_endpoint` | Actualizar tarifa | ✅ | `SupplierResponse` | Contrato explícito | `SupplierResponse` | Validado |
| PATCH | `/suppliers/{supplier_id}/status` | `services/api/routes/suppliers.py` · `update_supplier_status_endpoint` | Actualizar estado | ✅ | `SupplierResponse` | Contrato explícito | `SupplierResponse` | Validado |
| DELETE | `/suppliers/{supplier_id}` | `services/api/routes/suppliers.py` · `delete_supplier_endpoint` | Eliminar proveedor | ❌ | Ninguno | Respuesta JSON `{message}` sin esquema | `SupplierDeleteResponse` | Validado |
| GET | `/` | `services-aut/api/main.py` · `home` | Estado del servicio | ❌ | Ninguno | JSON sin contrato | `HealthResponse` | Validado |
| POST | `/users` | `services-aut/api/users.py` · `register` | Registrar usuario y perfil | ❌ | Ninguno | Proyección sin esquema | `RegistrationResponse` | Validado |
| GET | `/users` | `services-aut/api/users.py` · `list_users` | Listar usuarios | ❌ | Ninguno | Email de otros usuarios accesible a cualquier autenticado | `list[UserResponse]` (solo admin) | Validado |
| GET | `/users/{user_id}` | `services-aut/api/users.py` · `get_user` | Consultar usuario propio/admin | ❌ | Ninguno | Proyección manual sin contrato | `UserResponse` | Validado |
| PUT | `/users/{user_id}` | `services-aut/api/users.py` · `edit_user` | Actualizar usuario | ❌ | Ninguno | Proyección sin contrato; retorno nulo posible | `UserResponse | None` | Validado |
| DELETE | `/users/{user_id}` | `services-aut/api/users.py` · `remove_user` | Eliminar usuario | ❌ | Ninguno | Respuesta JSON `{message}` sin esquema | `MessageResponse` | Validado |
| GET | `/profiles/me` | `services-aut/api/profiles.py` · `get_my_profile` | Consultar perfil propio | ❌ | Ninguno | Registro TinyDB completo sin contrato | `ProfileResponse` | Validado |
| PUT | `/profiles/me` | `services-aut/api/profiles.py` · `edit_my_profile` | Actualizar perfil propio | ❌ | Ninguno | Registro sin contrato | `ProfileResponse` | Validado |
| GET | `/profiles` | `services-aut/api/profiles.py` · `list_profiles` | Listar perfiles | ❌ | Ninguno | Teléfono/domicilio de todos accesibles a cualquier autenticado | `list[ProfileResponse]` (solo admin) | Validado |
| GET | `/profiles/{user_id}` | `services-aut/api/profiles.py` · `get_profile_by_user` | Consultar perfil propio/admin | ❌ | Ninguno | Registro sin contrato | `ProfileResponse` | Validado |
| PATCH | `/profiles/{user_id}` | `services-aut/api/profiles.py` · `edit_profile_by_user` | Actualizar perfil propio/admin | ❌ | Ninguno | Registro sin contrato | `ProfileResponse` | Validado |
| POST | `/auth/login` | `services-aut/api/auth.py` · `login` | Emitir token de acceso | ❌ | Ninguno | Token legítimo sin contrato tipado | `LoginResponse` | Validado |
| GET | `/auth/me` | `services-aut/api/auth.py` · `get_me` | Consultar usuario autenticado | ❌ | Ninguno | Usuario y perfil anidado sin contrato | `AuthMeResponse` | Validado |
| POST | `/auth/forgot-password` | `services-aut/api/auth.py` · `forgot_password` | Solicitar recuperación genérica | ❌ | Ninguno | Mensaje genérico sin contrato | `MessageResponse` | Validado |
| POST | `/auth/reset-password` | `services-aut/api/auth.py` · `reset_password` | Restablecer contraseña | ❌ | Ninguno | Mensaje sin contrato | `MessageResponse` | Validado |
| POST | `/auth/change-password` | `services-aut/api/auth.py` · `change_password` | Cambiar contraseña autenticado | ❌ | Ninguno | Mensaje sin contrato | `MessageResponse` | Validado |
| POST | `/inventory/orders/inbound` | `services-aut/api/routers/inventory.py` · `create_inbound_order` | Registrar entrada de stock | ✅ | `StockEntryResponse` | Contrato explícito; actor deriva de autenticación | `StockEntryResponse` | Validado |
| POST | `/inventory/orders/outbound` | `services-aut/api/routers/inventory.py` · `create_outbound_order` | Registrar salida de stock | ✅ | `StockExitResponse` | Contrato explícito; actor deriva de autenticación | `StockExitResponse` | Validado |
| GET | `/inventory/products` | `services-aut/api/routers/inventory.py` · `get_products` | Listar productos con stock | ✅ | `list[SKUResponse]` | Contrato explícito | `list[SKUResponse]` | Validado |
| POST | `/inventory/products` | `services-aut/api/routers/inventory.py` · `create_product` | Crear producto | ✅ | `SKUResponse` | Contrato explícito | `SKUResponse` | Validado |
| GET | `/inventory/products/{product_id}` | `services-aut/api/routers/inventory.py` · `get_product` | Consultar producto con stock | ✅ | `SKUResponse` | Contrato explícito | `SKUResponse` | Validado |
| GET | `/inventory/orders` | `services-aut/api/routers/inventory.py` · `get_orders` | Listar movimientos de stock | ❌ | Ninguno | JSON `sku` anidado sin contrato; modelo existente no coincidía | `list[OrderResponse]` | Validado |

## B. Inventario final

La tabla anterior es el inventario final, en correspondencia uno a uno con el registro OpenAPI: 36 filas, 36 operaciones únicas contando la aplicación, método y ruta. Se revalidará al cierre contra OpenAPI. Los estados iniciales siguen congelados en sus columnas originales.

## C. Fichas detalladas por endpoint

Los campos y tipos de salida descritos debajo se basan en los esquemas y handlers. Cuando no se indica una petición ejecutada, los valores concretos se consideran inferidos por análisis estático, no payloads observados.

### `services/api`

#### GET `/`
Handler `services/api/main.py:root`; estado del servicio, sin consumidor HTTP encontrado. Entrada: ninguna. Salida original inferida: `{message: str}`; sin `response_model` inicial (❌). Consumidor: ninguno identificado; campos necesarios: `message`; sin datos personales. Final: `HealthResponse {message: str}`. Cambio: `response_model` explícito. Estado: validado por OpenAPI; petición TestClient ejecutada, HTTP 200 y mensaje esperado.

#### POST `/api/incidents/analyze`
Handler `services/api/main.py:analyze_incidents`; recibe archivo multipart `file`, calcula resumen del CSV y lo consume `uis/backoffice/src/app/incidents/page.tsx`. Salida original inferida desde `analyze_csv_text`: `company`, `source_file`, totales, motivos, desgloses por categoría/estado/país y satisfacción; no retorna las filas ni emails. Sin modelo inicial (❌). Final: `IncidentAnalysisResponse {company: str, source_file: str, total_records: int, valid_records: int, invalid_records: int, invalid_breakdown: dict[str,int], by_category/by_status/by_country: dict[str,AnalysisBreakdown], satisfaction: AnalysisSatisfaction}`; el desglose contiene `count: int, percentage: float`; satisfacción contiene `closed_cases/scored_cases: int, average: float | null, scores: dict[str,int]`. Cambio: esquema explícito. Estado: validado por OpenAPI y petición TestClient; un CSV válido produjo un resumen sin el email de origen.

#### GET `/api/incidents/results/export`
Handler `services/api/main.py:export_results`; descarga consumida desde `uis/backoffice/src/app/incidents/page.tsx`. Entrada: ninguna. Salida: bytes/texto CSV (`text/csv`) con `Content-Disposition: attachment`; sin modelo inicial. Estado inicial: excepción técnica, no JSON. Final: `response_class=Response` y respuesta OpenAPI `text/csv` binaria, sin modelo Pydantic ficticio. Estado: excepción justificada; TestClient verificó HTTP 200, content-type y disposición tras análisis.

#### POST `/api/incidents`
Handler `services/api/routes/incidents.py:create_incident_endpoint`; entrada JSON `IncidentCreate {title, description, category, status, origin, branch: str}`; consumidor `uis/backoffice/src/lib/incidents.ts:createIncident`. Salida original inferida: incidencia persistida con esos campos más `id: int, created_at/updated_at: datetime`. Inicial: `IncidentResponse` presente, ⚠️ por error 400 emitido como `JSONResponse` sin contrato. Final: `IncidentResponse` explícito y `IncidentValidationError {error: "validation_error", field: str, message: str}` para 400; errores se instancian/validan antes de responder. No se agregan campos ni se expone información interna. Estado: OpenAPI validado; camino de creación normal no ejecutado en la prueba nueva.

#### GET `/api/incidents`
Handler `list_incidents_endpoint`; filtros opcionales `status, origin, branch, category: str`; consumidor `uis/backoffice/src/lib/incidents.ts:getIncidents`, que usa todos los campos de incidencia. Salida original inferida: lista de incidencias con seis campos de negocio y tres de identidad/fecha (`id, created_at, updated_at`). Inicial: `list[IncidentResponse]`, ⚠️ porque los filtros inválidos devuelven un 400 manual no documentado. Final: `list[IncidentResponse]` + error `IncidentValidationError` 400; no se cambió el formato de lista. Estado: OpenAPI y error 400 ejecutados; listado exitoso no ejecutado en esta auditoría.

#### GET `/api/incidents/summary`
Handler `incidents_summary_endpoint`; sin entrada; consumidor `uis/backoffice/src/lib/incidents.ts:getIncidentSummary`. Salida: `IncidentSummary {total: int, by_status/by_category/by_origin/by_branch: dict[str,int]}`. Inicial: ✅ `IncidentSummary`. Final sin cambio; los mapas conservan claves de dominio y contadores. Estado: contrato OpenAPI validado; payload de resumen de esta ruta no ejecutado directamente.

#### GET `/api/incidents/{incident_id}`
Handler `get_incident_endpoint`; entrada `incident_id: int`; consumidor `getIncidents`/tipos `Incident` en `uis/backoffice/src/lib/incidents.ts`. Salida: `IncidentResponse` (título, descripción, categoría, estado, origen, sede, id y timestamps). Inicial: ⚠️; el 404 manual eludía validación. Final: `IncidentResponse` y `IncidentNotFoundError {error: "not_found", message: str}`; el 404 se valida con ese modelo. No se añadieron campos. Estado: OpenAPI validado y 404 ejecutado; éxito no ejecutado.

#### PATCH `/api/incidents/{incident_id}/status`
Handler `update_incident_status_endpoint`; entrada `incident_id: int` y `IncidentStatusUpdate {status: str}`; consumidor `uis/backoffice/src/lib/incidents.ts:updateIncidentStatus`. Salida: incidencia completa. Inicial: ⚠️; respuestas manuales 400/404 no se serializaban con sus modelos documentados. Final: `IncidentResponse`, `IncidentStatusTransitionError {error: literal, field: "status", message: str}` (400) y `IncidentNotFoundError` (404); errores validados desde Pydantic. Estado: OpenAPI validado; transición no ejecutada en esta auditoría.

#### POST `/suppliers`
Handler `services/api/routes/suppliers.py:create_supplier_endpoint`; entrada `SupplierCreate`, consumida por `uis/application/services/suppliers.service.ts:createSupplier`. Salida original/final: `SupplierResponse {id: int, name: str, country: "USA"|"Spain", categories: list[SupplierCategory], rate_per_shipment: float, currency: "USD"|"EUR", status: SupplierStatus, service_zone/contact_email/notes: str|null, updated_at: datetime}`. Inicial ✅. Sin campos internos o credenciales; los datos de contacto y notas son parte del contrato del proveedor. Estado: OpenAPI validado; creación ejecutada en TestClient para probar el borrado posterior.

#### GET `/suppliers`
Handler `list_suppliers_endpoint`; entrada filtros opcionales `country, category`; consumidor `listSuppliers` y tabla en `uis/application/services/suppliers.service.ts`. Salida `list[SupplierResponse]`, incluyendo tarifas y contacto que el tipo `Supplier`/UI declara. Inicial ✅; final sin cambio. Estado: OpenAPI validado; solicitud no ejecutada individualmente.

#### GET `/suppliers/{supplier_id}`
Handler `get_supplier_endpoint`; entrada `supplier_id: int`; consumidor `getSupplierById`. Salida `SupplierResponse`. Inicial ✅; final sin cambio. Estado: OpenAPI validado; solicitud no ejecutada individualmente.

#### PATCH `/suppliers/{supplier_id}/rate`
Handler `update_supplier_rate_endpoint`; entrada `SupplierRateUpdate {rate_per_shipment: float}`; consumidor `updateSupplierRate`. Salida `SupplierResponse`. Inicial ✅; final sin cambio. Estado: OpenAPI validado; solicitud no ejecutada individualmente.

#### PATCH `/suppliers/{supplier_id}/status`
Handler `update_supplier_status_endpoint`; entrada `SupplierStatusUpdate {status: SupplierStatus}`; consumidor `updateSupplierStatus`. Salida `SupplierResponse`. Inicial ✅; final sin cambio. Estado: OpenAPI validado; solicitud no ejecutada individualmente.

#### DELETE `/suppliers/{supplier_id}`
Handler `delete_supplier_endpoint`; entrada `supplier_id: int`; consumidor `deleteSupplier`, que espera `{message: string}`. Inicial ❌, sin modelo. Final: `SupplierDeleteResponse {message: str}`. Cambio: `response_model` explícito, HTTP/status y texto conservados. Estado: OpenAPI validado; creación y borrado ejecutados con TestClient.

### `services-aut/api`

#### GET `/`
Handler `main.py:home`; entrada ninguna, sin consumidor encontrado. Salida original `{message: str}`. Inicial ❌; final `HealthResponse {message: str}`. Estado: OpenAPI validado; petición ejecutada, HTTP 200.

#### POST `/users`
Handler `users.py:register`; entrada `UserCreate {email,password: str; name/phone: str no vacíos; address: str|null}`; consumido por los formularios de registro en `uis/application`, `uis/backoffice` y `uis/talent-pipeline-tracker`. La API recorta espacios y rechaza nombre/teléfono ausentes o en blanco. Salida original: usuario público `{id,email,is_active,role,created_at}` y perfil `{id,user_id,name,phone,address}`; el hash se almacena internamente, no se incluye en la proyección. Inicial ❌. Final `RegistrationResponse {user: UserResponse, profile: ProfileResponse}`; `UserResponse` tiene `id/email/role: str, is_active: bool, created_at: datetime`; perfil tiene `id/user_id: str, name/phone/address: str|null`. Estado: OpenAPI y ejecución TestClient validados; se comprobó que no aparezca `hashed_password`.

#### GET `/users`
Handler `users.py:list_users`; entrada bearer autenticado; consumidor no encontrado. Salida original: lista de `{id,email,is_active,role,created_at}` de todas las cuentas; inicial ❌. Final `list[UserResponse]`. Se detectó que cualquier cuenta autenticada podía enumerar emails; ahora exige rol `admin`, verificación cubierta por tests. Para usuario estándar responde 403 sin cambiar ruta ni método. Estado: contrato y autorización ejecutados con usuario estándar y admin.

#### GET `/users/{user_id}`
Handler `users.py:get_user`; entrada bearer y `user_id: str`; propietario/admin; consumidor directo no encontrado. Salida original/final: `UserResponse {id,email,is_active,role,created_at}`. Inicial ❌. `public_user` ya excluía el hash; el modelo fija esa proyección. Estado: OpenAPI validado; sin petición específica en esta auditoría.

#### PUT `/users/{user_id}`
Handler `users.py:edit_user`; entrada `UserUpdate {email/password: str|null, role: Role|null, is_active: bool|null}` y autorización propietario/admin con cambio de rol reservado a admin. Salida original: proyección pública o `null` si el usuario no existe. Inicial ❌. Final `UserResponse | None`; salida excluye hash/contraseña en ambos casos y conserva el comportamiento nulo existente. Estado: OpenAPI validado; operación no ejecutada en esta auditoría.

#### DELETE `/users/{user_id}`
Handler `users.py:remove_user`; entrada bearer y `user_id: str`; propietario/admin. Salida `{message: str}`. Inicial ❌; final `MessageResponse {message: str}`. Estado: OpenAPI validado; sin petición específica.

#### GET `/profiles/me`
Handler `profiles.py:get_my_profile`; entrada bearer; consumidor `getCurrentUser`/pantalla de perfil. Salida original registro TinyDB con `id,user_id,name,phone,address`; inicial ❌. Final `ProfileResponse` con esos cinco campos tipados y nulabilidad de contacto. Estado: OpenAPI y petición TestClient validados; conserva teléfono/domicilio propios.

#### PUT `/profiles/me`
Handler `profiles.py:edit_my_profile`; entrada `MyProfileUpdate {name/phone: str no vacíos, address: str|null}` y bearer; consumidor `updateMyProfile` en los tres clientes web. La API recorta espacios y rechaza nombre/teléfono ausentes o en blanco. Salida `ProfileResponse`; `PATCH /profiles/{user_id}` conserva su esquema flexible. Inicial ❌. Estado: TestClient verificó lectura y actualización, incluidos teléfono/domicilio; tests verifican campos en blanco.

#### GET `/profiles`
Handler `profiles.py:list_profiles`; entrada bearer; ningún consumidor frontend encontrado. Salida original todos los perfiles, incluidos teléfono y domicilio; inicial ❌. Final `list[ProfileResponse]`; requiere rol admin para evitar exposición de datos personales a cualquier usuario autenticado. La ruta permanece para administración. Estado: OpenAPI y 403/200 con roles distintos validados.

#### GET `/profiles/{user_id}`
Handler `profiles.py:get_profile_by_user`; entrada bearer, `user_id: str`; autorización propietario/admin. Salida registro de perfil. Inicial ❌; final `ProfileResponse`. Estado: OpenAPI validado; sin solicitud directa en esta auditoría.

#### PATCH `/profiles/{user_id}`
Handler `profiles.py:edit_profile_by_user`; entrada bearer, `user_id: str`, `ProfileUpdate`; propietario/admin. Salida registro de perfil actualizado. Inicial ❌; final `ProfileResponse`. Estado: OpenAPI validado; sin solicitud directa en esta auditoría.

#### POST `/auth/login`
Handler `auth.py:login`; entrada formulario OAuth2 (`username` contiene email, `password`); consumidores `login` de los tres clientes. Salida `access_token` y `token_type`; token deliberadamente emitido, no es secreto interno. Inicial ❌; final `LoginResponse {access_token: str, token_type: "bearer"}`. Estado: petición ejecutada, HTTP 200, claves comprobadas; token no copiado al informe.

#### GET `/auth/me`
Handler `auth.py:get_me`; entrada bearer; consumidores `getCurrentUser` y pantallas de perfil. Salida original `id,email,role,profile`; el perfil es nulo o proyección propia. Inicial ❌; final `AuthMeResponse {id/email/role: str, profile: ProfileResponse|null}`. No incluye `hashed_password`. Estado: petición ejecutada, HTTP 200; se verificó ausencia de hash y presencia de los campos esperados.

#### POST `/auth/forgot-password`
Handler `auth.py:forgot_password`; entrada `{email: str}`; consumidor `forgotPassword`. Salida genérica `{message: str}` tanto si existe la cuenta como si no. Inicial ❌; final `MessageResponse`; no agrega email ni revela existencia, conserva HTTP 200. Estado: OpenAPI validado y suite de auth ejecutada.

#### POST `/auth/reset-password`
Handler `auth.py:reset_password`; entrada `{token: str, new_password: str}`; consumidor `resetPassword`. Salida de éxito `{message: str}`, errores siguen siendo HTTP 400. Inicial ❌; final `MessageResponse`; el token solo es entrada, nunca se devuelve. Estado: OpenAPI validado y suite de auth ejecutada.

#### POST `/auth/change-password`
Handler `auth.py:change_password`; entrada `{current_password: str, new_password: str}` y bearer; consumidor `changePassword`. Salida `{message: str}`; contraseñas nunca se devuelven. Inicial ❌; final `MessageResponse`. Estado: OpenAPI validado y suite de auth ejecutada.

#### POST `/inventory/orders/inbound`
Handler `routers/inventory.py:create_inbound_order`; entrada `StockEntryCreate {sku_id,quantity,reference,warehouse}`; consumidor `createInboundOrder`. Salida `StockEntryResponse` con esos campos, `id,created_at,user_uuid`; el usuario proviene de auth, no del payload. Inicial ✅; final sin cambio. Test existente confirma que se ignora `user_uuid` enviado por cliente. Estado: suite ejecutada.

#### POST `/inventory/orders/outbound`
Handler `create_outbound_order`; entrada `StockExitCreate {sku_id,quantity,exit_type,tracking_number|null,warehouse}`; consumidor `createOutboundOrder`. Salida `StockExitResponse` más `id,created_at,user_uuid`; actor desde auth. Inicial ✅; final sin cambio. Suite existente verifica salida insuficiente sin escritura. Estado: suite ejecutada.

#### GET `/inventory/products`
Handler `get_products`; sin entrada; consumidor `listProducts`. Salida `list[SKUResponse] {id,name,sku,client_name,category,warehouse,current_stock}`. Inicial ✅; final sin cambio. Estado: OpenAPI validado; no se ejecutó petición directa de este endpoint.

#### POST `/inventory/products`
Handler `create_product`; entrada `SKUCreate {name,sku,client_name,category,warehouse}`; consumidor indirecto por flujos de inventario, sin función de creación encontrada en el cliente inspeccionado. Salida `SKUResponse`, stock inicial 0. Inicial ✅; final sin cambio. Estado: OpenAPI validado; no se ejecutó petición directa.

#### GET `/inventory/products/{product_id}`
Handler `get_product`; entrada `product_id: int`; consumidor `getProduct`. Salida `SKUResponse`. Inicial ✅; final sin cambio. Estado: OpenAPI validado; no se ejecutó petición directa.

#### GET `/inventory/orders`
Handler `get_orders`; sin entrada; consumidor `listOrders`/`StockMovement` en `uis/backoffice/src/lib/inventory.ts` y `uis/backoffice/src/types/inventory.ts`. Salida original: movimientos con `id, movement_type, quantity, created_at, user_uuid` y `sku` anidado sin `current_stock`. Inicial ❌; el esquema previo `OrderResponse` tenía `product` y un `SKUResponse` incompatible. Final `list[OrderResponse]` con `movement_type: Literal["inbound","outbound"]`, `sku: OrderSKUResponse {id,name,sku,client_name,category,warehouse}`. Se conserva `user_uuid`, requerido por el tipo consumidor. Estado: test TestClient comprueba estructura y exclusión de `current_stock` anidado.

## D. Seguridad y decisiones de compatibilidad

- No se encontraron contraseñas, hashes, claves, tokens de recuperación ni secretos de servicio en salidas actuales de éxito. Se agregaron contratos que hacen explícita la exclusión del hash del usuario. `access_token` se conserva solo en el login, donde es el resultado previsto.
- `/auth/me` conserva email y perfil de la persona autenticada; los endpoints de recuperación conservan su mensaje genérico y no devuelven email ni existencia de cuenta.
- `/users` exponía emails de todos los usuarios y `/profiles` teléfono/domicilio a cualquier usuario autenticado. No se encontró consumidor para esos listados. Se restringieron ambos a rol admin, manteniendo método, ruta y proyección administrativa; se añadieron pruebas de 403 para usuario y 200 para admin.
- Los IDs permanecen donde ya forman parte de los contratos; no se agregaron relaciones completas. Los movimientos conservan la relación `sku` plana y ligera requerida por el frontend.
- No se modificaron los consumidores web. Se preservaron nombres, campos, formatos de colección, respuestas genéricas, códigos de éxito y estado de la descarga CSV.
- Los esquemas de entrada existentes se conservaron separados de las respuestas; `UserCreate`, `UserUpdate`, `ProfileUpdate` y los modelos de entrada de inventario no se ampliaron con campos internos.

## E. Verificaciones

- Registro inicial: 14 operaciones de `services/api` + 22 de `services-aut/api`; comparación exacta de `(aplicación, método, ruta)` con las 36 filas iniciales, sin faltantes ni duplicados. La inclusión diferida de routers en FastAPI 0.142 hizo necesario tomar el inventario desde OpenAPI.
- Registro final: importación de ambas apps y revisión de 36 operaciones en OpenAPI. Las 35 respuestas JSON declaran contenido `application/json` con esquema; la excepción tiene `text/csv`. La importación de Company API usó `DATABASE_URL=sqlite://`; no se conectó a servicios externos.
- `pytest services/api/tests/test_serialization_contracts.py -q`: 4 passed.
- `pytest services-aut/api/tests -q`: suite completa tras exigir nombre/teléfono, 74 passed.
- Peticiones manuales TestClient: `GET /` (200), `POST /auth/login` (200) y `GET /auth/me` (200); se inspeccionaron las claves y se confirmó que `hashed_password` no aparece. Pruebas de endpoints adicionales y errores están detalladas en las fichas.
- CSV: TestClient comprobó HTTP 200, `text/csv` y `Content-Disposition` para exportación; OpenAPI también declara el tipo de descarga.
- Limitación: el comando `uv` no está instalado; se usó el runner `pytest` disponible. Su Python aislado emite una advertencia de deprecación de Starlette/httpx, pero las pruebas pasan.
- Pendientes/bloqueos: ninguno que impida la auditoría. No se ejecutó manualmente cada una de las 36 operaciones; las restantes se verificaron estáticamente por handler y OpenAPI, identificadas así en las fichas.