const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { verifyToken, optionalAuth, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { STAFF_ROLES } = require('../config/constants');
const s = require('../validators/schemas');

const staff = [verifyToken, requireRole(...STAFF_ROLES)];

router.get('/', optionalAuth, validate(s.productListQuery, 'query'), ctrl.listProducts); // catálogo público
router.post('/', ...staff, validate(s.productCreate), ctrl.createProduct);
router.put('/:id', ...staff, validate(s.idParam, 'params'), validate(s.productUpdate), ctrl.updateProduct);
router.delete('/:id', ...staff, validate(s.idParam, 'params'), ctrl.deleteProduct);

module.exports = router;
