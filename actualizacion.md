1. Propósito y Alcance
Gestionar el inventario y las ventas de una tienda de componentes electrónicos ("ElectroLab") mediante un sistema B2C (Business-to-Consumer). La aplicación permite la gestión interna (CRUD seguro, control de stock, escáner de código de barras) y ofrece a los clientes una experiencia de compra con carrito, pagos simulados y gestión de devoluciones. Cuenta con protección contra concurrencia (OCC), seguridad a nivel de rutas/documentos (RBAC) y validación estricta de inputs, bajo un diseño moderno Glassmorphism.

Público objetivo:

    Trabajadores/Administradores: Gestión de stock, categorías, reportes y atención de reembolsos.

    Clientes: Visualización de catálogo, simulación de compra y solicitudes de reembolso.

Plataformas y Despliegue:

    Frontend: React Native (Expo) - Multiplataforma (Android/iOS).

    Backend / Base de Datos: Node.js con Express alojado en la nube (Render). MongoDB (Atlas).

Versión actual: v1.0.0 (Release Comercial Simulado)

2. Objetivos y KPIs

    Objetivo principal: Integrar un flujo de e-commerce simulado completo sobre un sistema de inventario robusto y seguro.

    Métricas clave (KPI):

        0% de sobreescritura por modificaciones simultáneas (OCC en carritos e inventario).

        100% de validación de inputs en endpoints (prevención de inyecciones NoSQL y XSS).

        0% de exposición de claves y APIs en el código fuente del cliente y repositorio Git.

3. Arquitectura y Stack Tecnológico

    Frontend: React Native (Expo) con expo-blur (Glassmorphism), expo-camera (Escáner de código de barras) y AsyncStorage (Persistencia de sesión JWT).

    Backend: Node.js + Express en Render. Implementación de middleware de validación (ej. Zod o Joi) y RBAC (Role-Based Access Control).

    Base de datos: MongoDB Atlas (OCC activado). Colecciones segregadas: Usuarios (Admin, Trabajador, Cliente), Productos, Categorias, Ventas, Reembolsos.

4. Estructura de Navegación y Pantallas

    SplashScreen: Animación con el nombre "ElectroLab".

    Navegación Principal (Bottom Navigation Bar):

        🏠 Home (Inventario): Catálogo de productos con Fuzzy Search. Indicadores visuales de stock (Rojo: 0, Amarillo: <= 30, Verde: >= 31).

        🛒 Carrito: Vista de productos añadidos, total a pagar, botones "Eliminar producto" y "Vaciar carrito", y botón de Checkout (Pago simulado). Requiere Login al intentar pagar.

        👤 Perfil: Botones de selección de acceso ("Cliente" / "Trabajadores y Administradores").

    Flujos de Autenticación:

        Cliente: Login, Registro (Nombre, correo, contraseña) y Recuperación de contraseña (vía código por correo).

        Staff (Admin/Trabajador): Login estricto. Sin opción de registro público.

    Paneles Privados (RBAC):

        Cliente: Historial de compras, Solicitud de Reembolso (motivo, método, foto, cita física/correo -> genera Folio).

        Trabajador:

            CRUD de Categorías (Restricción de eliminación si hay productos vinculados).

            CRUD de Productos (Asignación de categoría [se despliega lista de categorias ya creadas], precio, escaneo de código de barras).

            Gestión de Reembolsos: "Aprobar folio de cliente" o "Crear Reembolso Físico Directo" (sin cita).

        Administrador: Todo lo del trabajador + Historial global de ventas/reembolsos + Reportes (Por Cliente y Por Producto más vendido) + 🔔 Campana de Notificaciones (Alertas de stock < 30).

5. Historias de Usuario y Funcionalidades (User Stories Destacadas)

US-01: Simulación de Compra y Carrito

    Como cliente, quiero agregar productos a mi carrito visualizando el total a pagar, para realizar un pago simulado con tarjeta.

    Criterios:

        [ ] Permitir ver catálogo y agregar al carrito sin estar logueado (pedir login solo al pagar).

        [ ] Validar que el stock sea suficiente en MongoDB justo en el momento de procesar el pago.

US-02: Gestión Dual de Reembolsos

    Como trabajador, quiero gestionar devoluciones mediante un folio de app o de forma directa en tienda, para reintegrar el stock correctamente (límite de 90 días).

    Criterios:

        [ ] Opción A: Buscar folio, registrar "Funciona/No funciona" y aprobar.

        [ ] Opción B: Seleccionar venta pasada acorde al nombre del cliente y folio de venta, producto, registrar estado y aprobar directo.

        [ ] Solo reintegrar la cantidad al inventario si el producto se marca como "Funciona".

US-03: Integridad Referencial de Categorías

    Como trabajador, quiero gestionar las categorías del inventario.

    Criterios:

        [ ] Bloquear la eliminación de una categoría si tiene 1 o más productos asignados.

        [ ] Al actualizar el nombre de una categoría, reflejar el cambio en todos los productos.

        [ ] Se despliega la lista con las categorias en el crud de registrar productos.

US-04: Escáner de Código de Barras

    Como trabajador, quiero usar la cámara del dispositivo para leer un código de barras, para localizar rápidamente un componente en el inventario o agregar stock.

    Criterios: Integración de expo-camera para escanear formatos estándar e inyectar el código en la barra de búsqueda.

6. Seguridad, Infraestructura y Control de Versiones

    Variables de Entorno y APIs ocultas: Las URIs de MongoDB, puertos y Secretos JWT se almacenan en un archivo .env en Render. Ninguna API Key estará hardcodeada en el frontend de React Native. Se usa .env.example en Git.

    Control de Sesión: JWT almacenado localmente con AsyncStorage para mantener la sesión activa al cerrar la app.

    Validación de Inputs y Seguridad: Uso de librerías en el backend para sanear todo dato entrante, previniendo vulnerabilidades y asegurando el Control de Acceso Basado en Roles (RBAC) para que un Cliente jamás acceda a endpoints de Trabajador.