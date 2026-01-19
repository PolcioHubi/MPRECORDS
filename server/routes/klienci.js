const express = require('express');
const router = express.Router();
const {
    rejestracja,
    logowanie,
    getProfil,
    updateProfil,
    getKoszyk,
    addToKoszyk,
    updateKoszykItem,
    removeFromKoszyk,
    clearKoszyk
} = require('../controllers/klienciController');
const { protectKlient } = require('../middleware/authMiddleware');

// Public routes
router.post('/rejestracja', rejestracja);
router.post('/logowanie', logowanie);

// Protected routes (require login)
router.get('/profil', protectKlient, getProfil);
router.put('/profil', protectKlient, updateProfil);

// Koszyk routes
router.get('/koszyk', protectKlient, getKoszyk);
router.post('/koszyk', protectKlient, addToKoszyk);
router.put('/koszyk/:index', protectKlient, updateKoszykItem);
router.delete('/koszyk/:index', protectKlient, removeFromKoszyk);
router.delete('/koszyk', protectKlient, clearKoszyk);

module.exports = router;
