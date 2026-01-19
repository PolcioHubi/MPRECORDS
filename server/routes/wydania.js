const express = require('express');
const router = express.Router();
const {
    getWydania,
    getWydaniaAdmin,
    getWydanie,
    createWydanie,
    updateWydanie,
    deleteWydanie,
    moveWydanie
} = require('../controllers/wydaniaController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getWydania)
    .post(protect, createWydanie);

router.get('/admin', protect, getWydaniaAdmin);

router.put('/:id/move', protect, moveWydanie);

router.route('/:id')
    .get(getWydanie)
    .put(protect, updateWydanie)
    .delete(protect, deleteWydanie);

module.exports = router;
