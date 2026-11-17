const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/refundController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { ROLES, STAFF_ROLES } = require('../config/constants');
const s = require('../validators/schemas');

router.use(verifyToken);

// Cliente
router.post('/', requireRole(ROLES.CLIENTE), validate(s.refundCreate), ctrl.createRefund);
router.get('/mine', requireRole(ROLES.CLIENTE), ctrl.myRefunds);
router.get('/availability', requireRole(ROLES.CLIENTE), validate(s.appointmentQuery, 'query'), ctrl.appointmentAvailability);

// Trabajador y administrador
router.get('/', requireRole(...STAFF_ROLES), validate(s.refundListQuery, 'query'), ctrl.listRefunds);
router.get('/folio/:folio', requireRole(...STAFF_ROLES), validate(s.folioParam, 'params'), ctrl.getRefundByFolio);
router.patch('/:id/resolve', requireRole(...STAFF_ROLES), validate(s.idParam, 'params'), validate(s.refundResolve), ctrl.resolveRefund);
router.post('/direct', requireRole(...STAFF_ROLES), validate(s.refundDirect), ctrl.createDirectRefund);

module.exports = router;
