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

## 3. Estructura de Módulos Core

*   **Módulo Dashboard:** Panel ejecutivo que consume reportes agregados. Renderiza de forma condicional KPIs y "Top Productos" dependiendo del rol del usuario.
*   **Módulo Orders:** Máquina de estados visual. Integra formularios inteligentes que cruzan datos con el catálogo de productos para autocompletar flujos de facturación.
*   **Módulo Catalog:** Interfaz CRUD de inventario. Protegida granularmente para evitar manipulaciones de stock por personal no autorizado.
*   **Módulos de Auditoría y Reportería:** Consumidores de los microservicios asíncronos para trazar movimientos y métricas de negocio.

## 4. Documentación de API y Contratos (Swagger)

El frontend espera estrictamente las respuestas documentadas en los contratos **OpenAPI (Swagger)** del backend para realizar el mapeo correcto de las interfaces TypeScript.
*   **Ruta local por defecto:** `http://localhost:8080/swagger-ui.html` 
*   **Ruta AWS Producción:** `https://3lgyldt561.execute-api.us-east-1.amazonaws.com/swagger-ui/index.html`

---

## 5. Gestión de Entornos: Conexión Local vs. AWS (Cloud)

Una de las principales ventajas arquitectónicas de este proyecto es su capacidad para pivotar dinámicamente entre un entorno de desarrollo local y un entorno de producción en la nube (AWS), sin necesidad de reescribir código en los componentes.

Esto se logra mediante la centralización de la URL del API en el archivo **`src/environments/environment.ts`**. 

Todos los servicios y componentes de Angular (`OrdersComponent`, `CatalogComponent`, `ReportService`, etc.) importan la variable `environment.apiUrl` para realizar sus peticiones HTTP. De esta forma, el desarrollador solo necesita **comentar o descomentar una línea** para redirigir todo el tráfico del frontend:

```typescript
// Archivo: src/environments/environment.ts
export const environment = {
  production: false,
  
  // ==========================================
  // OPCIÓN 1: Desarrollo Local
  // Apunta al BFF ejecutándose en tu máquina
  // ==========================================
  apiUrl: 'http://localhost:8080/api/bff'

  // ==========================================
  // OPCIÓN 2: Producción (AWS EC2 + API Gateway)
  // Apunta a la infraestructura Cloud desplegada
  // ==========================================
  // apiUrl: 'https://3lgyldt561.execute-api.us-east-1.amazonaws.com/api/bff)'
};
