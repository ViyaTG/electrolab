// HTTPS transport works on Render's free instances, where SMTP ports are blocked.
function createBrevoMailer({ env = process.env, request = fetch } = {}) {
  const configuration = () => {
    if (!env.BREVO_API_KEY) throw new Error('Falta configurar BREVO_API_KEY.');
    if (!env.MAIL_FROM_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.MAIL_FROM_EMAIL)) throw new Error('Configura MAIL_FROM_EMAIL con un remitente verificado en Brevo.');
  };
  async function call(path, method = 'GET', body) {
    configuration();
    const response = await request(`https://api.brevo.com/v3/${path}`, {
      method,
      headers: { 'api-key': env.BREVO_API_KEY, accept: 'application/json', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => ({}));
    // Never log the API key, recovery code, response body or recipient.
    if (!response.ok) throw new Error(`El servicio de correo respondió HTTP ${response.status}.`);
    return data;
  }
  return {
    async send(to, subject, text) {
      const result = await call('smtp/email', 'POST', {
        sender: { name: env.MAIL_FROM_NAME || 'ES', email: env.MAIL_FROM_EMAIL },
        to: [{ email: to }], subject, textContent: text
      });
      if (!result.messageId) throw new Error('El servicio de correo no confirmó la aceptación del mensaje.');
      return result.messageId;
    },
    async verify() {
      const data = await call('senders');
      if (!data.senders?.some((sender) => sender.email.toLowerCase() === env.MAIL_FROM_EMAIL.toLowerCase() && sender.active)) {
        throw new Error('El remitente aún no está activo/verificado en Brevo.');
      }
      return true;
    }
  };
}
module.exports = { createBrevoMailer };
