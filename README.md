# ElectroLab v1.0.0 — Inventario y e-commerce simulado

App multiplataforma (React Native + Expo SDK 51) y API en Node.js + Express + MongoDB Atlas.

## Roles (RBAC)
| Rol | Puede |
|---|---|
| Visitante | Ver catálogo y llenar el carrito |
| Cliente | Comprar (pago simulado), historial, solicitar reembolsos |
| Trabajador | CRUD de categorías y productos, escáner, gestión de reembolsos |
| Administrador | Todo lo anterior + historial global, reportes y alertas de stock |

## Puesta en marcha

### Backend
```bash
cd backend
npm install
cp .env.example .env        # completa MONGODB_URI y JWT_SECRET
npm run migrate             # solo si vienes del MVP v0.1.0 (copia trabajadores y convierte categorías)
npm run provision -- admin@electrolab.com 'Contraseña123' "Nombre" administrador
npm run dev
```
`npm run provision -- <correo> '<pass>' "<nombre>" [trabajador|administrador] --reset` restablece la contraseña de una cuenta de personal.

### Cuentas y catálogo inicial

En `backend`, ejecuta `npm run seed:demo` para crear 2 administradores, 3 trabajadores y 20 productos de ejemplo con cantidades diferentes. El script conserva las cuentas, contraseñas y existencias que ya existan. Los precios y stocks son datos de demostración.

Las credenciales generadas quedan en `backend/.credentials.local.json`, excluido de Git. Se usan desde Perfil → Personal. Los correos `@electrolab.test` son identificadores de acceso de prueba, no buzones de correo.

### Recuperación por Gmail

1. Crea el Gmail remitente y activa la verificación en dos pasos.
2. Genera una contraseña de aplicación: [instrucciones oficiales de Google](https://support.google.com/mail/answer/185833?hl=es).
3. Completa `backend/.env` con `SMTP_USER` (dirección Gmail) y `SMTP_PASS` (contraseña de aplicación). Ya están preparados `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true` y `MAIL_FROM=ES`.
4. Desde `backend`, ejecuta `npm run mail:verify`. Comprueba conexión y autenticación sin enviar mensajes. Reinicia el backend tras cambiar `.env`.
5. Solicita un código desde “¿Olvidaste tu contraseña?” para una cuenta de cliente cuyo correo puedas consultar. Comprueba la recepción y el cambio de contraseña antes de dar por verificado el envío.

La recuperación corresponde a cuentas de cliente; las cuentas de personal se administran mediante `provision`. El código vence en 15 minutos y admite hasta 5 intentos incorrectos.

### App
```bash
cd frontend
npm install
npx expo install @react-native-async-storage/async-storage expo-camera expo-image-picker
npx expo start -c
```

## Seguridad
- Validación estricta con Zod en todos los endpoints (`backend/validators/schemas.js`, esquemas `.strict()`).
- `middlewares/sanitize.js` elimina operadores `$` / claves con punto (NoSQL) y etiquetas HTML (XSS).
- JWT + RBAC (`requireRole`) en cada ruta; el registro público solo crea clientes.
- OCC: `version` en productos (edición), descuento atómico de stock en la compra (transacción) y control por renglón en reembolsos.
- Helmet, rate limiting en `/api/auth`, `.env` fuera de Git.
- El pago es simulado: nunca se guarda el número de tarjeta completo ni el CVV.

## Despliegue en Render
El archivo `render.yaml` prepara el backend para Render gratuito. El correo utiliza Brevo por HTTPS, porque el plan gratuito bloquea los puertos SMTP de Gmail.

Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para las variables privadas, la configuración de Atlas, la URL pública de las apps y los perfiles APK/AAB/iOS de EAS.
