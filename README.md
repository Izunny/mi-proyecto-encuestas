# mi-proyecto-encuestas

Documento de referencia para el proyecto de encuestas con frontend en Angular y backend en Node.js.

## Resumen

Aplicación para crear, gestionar y responder encuestas. El frontend está desarrollado con Angular y el backend con Node.js (Express). La base de datos se crea desde el script `db_encuestas.sql` ubicado en la carpeta `backend`.

## Estructura del proyecto

- **backend/**: servidor Node.js, configuración y script SQL.
- **frontend/**: aplicación Angular (SPA).

Estructura principal:

- [backend](mi-proyecto-encuestas/backend)
- [frontend](mi-proyecto-encuestas/frontend)

## Tecnologías

- Frontend: Angular
- Backend: Node.js, Express
- Base de datos: script SQL (`backend/db_encuestas.sql`) — MySQL/Postgres/SQLite según su despliegue

## Requisitos

- Node.js 18+ (o LTS compatible)
- npm o yarn
- Sistema de base de datos compatible con el script SQL (p. ej. MySQL)

## Instalación y ejecución

1. Clonar el repositorio.
2. Backend:

```bash
cd mi-proyecto-encuestas/backend
npm install
# configurar variables de entorno o editar config.js según su entorno
node index.js
```

3. Base de datos:

- Importar `backend/db_encuestas.sql` en su servidor de base de datos para crear las tablas iniciales y datos de ejemplo.

4. Frontend:

```bash
cd mi-proyecto-encuestas/frontend
npm install
ng serve --open
```

## Configuración

- Revisar `backend/config.js` para ajustar credenciales y la conexión a la base de datos.
- Si el backend usa JWT u otro método de autenticación, configurar las claves/secretos en variables de entorno.

## Endpoints y flujo (rápido)

- El backend expone rutas API bajo `/api` (ver `backend/index.js` y las rutas dentro de la carpeta `backend` para detalles). Las operaciones típicas son:
  - Gestión de encuestas: crear, editar, eliminar, listar
  - Responder encuestas: enviar respuestas y almacenar resultados
  - Autenticación: registro, login, verificación de token

## Desarrollo y pruebas

- Frontend: `ng test` para pruebas unitarias.
- Backend: ejecutar los tests (si existen) con `npm test` desde `backend`.

## Despliegue

- Construir el frontend con `ng build --prod` y servir los archivos estáticos desde el backend o desde un CDN/servidor estático.
- Asegurar la configuración de variables de entorno y la conexión a la base de datos en el entorno de producción.

## Contribuir

- Abrir issues para bugs o mejoras.
- Crear pull requests con descripción clara y pasos para reproducir cambios.

## Referencias

- Script de la base de datos: [backend/db_encuestas.sql](mi-proyecto-encuestas/backend/db_encuestas.sql)
- Archivo principal del backend: [backend/index.js](mi-proyecto-encuestas/backend/index.js)

