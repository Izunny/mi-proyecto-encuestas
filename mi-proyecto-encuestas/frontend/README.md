# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


# mi-proyecto-encuestas

Repositorio organizado como monorrepo limpio, con separación física entre backend y frontend para facilitar el despliegue independiente, la integración autónoma y el mantenimiento de cada capa.

## Estructura del proyecto

```text
mi-proyecto-encuestas/
├── backend/                     # Entorno de ejecución de la API REST (Node.js)
│   ├── config.js                # Configuración de conexión y variables del backend
│   ├── db_encuestas.sql         # Script SQL para crear la base de datos
│   ├── index.js                 # Punto de entrada del backend
│   ├── package.json             # Dependencias y scripts del servidor
│   ├── package-lock.json
│   ├── logo.png
│   └── example.pdf
├── frontend/                    # Entorno de la interfaz de usuario (Angular SPA)
│   ├── angular.json             # Configuración del proyecto Angular
│   ├── package.json             # Dependencias y scripts del cliente
│   ├── src/
│   │   ├── main.ts              # Punto de entrada de Angular
│   │   ├── index.html
│   │   ├── styles.scss
│   │   └── app/
│   │       ├── app.component.ts
│   │       ├── app.component.html
│   │       ├── app.component.scss
│   │       ├── app.routes.ts    # Rutas de la aplicación
│   │       ├── components/      # Componentes reutilizables de UI
│   │       ├── pages/           # Vistas principales del sistema
│   │       ├── services/        # Servicios para consumo de API y lógica de datos
│   │       ├── guard/           # Protección de rutas
│   │       ├── interceptors/    # Interceptor HTTP para autenticación
│   │       └── interfaces/      # Tipos e interfaces del modelo
│   ├── public/                  # Recursos estáticos
│   └── README.md
├── ARCHITECTURE.md              # Descripción general de la arquitectura
└── README.md                    # Documentación principal del proyecto
```

## Referencias

- [Arquitectura](mi-proyecto-encuestas/ARCHITECTURE.md)
- [Backend](mi-proyecto-encuestas/backend)
- [Frontend](mi-proyecto-encuestas/frontend)
