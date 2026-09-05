"""# Pedidos360 - Frontend (Angular)

Aplicación cliente desarrollada en **Angular** para la gestión logística y visualización de pedidos en tiempo real, integrada con seguridad corporativa mediante **MSAL (Microsoft Authentication Library)** y comunicada hacia un BFF/Microservicio alojado en la nube.

## Arquitectura y Componentes
- **Framework Principal:** Angular (TypeScript).
- **Autenticación:** MSAL Angular para gestión de identidad y tokens de sesión.
- **Estilos y Componentes:** Interfaz moderna con paneles de control operativos y gestión de registros logísticos.
- **Comunicación HTTP:** Interceptores y servicios configurados para consumir la API expuesta mediante AWS API Gateway.

## Prerrequisitos
- Node.js (versión 18 o superior recomendada).
- Angular CLI.

## Configuración y Ejecución Local

1. Clona el repositorio:
   ```bash
   git clone [https://github.com/meninaaa/pedidos360-frontend.git](https://github.com/meninaaa/pedidos360-frontend.git)
   cd pedidos360-frontend
Instala las dependencias:

Bash
npm install
Configura las credenciales de MSAL en el archivo de entorno o de configuración de autenticación (auth-config.ts).

Ejecuta el servidor de desarrollo:

Bash
ng serve
Abre tu navegador en http://localhost:4200.

Despliegue y Construcción
Para generar los artefactos de producción optimizados:

Bash
ng build --configuration production
Los archivos compilados quedarán listos en la carpeta /dist.
"""****
