require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const sanitize = require('./middlewares/sanitize');
const errorHandler = require('./middlewares/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('La variable JWT_SECRET no está definida en el entorno (.env).');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // Render funciona detrás de un proxy

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' })); // las fotos de reembolso viajan en base64
app.use(sanitize); // elimina operadores $ y etiquetas HTML antes de llegar a los controladores

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' }
});

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/refunds', require('./routes/refundRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable', version: 'v1.0.0' });
});
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`ElectroLab API v1.0.0 ejecutándose en el puerto ${PORT}`));
  process.on('SIGTERM', () => {
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
});
