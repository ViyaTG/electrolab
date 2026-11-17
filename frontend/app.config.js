module.exports = ({ config }) => {
  if (process.env.EAS_BUILD === 'true') {
    const api = process.env.EXPO_PUBLIC_API_URL;
    let url;
    try { url = new URL(api); } catch { throw new Error('Configura EXPO_PUBLIC_API_URL en EAS con la URL HTTPS de la API de Render antes de compilar.'); }
    if (url.protocol !== 'https:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname) || !url.pathname.endsWith('/api')) {
      throw new Error('EXPO_PUBLIC_API_URL debe apuntar a la API pública por HTTPS y terminar en /api.');
    }
  }
  return config;
};
