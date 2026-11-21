import Constants from 'expo-constants';

// En desarrollo (Expo Go) toma automáticamente la IP de tu PC, la misma desde la que Expo sirve la app.
const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';

// En producción define EXPO_PUBLIC_API_URL con la URL pública del backend (https://...onrender.com/api).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:4000/api`;

const REQUEST_TIMEOUT_MS = 15000;

/**
 * Ejecuta una petición JSON y conserva los detalles de conflicto del servidor.
 * @param {string} endpoint Ruta relativa a API_BASE_URL con barra inicial.
 * @param {object} [options] Método, cuerpo y token Bearer opcionales.
 * @returns {Promise<object|Array>} Respuesta JSON parseada.
 * @throws {Error} Error HTTP con status y metadatos, o error de red sin status.
 */
export async function apiRequest(endpoint, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (networkError) {
    // Sin conexión, IP incorrecta, firewall o tiempo agotado: no hay status HTTP.
    const error = new Error('No se pudo conectar con el servidor');
    error.status = undefined;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Error de conexión con el servidor');
    error.status = response.status;
    error.code = data.code;
    error.errors = data.errors;
    error.currentDocument = data.currentDocument;
    error.data = data;
    throw error;
  }
  return data;
}

// Texto amigable para mostrar en pantalla (incluye el primer error de validación si existe).
export function errMsg(err) {
  if (err?.errors?.length) {
    const first = err.errors[0];
    const labels = { fechaCita: 'Fecha', horaCita: 'Horario', codigo: 'Código SKU', sku: 'SKU', nombre: 'Nombre', precio: 'Precio ($)', cantidad: 'Cantidad', categoria: 'Categoría', email: 'Correo', password: 'Contraseña', motivo: 'Motivo', fotoEvidencia: 'Foto del producto', descripcion: 'Descripción' };
    return first.campo ? `${labels[first.campo] || first.campo}: ${first.mensaje}` : first.mensaje;
  }
  return err?.message || 'Ocurrió un error inesperado';
}
