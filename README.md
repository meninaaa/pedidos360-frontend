# Pedidos360 - Frontend (Angular)

## 1. Resumen Ejecutivo
**Pedidos360** es una plataforma logística de grado empresarial construida como una Single Page Application (SPA) utilizando **Angular**. Este módulo actúa como la capa de presentación principal (Frontend), diseñada para ofrecer una experiencia de usuario (UX) reactiva, modular y de baja latencia. Su arquitectura está orientada a la seguridad (Integración con Azure AD) y al consumo eficiente de un ecosistema de microservicios orquestado a través de un **BFF (Backend For Frontend)**.

## 2. Arquitectura de Software y Patrones de Diseño

El frontend de Pedidos360 no es solo una interfaz de usuario, sino un cliente inteligente estructurado bajo los siguientes patrones:

*   **Autenticación y Seguridad Unificada (MSAL):** Se utiliza la librería MSAL (Microsoft Authentication Library) para delegar la identidad a Azure AD. A través de un `MsalInterceptor` inyectado a nivel global, cada petición HTTP saliente hacia el backend incluye automáticamente el token JWT (Bearer Token) en las cabeceras, eliminando la gestión manual de sesiones y previniendo vulnerabilidades de inyección.
*   **Control de Acceso Basado en Roles (RBAC) Dinámico:** El enrutamiento y la renderización del DOM están protegidos por **Route Guards** (`MsalGuard`, `RoleGuard`) y directivas estructurales (`*ngIf`). El sistema lee los `claims` del token JWT decodificado en tiempo real para adaptar la interfaz:
    *   **Administrador:** Acceso irrestricto (Creación, modificación, auditoría completa y reportería).
    *   **Operador de Logística:** Flujo de trabajo focalizado. Solo puede visualizar órdenes pendientes, transicionar estados (Aceptar, Preparar, Despachar) y acceder al catálogo en modo "Solo Lectura".
    *   **Cliente:** Dashboard aislado (`/orders/me`). Seguridad a nivel de vista para garantizar que solo consuma sus propios datos.
*   **Gestión de Entornos Dinámicos (Environments):** Implementación de variables de entorno (`environment.ts`) que permiten a la aplicación pivotar entre un consumo de API local (`localhost:8080`) y un despliegue en la nube mediante **AWS API Gateway** con un solo cambio de configuración.

## 3. Estructura de Módulos Core

*   **Módulo Dashboard:** Panel ejecutivo que consume reportes agregados. Renderiza de forma condicional KPIs y "Top Productos" dependiendo del rol del usuario.
*   **Módulo Orders:** Máquina de estados visual. Integra formularios inteligentes que cruzan datos con el catálogo de productos para autocompletar flujos de facturación.
*   **Módulo Catalog:** Interfaz CRUD de inventario. Protegida granularmente para evitar manipulaciones de stock por personal no autorizado.
*   **Módulos de Auditoría y Reportería:** Consumidores de los microservicios asíncronos para trazar movimientos y métricas de negocio.

## 4. Documentación de API y Contratos (Swagger)

El frontend espera estrictamente las respuestas documentadas en los contratos **OpenAPI (Swagger)** del backend para realizar el mapeo correcto de las interfaces TypeScript.
*   **Ruta local por defecto:** `http://localhost:8080/swagger-ui.html` 
*   **Ruta AWS Producción:** `https://<ID_GATEWAY>.execute-api.<REGION>.amazonaws.com/swagger-ui/index.html`

## 5. Prerrequisitos y Despliegue Local

*   **Node.js**: Versión 18.x o superior.
*   **Angular CLI**: (Instalable vía `npm install -g @angular/cli`).

**Pasos de ejecución:**
```bash
# 1. Clonar el repositorio
git clone [https://github.com/meninaaa/pedidos360-frontend.git](https://github.com/meninaaa/pedidos360-frontend.git)
cd pedidos360-frontend

# 2. Instalar dependencias exactas
npm install

# 3. Compilar y levantar servidor de desarrollo
ng serve -o
