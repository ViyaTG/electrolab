const { z } = require('zod');
const { passesLuhn } = require('../utils/luhn');
const { MAX_PHOTO_CHARS } = require('../config/constants');
const { isFutureDay, SLOTS } = require('../services/appointments');

// Mensajes de validación en español.
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      return { message: issue.received === 'undefined' ? 'Campo requerido' : 'Tipo de dato inválido' };
    case 'too_small':
      return { message: issue.type === 'string' ? `Debe tener al menos ${issue.minimum} caracteres` : `Debe ser mayor o igual a ${issue.minimum}` };
    case 'too_big':
      return { message: issue.type === 'string' ? `Debe tener como máximo ${issue.maximum} caracteres` : `Debe ser menor o igual a ${issue.maximum}` };
    case 'unrecognized_keys':
      return { message: 'Campos no permitidos' };
    case 'invalid_enum_value':
      return { message: 'Valor no permitido' };
    default:
      return { message: ctx.defaultError };
  }
});

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Identificador inválido');
const text = (min, max) => z.string().trim().min(min).max(max);
const email = z.string().trim().toLowerCase().email('Correo inválido').max(120);
const strongPassword = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir una letra')
  .regex(/\d/, 'La contraseña debe incluir un número');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD');
const pagination = {
  limit: z.coerce.number().int().min(1).max(100).default(30),
  skip: z.coerce.number().int().min(0).default(0)
};

// ---------- Autenticación ----------
const register = z.object({ nombre: text(2, 80), email, password: strongPassword }).strict();
const login = z.object({ email, password: z.string().min(1).max(72) }).strict();
const forgotPassword = z.object({ email }).strict();
const resetPassword = z
  .object({ email, codigo: z.string().regex(/^\d{6}$/, 'El código tiene 6 dígitos'), nuevaPassword: strongPassword })
  .strict();

// ---------- Catálogo ----------
const categoryBody = z.object({ nombre: text(2, 60) }).strict();
const skuBody = z.object({ codigo: text(1, 40).transform((v) => v.toUpperCase()), descripcion: text(0, 120).default('') }).strict();
const appointmentQuery = z.object({ fecha: z.string().refine((v) => isFutureDay(v), 'Elige un día posterior a hoy.') }).strict();

const productFields = {
  sku: text(1, 40),
  nombre: text(2, 120),
  categoria: objectId,
  encapsulado: text(0, 40),
  ubicacion: text(0, 60),
  especificaciones: text(0, 500),
  precio: z.number().min(0).max(1000000),
  cantidad: z.number().int().min(0).max(1000000),
  codigoBarras: z.string().trim().max(64).regex(/^[A-Za-z0-9\-_.]*$/, 'El código de barras solo admite letras, números, - _ .')
};
const productCreate = z
  .object({
    sku: productFields.sku,
    nombre: productFields.nombre,
    categoria: productFields.categoria,
    precio: productFields.precio,
    cantidad: productFields.cantidad,
    encapsulado: productFields.encapsulado.optional(),
    ubicacion: productFields.ubicacion.optional(),
    especificaciones: productFields.especificaciones.optional(),
    codigoBarras: productFields.codigoBarras.optional()
  })
  .strict();
const productUpdate = z
  .object({
    version: z.number().int().min(0),
    sku: productFields.sku.optional(),
    nombre: productFields.nombre.optional(),
    categoria: productFields.categoria.optional(),
    precio: productFields.precio.optional(),
    cantidad: productFields.cantidad.optional(),
    encapsulado: productFields.encapsulado.optional(),
    ubicacion: productFields.ubicacion.optional(),
    especificaciones: productFields.especificaciones.optional(),
    codigoBarras: productFields.codigoBarras.optional()
  })
  .strict();
const productListQuery = z.object({ q: z.string().trim().max(80).optional(), categoria: objectId.optional() }).strict();

// ---------- Ventas (pago simulado) ----------
const notExpired = (value) => {
  const [mm, yy] = value.split('/').map(Number);
  const now = new Date();
  const lastDay = new Date(2000 + yy, mm, 0, 23, 59, 59);
  return lastDay >= now;
};
const checkout = z
  .object({
    items: z.array(z.object({ productoId: objectId, cantidad: z.number().int().min(1).max(999) }).strict()).min(1).max(50),
    pago: z
      .object({
        numeroTarjeta: z
          .string()
          .regex(/^[\d\s-]{12,23}$/, 'Número de tarjeta inválido')
          .transform((v) => v.replace(/\D/g, ''))
          .refine(passesLuhn, 'Número de tarjeta inválido'),
        titular: text(2, 80),
        vencimiento: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA').refine(notExpired, 'La tarjeta está vencida'),
        cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido')
      })
      .strict()
  })
  .strict();
const salesSearchQuery = z.object({ nombre: z.string().trim().max(80).optional(), folio: z.string().trim().max(30).optional() }).strict();
const listQuery = z.object({ ...pagination }).strict();

// ---------- Reembolsos ----------
const refundMethod = z.enum(['tarjeta', 'efectivo']);
const refundCreate = z
  .object({
    ventaId: objectId,
    productoId: objectId,
    cantidad: z.number().int().min(1).max(999),
    motivo: text(10, 500),
    metodoReembolso: refundMethod,
    modalidad: z.enum(['cita_fisica', 'correo']),
    fechaCita: isoDate.optional(),
    horaCita: z.enum(SLOTS).optional(),
    fotoEvidencia: z
      .string()
      .max(MAX_PHOTO_CHARS, 'La imagen es demasiado pesada')
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, 'La foto debe ser una imagen JPG, PNG o WEBP')
  })
  .strict()
  .refine((d) => d.modalidad !== 'cita_fisica' || isFutureDay(d.fechaCita), { message: 'Elige un día posterior a hoy.', path: ['fechaCita'] })
  .refine((d) => d.modalidad !== 'cita_fisica' || !!d.horaCita, { message: 'Selecciona un horario disponible.', path: ['horaCita'] })
  .refine((d) => d.modalidad !== 'correo' || (!d.fechaCita && !d.horaCita), { message: 'Las devoluciones por correo no llevan cita.', path: ['fechaCita'] });
const refundResolve = z
  .object({ decision: z.enum(['aprobar', 'rechazar']), funciona: z.boolean().optional(), notas: text(0, 300).optional() })
  .strict()
  .refine((d) => d.decision !== 'aprobar' || typeof d.funciona === 'boolean', { message: 'Indica si el producto funciona', path: ['funciona'] });
const refundDirect = z
  .object({
    ventaId: objectId,
    productoId: objectId,
    cantidad: z.number().int().min(1).max(999),
    funciona: z.boolean(),
    metodoReembolso: refundMethod,
    motivo: text(0, 300).optional()
  })
  .strict();
const refundListQuery = z.object({ estado: z.enum(['pendiente', 'aprobado', 'rechazado']).optional(), ...pagination }).strict();

// ---------- Parámetros y reportes ----------
const idParam = z.object({ id: objectId }).strict();
const folioParam = z.object({ folio: z.string().regex(/^[A-Za-z]{3}-[A-Fa-f0-9]{8}$/, 'Folio inválido') }).strict();
const reportQuery = z
  .object({ desde: isoDate.optional(), hasta: isoDate.optional(), limit: z.coerce.number().int().min(1).max(100).default(20) })
  .strict();

module.exports = {
  register, login, forgotPassword, resetPassword, categoryBody, skuBody, appointmentQuery, productCreate, productUpdate, productListQuery,
  checkout, salesSearchQuery, listQuery, refundCreate, refundResolve, refundDirect, refundListQuery, idParam, folioParam, reportQuery
};
