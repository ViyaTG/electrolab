const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/storage/createSessionStorage.js'), 'utf8');
const factory = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

async function setup(native = true) {
  const { createSessionStorage } = await factory;
  const plain = new Map();
  const encrypted = new Map();
  const legacy = { getItem: async (key) => plain.get(key) || null, setItem: async (key, value) => { plain.set(key, value); }, removeItem: async (key) => { plain.delete(key); } };
  const secure = { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, isAvailableAsync: async () => true, getItemAsync: async (key) => encrypted.get(key) || null, setItemAsync: async (key, value) => { encrypted.set(key, value); }, deleteItemAsync: async (key) => { encrypted.delete(key); } };
  return { plain, encrypted, secure, storage: createSessionStorage({ native, secure, legacy }) };
}
const session = { token: 'signed-jwt-example', user: { id: 'user1', nombre: 'Prueba', rol: 'cliente' } };

test('El JWT se guarda solo en SecureStore y la sesión se restaura', async () => {
  const { storage, plain, encrypted } = await setup();
  await storage.save(session);
  assert.equal(encrypted.get('electrolab.jwt'), session.token);
  assert.ok(!JSON.stringify([...plain.values()]).includes(session.token));
  assert.deepEqual(await storage.read(), session);
  await storage.clear();
  assert.equal(await storage.read(), null);
  assert.equal(encrypted.size, 0);
});
test('Migra la sesión anterior y elimina el JWT de AsyncStorage', async () => {
  const { storage, plain, encrypted } = await setup();
  plain.set('electrolab.session', JSON.stringify(session));
  assert.deepEqual(await storage.read(), session);
  assert.equal(plain.has('electrolab.session'), false);
  assert.equal(encrypted.get('electrolab.jwt'), session.token);
});
test('Una migración fallida cierra la sesión sin volver a texto plano', async () => {
  const { storage, plain, secure } = await setup();
  plain.set('electrolab.session', JSON.stringify(session));
  secure.setItemAsync = async () => { throw new Error('Keychain unavailable'); };
  assert.equal(await storage.read(), null);
  assert.equal(plain.has('electrolab.session'), false);
  await assert.rejects(storage.save(session), /Keychain/);
});
test('El perfil corrupto no restaura una sesión parcial', async () => {
  const { storage, plain, encrypted } = await setup();
  encrypted.set('electrolab.jwt', session.token);
  plain.set('electrolab.profile', '{invalid');
  assert.equal(await storage.read(), null);
  assert.equal(encrypted.size, 0);
});
test('En web la sesión solo vive en memoria y elimina la copia antigua', async () => {
  const { storage, plain, encrypted } = await setup(false);
  plain.set('electrolab.session', JSON.stringify(session));
  assert.equal(await storage.read(), null);
  await storage.save(session);
  assert.deepEqual(await storage.read(), session);
  assert.equal(plain.size, 0);
  assert.equal(encrypted.size, 0);
  await storage.clear();
  assert.equal(await storage.read(), null);
});
