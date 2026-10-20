# API de autenticacion

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

- `JWT_SECRET` — clave para firmar los tokens de sesion y de restablecimiento.
- `ACCESS_TOKEN_EXPIRE_MINUTES` — duracion del token de sesion.
- `RESET_TOKEN_EXPIRE_MINUTES` — duracion del token de restablecimiento de contrasena.
- `FRONTEND_URL` — URL base del frontend, usada para construir el enlace de `/reset-password`.
- `RESEND_API_KEY` — API key de [Resend](https://resend.com/) para enviar el email de restablecimiento.
- `RESEND_FROM_EMAIL` — remitente del email (por defecto `onboarding@resend.dev`).

## Cache del historial

`GET /inventory/orders` requiere bearer token y usa una cache en proceso de
15 segundos por UUID autenticado. Entradas y salidas invalidan el historial de
todos los usuarios; la comprobacion de stock sigue consultando la base.
La respuesta indica `Cache-Control: private, no-store`.

Ejecuta desde la raiz del monorepo para resolver la utilidad compartida:

```bash
PYTHONPATH="$PWD:$PWD/services-aut/api" uvicorn main:app --port 8001
```

Configura `api.timing` a nivel INFO para los logs de duracion. Consulta
`CACHING_REPORT.md` en la raiz para mediciones, TTL, invalidacion y limitaciones
entre multiples procesos.
