const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { STAFF_ROLES } = require('../config/constants');
const s = require('../validators/schemas');

router.get('/', ctrl.listCategories);
router.post('/', verifyToken, requireRole(...STAFF_ROLES), validate(s.categoryBody), ctrl.createCategory);
router.put('/:id', verifyToken, requireRole(...STAFF_ROLES), validate(s.idParam, 'params'), validate(s.categoryBody), ctrl.updateCategory);
router.delete('/:id', verifyToken, requireRole(...STAFF_ROLES), validate(s.idParam, 'params'), ctrl.deleteCategory);

module.exports = router;
