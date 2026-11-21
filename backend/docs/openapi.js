/**
 * @module docs/openapi
 * Publica el contrato HTTP a partir de routers, validadores Zod y modelos vigentes.
 * Las restricciones entre campos y las reglas transaccionales se describen por operación.
 */
const { zodToJsonSchema } = require('zod-to-json-schema');
const schemas = require('../validators/schemas');
const auth = require('../middlewares/authMiddleware');
const notes = require('./operations.json');

const json = schema => zodToJsonSchema(schema, { target: 'openApi3', $refStrategy: 'none' });
const components = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, json(schema)]));
/** Convierte los tipos anulables de Mongoose al formato de OpenAPI 3.0. */
function normalize(schema) {
  if (Array.isArray(schema)) return schema.map(normalize);
  if (!schema || typeof schema !== 'object') return schema;
  const result = Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, normalize(value)]));
  if (Array.isArray(result.type) && result.type.includes('null')) {
    result.type = result.type.find(type => type !== 'null');
    result.nullable = true;
  }
  return result;
}
for (const name of ['Category', 'Product', 'Sku', 'Sale', 'Refund']) {
  components[name] = normalize(require(`../models/${name}`).schema.toJSONSchema());
}
components.Profile = { type: 'object', properties: { id: { type: 'string' }, nombre: { type: 'string' }, email: { type: 'string' }, rol: { type: 'string', enum: ['cliente', 'trabajador', 'administrador'] } } };
components.Product.properties.categoria = { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Category' }], nullable: true };
components.Session = { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/Profile' } } };
const content = schema => ({ 'application/json': { schema } });
const object = { type: 'object', additionalProperties: true };
const error = { type: 'object', properties: { message: { type: 'string' }, code: { type: 'string' }, errors: { type: 'array', items: object }, currentDocument: object } };
const paths = {};

for (const resource of ['auth', 'categories', 'products', 'skus', 'sales', 'refunds', 'reports']) {
  const file = { categories: 'category', products: 'product', skus: 'sku', sales: 'sale', refunds: 'refund', reports: 'report' }[resource] || resource;
  const router = require(`../routes/${file}Routes`);
  const global = router.stack.filter(layer => !layer.route).map(layer => layer.handle);
  for (const layer of router.stack.filter(layer => layer.route)) {
    const route = layer.route;
    const path = '/' + resource + (route.path === '/' ? '' : route.path.replace(/:(\w+)/g, '{$1}'));
    const handlers = [...global, ...route.stack.map(entry => entry.handle)];
    for (const method of Object.keys(route.methods)) {
      const key = `${method.toUpperCase()} /api${path.replace(/\{(\w+)\}/g, ':$1')}`;
      const info = notes[key];
      if (!info) throw new Error(`Falta descripción OpenAPI para ${key}`);
      const protectedRoute = handlers.includes(auth.verifyToken);
      const roles = handlers.flatMap(handler => handler.allowedRoles || []);
      const operation = {
        tags: [resource], operationId: `${method}_${resource}_${route.path.replace(/\W/g, '_')}`,
        summary: info.summary,
        description: `${info.description}\n\n${roles.length ? 'Roles permitidos: ' + roles.join(', ') + '.' : protectedRoute ? 'Requiere sesión autenticada.' : 'Acceso público.'}`,
        security: protectedRoute ? [{ bearerAuth: [] }] : [], parameters: [], responses: {}
      };
      if (handlers.includes(auth.optionalAuth)) operation.security = [{}, { bearerAuth: [] }];
      for (const handler of handlers.filter(fn => fn.validation)) {
        const { schema, source } = handler.validation;
        const definition = json(schema);
        if (source === 'body') operation.requestBody = { required: true, content: content(definition) };
        else for (const [name, property] of Object.entries(definition.properties || {})) {
          operation.parameters.push({ name, in: source === 'params' ? 'path' : 'query', required: source === 'params' || (definition.required || []).includes(name), schema: property });
        }
      }
      const statuses = new Set([...info.description.matchAll(/\b([245]\d\d)\b/g)].map(match => match[1]));
      statuses.add('500');
      if (handlers.some(fn => fn.validation)) statuses.add('400');
      if (protectedRoute) statuses.add('401');
      if (roles.length) statuses.add('403');
      if (resource === 'auth') statuses.add('429');
      if (operation.requestBody) statuses.add('413');
      const modelName = { auth: path.endsWith('/profile') ? 'Profile' : 'Session', categories: 'Category', products: 'Product', skus: 'Sku', sales: 'Sale', refunds: 'Refund' }[resource];
      let response = info.response;
      if (modelName && !['delete'].includes(method) && !/forgot-password|reset-password|availability/.test(path)) {
        const reference = { $ref: `#/components/schemas/${modelName}` };
        response = response.type === 'array' ? { type: 'array', items: reference } : response.properties?.items ? { type: 'object', properties: { total: { type: 'integer' }, items: { type: 'array', items: reference } } } : reference;
      }
      for (const status of statuses) operation.responses[status] = { description: info.description, content: content(Number(status) >= 400 ? error : response) };
      paths[path] = { ...paths[path], [method]: operation };
    }
  }
}
paths['/health'] = { get: { tags: ['health'], summary: 'Estado de conexión de la API', security: [], responses: Object.fromEntries(['200', '503'].map(status => [status, { description: status === '200' ? 'MongoDB conectado' : 'MongoDB no disponible', content: content({ type: 'object', required: ['status', 'version'], properties: { status: { type: 'string', enum: ['ok', 'unavailable'] }, version: { type: 'string', example: 'v1.0.0' } } }) }])) } };

module.exports = {
  openapi: '3.0.3', info: { title: 'ElectroLab API', version: require('../package.json').version,
    description: 'Contrato de la API vigente. Los cuerpos y parámetros se derivan de Zod. Las reglas de fecha futura, Luhn, pertenencia y concurrencia se ejecutan en servidor. Las rutas heredadas /components no están montadas.' },
  servers: [{ url: '/api' }], paths,
  components: { schemas: components, securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } }
};
