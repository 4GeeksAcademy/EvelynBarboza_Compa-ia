# Testing AUTH-088

## Alcance

Este documento describe las pruebas automatizadas implementadas para AUTH-088. Las suites verifican el comportamiento observable de la autenticación existente, sin modificar la lógica de producción ni implementar API-042, FE-019, nuevas funcionalidades, refactors, tests de componentes React o pruebas E2E.

Los tests usan datos aislados por caso. No se envían emails reales. No se prueban internals de FastAPI, JWT ni Jest. El frontend no genera, firma, decodifica, valida ni aplica hash a JWT; por ello, la lógica JWT y de hashing se cubre en backend.

## Ejecución

### Backend

Desde `services-aut/api/`:

```bash
uv run pytest
uv run pytest --cov=auth --cov-report=term-missing
```

La suite backend se encuentra en `services-aut/api/tests/`.

### Frontend

Cada aplicación tiene una configuración Jest independiente. Ejecutar desde el directorio correspondiente:

```bash
cd uis/application
npm test
npm run test:coverage

cd ../backoffice
npm test
npm run test:coverage

cd ../talent-pipeline-tracker
npm test
npm run test:coverage
```

## Cobertura de las suites

### Backend: `services-aut/api/tests/`

La suite cubre los endpoints y la lógica de autenticación backend:

- Tokens de acceso: creación, claims, expiración y validación.
- Login: credenciales válidas, credenciales inválidas y errores de autenticación.
- Usuario actual (`/auth/me`): token válido, ausente, inválido y expirado.
- Registro (`/users`): creación de usuarios, hash de contraseña y validaciones.
- Recuperación de contraseña (`/auth/forgot-password`): solicitudes válidas, usuario inexistente y emisión de token.
- Restablecimiento (`/auth/reset-password`): token válido, token inválido, expirado, usado y actualización de contraseña.
- Cambio de contraseña (`/auth/change-password`): autenticación, contraseña actual y actualización.
- Casos de autorización, usuarios inexistentes y estados de error.

Casos planificados por endpoint:

| Endpoint o función | Casos | Motivo |
| --- | --- | --- |
| Creación/validación de tokens | claims, expiración, token inválido | Garantizar identidad y vigencia de la sesión |
| `POST /auth/login` | éxito, usuario inexistente, contraseña incorrecta | Cubrir el inicio de sesión y sus errores principales |
| `GET /auth/me` | autenticado, sin token, token inválido/expirado | Verificar protección de recursos |
| `POST /users` | registro y persistencia del hash | Confirmar creación y que no se almacene la contraseña en claro |
| `POST /auth/forgot-password` | usuario existente/inexistente y token de recuperación | Cubrir el inicio del flujo de recuperación |
| `POST /auth/reset-password` | token válido, inválido, expirado y usado | Evitar reutilización y aceptar sólo tokens válidos |
| `POST /auth/change-password` | contraseña actual válida/incorrecta y sesión requerida | Cubrir el cambio autenticado |

Resultado real backend:

- **61 tests pasando.**
- **`auth.py`: 100% de coverage.**
- Suite ejecutada desde `services-aut/api/tests/`.

### Frontend: cliente `auth.ts`

#### Application — `uis/application/lib/auth.test.ts`

Cubre almacenamiento y limpieza de `trackflow_token`, logout, login, registro, usuario actual, actualización de perfil, recuperación de contraseña, restablecimiento, cambio de contraseña, headers Bearer, respuestas 204, errores de red, 401 y errores de validación.

#### Backoffice — `uis/backoffice/src/lib/auth.test.ts`

Cubre almacenamiento de `backoffice_token`, logout, login, registro, usuario actual, actualización de perfil, requests autenticadas, errores de red, 401 y las diferencias de mensajes para detalles string y errores de campos.

#### Talent Pipeline Tracker — `uis/talent-pipeline-tracker/lib/auth.test.ts`

Cubre almacenamiento de `talent_token`, logout, login, registro, usuario actual, actualización de perfil, requests autenticadas, errores de red, 401 y el manejo genérico de errores del cliente.

Resultados reales frontend:

| Aplicación | Tests | Statements | Branches | Functions |
| --- | ---: | ---: | ---: | ---: |
| Application | 6 | 92.47% | 82.85% | 100% |
| Backoffice | 4 | 90.8% | 80% | 100% |
| Talent Pipeline Tracker | 5 | 90.69% | 80% | 100% |

## Comportamientos potencialmente problemáticos detectados

Los tests y la revisión asistida por IA identificaron los siguientes comportamientos que podrían requerir una decisión funcional posterior. No se presentan como bugs confirmados:

- emails inválidos aceptados;
- contraseñas vacías aceptadas;
- usuarios inactivos pueden autenticarse;
- se permite reutilizar la misma contraseña en `change-password`;
- tokens sin `exp` aceptados;
- posible inconsistencia si falla `mark_reset_token_used`;
- manejo limitado de excepciones del servicio de email.

No se modificó producción para corregir estos comportamientos. Su corrección queda fuera del alcance de AUTH-088 en esta entrega.

## Resultado de la entrega

La implementación se limita a tests Jest del cliente real de autenticación, tests pytest backend ya existentes, configuración mínima de ejecución y esta documentación. No se agregaron nuevas funcionalidades de autenticación ni se tocaron API-042, FE-019, componentes React, pruebas E2E o lógica de producción.
