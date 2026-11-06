# Carpeta `uis`

Esta carpeta contiene **todas las interfaces de usuario** relacionadas con la compañía para el proyecto transversal de AI Engineering (por ejemplo: aplicaciones web, dashboards internos, portales de clientes, apps de Streamlit/Gradio, etc.).

Cada subcarpeta dentro de `uis/` debe corresponder a **una interfaz de usuario concreta** (por ejemplo `website`, `backoffice`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar en un único lugar todas las aplicaciones frontend que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) las aplicaciones que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlas.

## Ensamblaje actual

- **Web pública:** [website](./website), aplicación Next.js independiente basada
  en `index.html` y `application.html`. Mantiene las rutas del formulario comercial
  y consume su endpoint a través de la API. Se abre en el puerto 3000 y no enlaza
  al backoffice.
- **Backoffice:** [backoffice](./backoffice/README.md), única aplicación Next.js
  activa, con proveedores, inventario, incidencias y alta de empleados para admins.
  Se abre por separado en `http://localhost:3001/backoffice/login`; al salir vuelve
  a su propio login.
- **API:** `services.api.main:app`, un solo proceso que reutiliza los módulos de
  autenticación e inventario de `services-aut/api`, sin mover sus datos.

[application](./application) se conserva como referencia de los hitos anteriores,
pero no se despliega. [talent-pipeline-tracker](./talent-pipeline-tracker) tampoco
se despliega: su integración queda para después.
