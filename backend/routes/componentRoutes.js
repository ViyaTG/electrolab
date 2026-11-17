const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentController');
const verifyWorkerToken = require('../middlewares/authMiddleware');

router.use(verifyWorkerToken);
router.get('/', componentController.getComponents);
router.post('/', componentController.createComponent);
router.put('/:id', componentController.updateComponent);
router.delete('/:id', componentController.deleteComponent);

module.exports = router;
