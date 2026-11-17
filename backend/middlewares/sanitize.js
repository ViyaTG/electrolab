// Campos que nunca se tocan (contraseñas, códigos, tarjeta simulada y fotos en base64).
const SKIP_VALUES = new Set(['password', 'nuevaPassword', 'codigo', 'fotoEvidencia', 'numeroTarjeta', 'cvv']);

// Etiquetas HTML reales (<script>, </b>, <img ...>); no afecta textos como "Vcc <5V".
const HTML_TAG = /<\/?[a-zA-Z][^>]*>/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

function clean(value, key) {
  if (Array.isArray(value)) return value.map((v) => clean(v, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Elimina operadores de MongoDB ($ne, $gt...) y rutas con punto: previene inyección NoSQL.
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v, k);
    }
    return out;
  }
  if (typeof value === 'string' && !SKIP_VALUES.has(key)) {
    return value.replace(HTML_TAG, '').replace(CONTROL_CHARS, '');
  }
  return value;
}

module.exports = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
};
module.exports.clean = clean;
