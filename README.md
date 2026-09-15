# Pedidos360 - Frontend (Angular)

Aplicación cliente desarrollada en **Angular** para la gestión logística y visualización de pedidos en tiempo real. Este módulo forma parte del ecosistema Pedidos360, actuando como la interfaz principal de usuario. Está integrada con estándares de seguridad corporativa mediante **MSAL (Microsoft Authentication Library)** y se comunica eficientemente con una arquitectura de microservicios a través de un patrón BFF (Backend For Frontend) alojado en la nube.

---

## Características Principales

*   **Autenticación y Seguridad Unificada:** Integración nativa con Azure AD mediante MSAL. Implementación de interceptores HTTP para la inyección automática de tokens JWT (Bearer) en las cabeceras de cada petición, garantizando comunicaciones seguras.
*   **Control de Acceso Basado en Roles (RBAC):** Renderizado condicional e inteligente a nivel de enrutamiento y componentes, adaptando el Dashboard al nivel de acceso del usuario:
    *   **Administrador:** Acceso total a la plataforma, gestión de todos los pedidos e indicadores clave.
    *   **Operador:** Vista focalizada en la gestión de pedidos pendientes y transición de estados operativos.
    *   **Cliente:** Dashboard personalizado y aislado para el seguimiento exclusivo de los pedidos propios del usuario.
*   **UI/UX Modular:** Interfaz limpia y profesional, basada en componentes reutilizables, diseñada para optimizar el control de despachos logísticos y reducir la carga cognitiva del usuario.

## Arquitectura y Componentes Técnicos

*   **Framework Principal:** Angular (TypeScript).
*   **Gestión de Identidad:** MSAL Angular (@azure/msal-angular).
*   **Comunicación HTTP:** Interceptores modulares (AuthInterceptor) y servicios HTTP inyectables para el consumo de la API Gateway (AWS).
*   **Estilos:** CSS modular y semántico, enfocado en el rendimiento y la escalabilidad visual sin dependencias excesivas.

---

## Documentación de API y Swagger

El frontend de Pedidos360 interactúa directamente con los endpoints expuestos por el BFF. Los contratos de esta API (rutas, métodos esperados y modelos de datos) están documentados de forma interactiva a través de **Swagger / OpenAPI**.

Para revisar los contratos técnicos al momento de desarrollar o ajustar llamadas desde los servicios de Angular, consulta el Swagger del backend:

> **Ruta local por defecto:** `http://localhost:8080/swagger-ui.html` 
> *(Asegúrate de tener el microservicio BFF en ejecución para acceder a los endpoints de `/api/bff/orders`, `/api/bff/catalog`, etc.)*

El frontend espera estrictamente las respuestas documentadas en el Swagger para realizar el mapeo correcto de las interfaces TypeScript.

---

## Prerrequisitos de Entorno

Para compilar y ejecutar este proyecto de forma local, se requiere:

*   **Node.js**: Versión 18.x o superior.
*   **Angular CLI**: Versión compatible con el proyecto (ejecutar `ng version` tras la instalación).
*   **Git**: Para el control de versiones.

---

## Configuración y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/meninaaa/pedidos360-frontend.git](https://github.com/meninaaa/pedidos360-frontend.git)
   cd pedidos360-frontend
