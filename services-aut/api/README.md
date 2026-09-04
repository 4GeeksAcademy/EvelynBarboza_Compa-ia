# API de autenticacion

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

- `JWT_SECRET` — clave para firmar los tokens de sesion y de restablecimiento.
- `ACCESS_TOKEN_EXPIRE_MINUTES` — duracion del token de sesion.
- `RESET_TOKEN_EXPIRE_MINUTES` — duracion del token de restablecimiento de contrasena.
- `FRONTEND_URL` — URL base del frontend, usada para construir el enlace de `/reset-password`.
- `RESEND_API_KEY` — API key de [Resend](https://resend.com/) para enviar el email de restablecimiento.
- `RESEND_FROM_EMAIL` — remitente del email (por defecto `onboarding@resend.dev`).
