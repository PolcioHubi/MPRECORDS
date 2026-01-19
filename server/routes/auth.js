const express = require('express');
const router = express.Router();
const { login, verify, setup } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/verify', protect, verify);
router.post('/setup', setup);

module.exports = router;
