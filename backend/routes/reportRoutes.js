const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { ROLES } = require('../config/constants');
const s = require('../validators/schemas');

// Todo lo de este módulo es exclusivo del administrador.
router.use(verifyToken, requireRole(ROLES.ADMIN));
router.get('/customers', validate(s.reportQuery, 'query'), ctrl.byCustomer);
router.get('/top-products', validate(s.reportQuery, 'query'), ctrl.topProducts);
router.get('/stock-alerts', ctrl.stockAlerts);

module.exports = router;
