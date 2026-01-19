const express = require('express');
const router = express.Router();
const {
    createZamowienie,
    getMojeZamowienia,
    getZamowienie,
    getZamowieniaAdmin,
    updateZamowienie,
    deleteZamowienie
} = require('../controllers/zamowieniaController');
const { protect, protectKlient, optionalKlient } = require('../middleware/authMiddleware');

// Create order (logged in or guest)
router.post('/', optionalKlient, createZamowienie);

// Klient routes
router.get('/moje', protectKlient, getMojeZamowienia);

// Admin routes
router.get('/admin', protect, getZamowieniaAdmin);
router.get('/:id', protect, getZamowienie);
router.put('/:id', protect, updateZamowienie);
router.delete('/:id', protect, deleteZamowienie);

module.exports = router;
