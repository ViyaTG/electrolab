# Render y compilaciones móviles

## Estado del proyecto

- API publicada: `https://electrolab-api-2tob.onrender.com/api`.
- Servicio Render: `electrolab-api-2tob`, plan gratuito, región Oregon, espacio `My Workspace`.
- Repositorio privado: `https://github.com/ViyaTG/electrolab`.
- Proyecto Expo: `@viyatg/inventario-electronica-mvp`. Los entornos `preview` y `production` ya tienen `EXPO_PUBLIC_API_URL` configurada.
- Brevo: clave API y remitente activo verificados sin enviar mensajes. La recepción de un código real aún debe comprobarse desde una cuenta de cliente.
- MongoDB Atlas ya contiene el catálogo y las cuentas; Render alojará solamente la API.
- Android e iOS guardan el JWT en SecureStore. La primera apertura migra la sesión anterior y borra el JWT de AsyncStorage.
- AsyncStorage conserva únicamente el perfil y el carrito. En web, la sesión vive en memoria y se pierde al recargar.
- Gmail SMTP se puede verificar en local. Render gratuito necesita el transporte HTTPS (`MAIL_PROVIDER=brevo`).

## Builds generados (versión 0.1.0)

- Android APK: [descarga](https://expo.dev/artifacts/eas/oILm9haP4ecFfdx63MPPaTniKk2MgEirwJ8dYLQFaP0.apk) · [compilación EAS](https://expo.dev/accounts/viyatg/projects/inventario-electronica-mvp/builds/e75ab997-8e84-4869-ba48-ce806803e2a6).
- Simulador iOS: [descarga](https://expo.dev/artifacts/eas/rLN6VN8hYu7ky0R_pVa3RbrpOEtAGaW08FUCbeghEKY.tar.gz) · [compilación EAS](https://expo.dev/accounts/viyatg/projects/inventario-electronica-mvp/builds/9115f78c-9e31-4a0d-a374-0d5ce8b2e39b).
- Copias locales en `releases/`, excluidas de Git y de las cargas de EAS.

Ambos builds usan la API HTTPS de Render. El archivo de iOS contiene una `.app` para simulador: no se instala en un iPhone físico. La instalación y la prueba de los flujos en dispositivo/simulador quedan pendientes.

## 1. Preparar el correo por HTTPS

1. Crea o utiliza una cuenta de Brevo y verifica el remitente. Sigue su [guía de remitentes](https://developers.brevo.com/docs/getting-started-with-senders-and-domains).
2. Genera una clave API y colócala en `BREVO_API_KEY` de `backend/.env`, junto con `MAIL_FROM_EMAIL` y `MAIL_FROM_NAME=ES`.
3. Cambia `MAIL_PROVIDER=brevo` para probar ese transporte en local. La contraseña de aplicación de Gmail corresponde únicamente al transporte SMTP.
4. Ejecuta `npm run mail:verify` desde `backend`. Verifica la clave y el remitente sin enviar mensajes.
5. Prueba “¿Olvidaste tu contraseña?” con una cuenta de cliente real y comprueba que llegue el código y que permita cambiar la contraseña.

La aceptación por la API del proveedor no prueba la entrega al buzón. Es necesario verificar el mensaje recibido. Las cuentas de personal no usan este flujo.

## 2. Publicar la API en Render gratuito

Se necesita un repositorio GitHub/GitLab que Render pueda clonar. El archivo `render.yaml` configura un servicio gratuito con `backend` como raíz, `npm ci --omit=dev`, `npm start`, Node 22 y `/api/health` como comprobación de disponibilidad.

Configura estas variables privadas en Render:

| Variable | Valor |
| --- | --- |
| `MONGODB_URI` | URI del mismo clúster Atlas existente |
| `JWT_SECRET` | Secreto del backend, conservarlo si deben seguir siendo válidos los JWT actuales |
| `NODE_ENV` | `production` |
| `MAIL_PROVIDER` | `brevo` |
| `BREVO_API_KEY` | Clave API de Brevo |
| `MAIL_FROM_EMAIL` | Remitente verificado |
| `MAIL_FROM_NAME` | `ES` |

No subas `.env` ni `.credentials.local.json` al repositorio. Tampoco pongas secretos del backend en variables `EXPO_PUBLIC_*`.

En Atlas, autoriza las IP de salida del servicio Render desde Network Access. Render debe devolver HTTP 200 en `/api/health` y listar los productos en `/api/products` antes de configurar las apps.

El servicio gratuito [entra en reposo tras 15 minutos sin tráfico](https://render.com/docs/free); el arranque de una petición posterior puede tardar. El catálogo conserva el reintento mediante actualizar; las demás acciones pueden reintentarse después de que termine el arranque. Un fallo de red no elimina la sesión.

## 3. Configurar el destino de las apps

Cuando la API esté publicada, establece `EXPO_PUBLIC_API_URL=https://URL-REAL.onrender.com/api` en los entornos **preview** y **production** de EAS. La URL se incorpora al compilar: cambiarla requiere una nueva compilación.

Ejemplo desde `frontend` (sustituye la URL real):

```powershell
eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://URL-REAL.onrender.com/api --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://URL-REAL.onrender.com/api --visibility plaintext
```

Si la variable ya existe, actualízala con `eas env:update`. El guard de `app.config.js` impide builds EAS sin una URL pública HTTPS terminada en `/api`.

## 4. Compilar

Desde `frontend`:

```powershell
# Android: APK instalable directamente
eas build --platform android --profile preview

# Android: AAB para Google Play
eas build --platform android --profile production

# iOS: build para simulador
eas build --platform ios --profile ios-simulator

# iOS: distribución mediante TestFlight/App Store
eas build --platform ios --profile production
```

Para un iPhone físico, EAS genera un `.ipa` firmado; se requiere una cuenta Apple Developer y credenciales de firma. El perfil `preview` de iOS permite distribución interna con dispositivos registrados. Un build de simulador no se instala en un iPhone físico. Consulta [Expo: primer build](https://docs.expo.dev/build/setup/) y [builds de simulador](https://docs.expo.dev/build-reference/simulators/).

La compilación y la publicación en las tiendas son pasos separados. EAS usa la cuota de la cuenta; no se han contratado planes ni enviado apps a las tiendas.

## Verificación antes de distribuir

Comprueba en dispositivo: acceso de cliente y personal, reabrir la app conservando sesión, cerrar sesión y reabrir sin recuperar el JWT, catálogo y semáforo de stock, carrito, pago simulado, recuperación por correo y expiración de sesión. La compilación de bundles no sustituye una compilación nativa firmada ni esta prueba.
