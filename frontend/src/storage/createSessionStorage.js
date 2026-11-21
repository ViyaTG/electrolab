// Platform dependencies are injected so the migration can be tested without a device.
/**
 * Crea el adaptador de sesión con dependencias inyectables para pruebas.
 * @param {object} adapters SecureStore, almacenamiento heredado y bandera native.
 * @returns {{save: Function, read: Function, clear: Function}} Operaciones de sesión.
 * @description Migra el JWT nativo al almacén seguro. Web conserva sesión en memoria.
 */
export function createSessionStorage({ secure, legacy, native }) {
  const TOKEN_KEY = 'electrolab.jwt';
  const PROFILE_KEY = 'electrolab.profile';
  const LEGACY_KEY = 'electrolab.session';
  const options = { keychainAccessible: secure.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
  let memory = null;
  const valid = (value) => typeof value?.token === 'string' && value.token.length > 0 && value?.user && typeof value.user === 'object';

  async function save(session) {
    if (!valid(session)) throw new Error('La sesión recibida no es válida.');
    if (native) {
      if (!(await secure.isAvailableAsync())) throw new Error('El almacenamiento seguro no está disponible en este dispositivo.');
      await secure.setItemAsync(TOKEN_KEY, session.token, options);
      try {
        await legacy.setItem(PROFILE_KEY, JSON.stringify(session.user));
        await legacy.removeItem(LEGACY_KEY);
      } catch (error) {
        await secure.deleteItemAsync(TOKEN_KEY, options);
        throw error;
      }
    } else {
      // SecureStore does not exist on web. Never persist JWTs in browser storage.
      await legacy.removeItem(LEGACY_KEY);
      memory = session;
    }
  }

  async function clear() {
    memory = null;
    const results = await Promise.allSettled([
      native ? secure.deleteItemAsync(TOKEN_KEY, options) : Promise.resolve(),
      legacy.removeItem(LEGACY_KEY), legacy.removeItem(PROFILE_KEY)
    ]);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
  }

  async function read() {
    if (!native) {
      await legacy.removeItem(LEGACY_KEY);
      return memory;
    }
    if (!(await secure.isAvailableAsync())) {
      await legacy.removeItem(LEGACY_KEY);
      return null;
    }
    const [token, profile, old] = await Promise.all([
      secure.getItemAsync(TOKEN_KEY, options), legacy.getItem(PROFILE_KEY), legacy.getItem(LEGACY_KEY)
    ]);
    try {
      if (token && profile) {
        const session = { token, user: JSON.parse(profile) };
        if (!valid(session)) throw new Error('Perfil inválido');
        await legacy.removeItem(LEGACY_KEY);
        return session;
      }
      if (old) {
        const session = JSON.parse(old);
        if (valid(session)) { await save(session); return session; }
      }
    } catch (error) {
      await clear();
      return null;
    }
    await clear();
    return null;
  }
  return { save, read, clear };
}
