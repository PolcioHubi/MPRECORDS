const express = require('express');
const router = express.Router();
const {
    getCzlonkowie,
    getCzlonkowieAdmin,
    getCzlonek,
    createCzlonek,
    updateCzlonek,
    deleteCzlonek
} = require('../controllers/czlonkowieController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getCzlonkowie)
    .post(protect, createCzlonek);

router.get('/admin', protect, getCzlonkowieAdmin);

router.route('/:id')
    .get(getCzlonek)
    .put(protect, updateCzlonek)
    .delete(protect, deleteCzlonek);

module.exports = router;
