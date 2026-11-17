const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    nombre: { type: String, required: true },
    precioUnitario: { type: Number, required: true, min: 0 },
    cantidad: { type: Number, required: true, min: 1 },
    cantidadReembolsada: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    folio: { type: String, required: true, unique: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clienteNombre: { type: String, required: true },
    clienteEmail: { type: String, required: true },
    items: { type: [saleItemSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    // Pago simulado: nunca se guarda el número completo ni el CVV.
    pago: {
      metodo: { type: String, default: 'tarjeta_simulada' },
      ultimos4: { type: String, required: true },
      titular: { type: String, required: true }
    }
  },
  { timestamps: true, collection: 'ventas' }
);

module.exports = mongoose.model('Sale', saleSchema);
