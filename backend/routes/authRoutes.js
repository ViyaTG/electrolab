const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');

router.post('/register', validate(s.register), auth.register); // solo clientes
router.post('/login', validate(s.login), auth.login); // clientes
router.post('/staff/login', validate(s.login), auth.staffLogin); // trabajadores y administradores
router.post('/forgot-password', validate(s.forgotPassword), auth.forgotPassword);
router.post('/reset-password', validate(s.resetPassword), auth.resetPassword);
router.get('/profile', verifyToken, auth.getProfile);

module.exports = router;
