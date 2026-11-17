const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/saleController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { ROLES, STAFF_ROLES } = require('../config/constants');
const s = require('../validators/schemas');

router.use(verifyToken);
router.post('/checkout', requireRole(ROLES.CLIENTE), validate(s.checkout), ctrl.checkout);
router.get('/mine', requireRole(ROLES.CLIENTE), ctrl.mySales);
router.get('/search', requireRole(...STAFF_ROLES), validate(s.salesSearchQuery, 'query'), ctrl.searchSales);
router.get('/', requireRole(ROLES.ADMIN), validate(s.listQuery, 'query'), ctrl.listAllSales);

module.exports = router;
