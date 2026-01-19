const express = require('express');
const router = express.Router();
const {
    getProdukty,
    getProduktyAdmin,
    getProdukt,
    createProdukt,
    updateProdukt,
    deleteProdukt
} = require('../controllers/produktyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getProdukty)
    .post(protect, createProdukt);

router.get('/admin', protect, getProduktyAdmin);

router.route('/:id')
    .get(getProdukt)
    .put(protect, updateProdukt)
    .delete(protect, deleteProdukt);

module.exports = router;
