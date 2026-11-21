/**
 * @module controllers/componentController
 * Casos de uso HTTP. Los routers aplican autenticación, roles y validación Zod.
 * @see ../routes/componentRoutes.js
 */
const Component = require('../models/Component');
const { fuzzyFilterAndRank } = require('../utils/fuzzySearch');

exports.getComponents = async (req, res) => {
  try {
    const { q } = req.query;
    const allComponents = await Component.find().sort({ updatedAt: -1 });
    const results = fuzzyFilterAndRank(allComponents, q);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Error al consultar el inventario' });
  }
};

exports.createComponent = async (req, res) => {
  try {
    const { sku, nombre, categoria, encapsulado, ubicacion, especificaciones, cantidad } = req.body;
    const existing = await Component.findOne({ sku: sku.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un componente con ese SKU.' });
    }
    const newComponent = await Component.create({
      sku,
      nombre,
      categoria,
      encapsulado,
      ubicacion,
      especificaciones,
      cantidad: Number(cantidad) || 0,
      version: 0,
      actualizadoPor: req.worker?.email || 'trabajador'
    });
    return res.status(201).json(newComponent);
  } catch (error) {
    return res.status(400).json({ message: 'Error al registrar el componente', detail: error.message });
  }
};

exports.updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, nombre, categoria, encapsulado, ubicacion, especificaciones, cantidad, version } = req.body;

    if (version === undefined || version === null) {
      return res.status(400).json({
        message: 'Se requiere el número de versión del documento (version) para el control de concurrencia (OCC).'
      });
    }

    const updatedComponent = await Component.findOneAndUpdate(
      { _id: id, version: Number(version) },
      {
        $set: {
          ...(sku !== undefined && { sku: sku.toUpperCase().trim() }),
          ...(nombre !== undefined && { nombre: nombre.trim() }),
          ...(categoria !== undefined && { categoria: categoria.trim() }),
          ...(encapsulado !== undefined && { encapsulado: encapsulado.trim() }),
          ...(ubicacion !== undefined && { ubicacion: ubicacion.trim() }),
          ...(especificaciones !== undefined && { especificaciones: especificaciones.trim() }),
          ...(cantidad !== undefined && { cantidad: Number(cantidad) }),
          actualizadoPor: req.worker?.email || 'trabajador'
        },
        $inc: { version: 1 }
      },
      { new: true, runValidators: true }
    );

    if (!updatedComponent) {
      const exists = await Component.findById(id);
      if (!exists) {
        return res.status(404).json({ message: 'El componente ya no existe en el inventario.' });
      }
      return res.status(409).json({
        code: 'OCC_CONFLICT',
        message: 'Conflicto de edición concurrente: Los datos de esta pieza fueron modificados por otro trabajador. Recarga antes de guardar.',
        currentDocument: exists
      });
    }

    return res.status(200).json(updatedComponent);
  } catch (error) {
    return res.status(400).json({ message: 'Error al actualizar el componente', detail: error.message });
  }
};

exports.deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Component.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Componente no encontrado' });
    return res.status(200).json({ message: 'Componente eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar el componente' });
  }
};
