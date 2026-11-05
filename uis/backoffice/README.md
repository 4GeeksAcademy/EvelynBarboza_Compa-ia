# TrackFlow Backoffice

Panel interno realizado con Next.js, React y TypeScript.

Una sola interfaz para proveedores, inventario, incidencias, perfil y alta de empleados.
Pipeline queda fuera de este ensamblaje.

## Ejecutar el conjunto

Desde la raíz del repositorio:

```bash
docker compose up --build
```

- Web pública: `http://localhost:3000/`.
- Formulario comercial sin cuenta: `http://localhost:3000/application.html`.
- Login de empleados: `http://localhost:3001/backoffice/login`.
- API unificada: `http://localhost:8000/docs`.

El sitio público es HTML servido con Nginx, sin enlaces ni proxy al backoffice.
Su migración a React/Next está pendiente. Ambas interfaces se abren por separado.
No se ejecutan `uis/application` ni `uis/talent-pipeline-tracker`.
El contenedor del backoffice compila y ejecuta Next.js en modo producción; al
cambiar código hay que reconstruir con `docker compose up --build -d`.
La web pública espera a la API para su formulario, pero no depende del backoffice.
El menú no incluye un enlace **Web pública**. **Salir** aparece al final, después
de **Cambiar contraseña**: elimina la sesión y redirige a su propio login.
Las sesiones vencidas siguen redirigiendo al login del backoffice.

## Publicación en servidor

Usar dos dominios, por ejemplo `https://www.trackflow.example` para la web pública
y `https://gestion.trackflow.example/backoffice/login` para el backoffice.
Un proxy HTTPS de confianza dirige cada dominio a su puerto local: 3000 y 3001,
respectivamente. No exponer directamente los puertos 3000, 3001 ni 8000.
El proxy HTTPS debe conservar `Host` y establecer
`X-Forwarded-Proto: https`; Nginx conserva ese protocolo hacia la aplicación.
No se deben aceptar cabeceras reenviadas de clientes sin pasar por ese proxy.
Los tres puertos publicados por Compose se enlazan a `127.0.0.1`, no a todas las
interfaces. El proxy HTTPS debe ejecutarse en el mismo servidor y enviar el
tráfico a `http://127.0.0.1:3000` o `http://127.0.0.1:3001`, según el dominio. Un proxy en otro contenedor necesita una
configuración de red específica: su `localhost` no es el del host.

Configurar `FRONTEND_URL=https://gestion.trackflow.example/backoffice` antes de arrancar,
para que los correos de recuperación no apunten a localhost. Los enlaces normales,
el formulario y las peticiones del navegador usan rutas del dominio de cada aplicación.
Respaldar los datos persistentes antes de actualizar y configurar un `JWT_SECRET`
privado. `docker compose up --build -d` inicia el conjunto con reinicio automático.

Si los servicios responden por sus puertos publicados pero no entre contenedores,
revisar el firewall del host. En el entorno de desarrollo se detectó una política
`FORWARD DROP` de iptables-legacy coexistiendo con reglas Docker en iptables-nft.
Los healthchecks no solucionan este bloqueo: un administrador debe alinear las
reglas del host o autorizar tráfico únicamente en el puente de este proyecto.
No desactivar el firewall, no vaciar sus reglas y no usar red host como atajo.

## Cuentas y permisos

El login del backoffice incluye **Crear cuenta** (`/backoffice/register`).
El registro no requiere sesión: crea el usuario y su perfil e inicia sesión
automáticamente. Las cuentas nuevas tienen rol `user`, no de administrador.
Pueden gestionar proveedores, inventario e incidencias; no se verifica que
pertenezcan a la empresa. `POST /users` permite el registro sin autenticación.
Los administradores conservan **Alta de empleados** (`/backoffice/employees`),
el listado de usuarios y la gestión de roles. La web pública sigue separada.

Para preparar el primer administrador, desde una terminal de confianza:

```bash
docker compose exec backend python services-aut/api/create_admin.py
```

El comando pide los datos de forma interactiva, permite promover una cuenta existente
con confirmación y no funciona si ya hay un administrador activo. No hay contraseñas
por defecto. El alta de otro empleado no cambia la sesión del administrador.

## Datos y configuración

El archivo de entorno de la raíz debe configurar `DATABASE_URL` (inventario SQL),
`JWT_SECRET` y, para recuperar contraseñas por email, la configuración de correo
`RESEND_API_KEY` y `RESEND_FROM_EMAIL`. No se incluyen secretos en las imágenes.
`FRONTEND_URL` debe apuntar al origen del backoffice seguido de `/backoffice`; en local
Compose usa `http://localhost:3001/backoffice`. En Codespaces o despliegue hay que
ajustarlo al dominio real.

Se conservan los almacenes existentes, sin migrarlos ni ejecutar seeds automáticamente:

- Usuarios, perfiles y recuperación: `services-aut/api/data/db.json`.
- Proveedores, incidencias y consultas comerciales: `services/api/data/suppliers.json`.
- Inventario: la base configurada en `DATABASE_URL`.

Compose monta estas carpetas para preservar los datos. Antes de desplegar sobre
datos reales, hacer una copia de seguridad de ambos JSON y de la base SQL.
El backend crea las tablas de inventario que falten al arrancar.

El formulario comercial guarda una consulta en `commercial_inquiries`; no crea un
usuario ni envía correo al equipo comercial. Solo confirma el envío tras recibir
una respuesta de creación del servidor.

## Frontend sin Docker

Con la API unificada funcionando en el puerto 8000:

```bash
cd uis/backoffice
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Abrir `http://localhost:3001/backoffice/login`. El proxy usa `127.0.0.1:8000`
por defecto; `BACKEND_URL` permite cambiarlo. En Docker apunta a `http://backend:8000`.
No hace falta `NEXT_PUBLIC_INVENTORY_API_URL`.

### Aplicaciones separadas sin Docker

Desde la raíz, en tres terminales con las dependencias ya instaladas:

```bash
# Terminal 1: API, usando DATABASE_URL y JWT_SECRET del entorno.
FRONTEND_URL=http://localhost:3001/backoffice python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000

# Terminal 2: backoffice. El destino se fija también si hay variables de Docker.
BACKEND_URL=http://127.0.0.1:8000 npm --prefix uis/backoffice run dev -- --hostname 127.0.0.1 --port 3001

# Terminal 3: entrada pública local.
sh uis/start.sh --local
```

Abrir `http://localhost:3000` para la web pública y
`http://localhost:3001/backoffice/login` para el backoffice. En Codespaces abrir
cada puerto desde la pestaña Puertos y mantener el acceso privado.
La entrada
local sirve únicamente los tres archivos públicos, no el repositorio ni sus
archivos de entorno. Solo reenvía el formulario comercial a la API;
`/backoffice` devuelve 404 en el puerto público. No crea cuentas,
no ejecuta seeds y no cambia bases de datos. Para detenerla, usar Ctrl+C.
Este servidor local no sustituye a Nginx y HTTPS en producción.

La terminal de la API debe mostrar `Application startup complete` antes de probar
el login o enviar el formulario. Si Supabase responde `tenant/user not found`,
el backend no está funcionando: revisar la conexión `DATABASE_URL` con los datos
vigentes del proyecto Supabase. No compartir esa URL ni sus credenciales en el chat.
No cambiar a una base local sin decidir antes si se necesitan los datos existentes.

El primer administrador se prepara desde una terminal de confianza con
`python services-aut/api/create_admin.py`; después los empleados se crean desde
el backoffice. Usar cuentas de prueba y una base aislada para verificaciones.

## Validación dirigida

Desde la raíz, sin usar la base SQL real:

```bash
DATABASE_URL=sqlite:////tmp/trackflow-check.db python -m pytest services-aut/api/tests/test_auth_registration.py services-aut/api/tests/test_auth_login.py services-aut/api/tests/test_auth_me.py -q
npm --prefix uis/backoffice test -- --runInBand src/lib/auth.test.ts src/lib/incidents.test.ts src/lib/theme.test.ts
npm --prefix uis/backoffice run build
docker compose config -q
```
