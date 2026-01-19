const express = require('express');
const router = express.Router();
const Wiadomosc = require('../models/Wiadomosc');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/kontakt
// @desc    Wyślij wiadomość kontaktową (public)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { email, temat, tresc } = req.body;
        
        if (!email || !tresc) {
            return res.status(400).json({
                success: false,
                message: 'Email i treść są wymagane'
            });
        }
        
        // Prosta walidacja email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowy format email'
            });
        }
        
        const wiadomosc = await Wiadomosc.create({
            email,
            temat: temat || 'Kontakt',
            tresc
        });
        
        res.status(201).json({
            success: true,
            message: 'Wiadomość została wysłana!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd wysyłania wiadomości'
        });
    }
});

// @route   GET /api/kontakt
// @desc    Pobierz wszystkie wiadomości (admin)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const wiadomosci = await Wiadomosc.find().sort({ dataWyslania: -1 });
        res.json({
            success: true,
            count: wiadomosci.length,
            data: wiadomosci
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd pobierania wiadomości'
        });
    }
});

// @route   PUT /api/kontakt/:id/przeczytana
// @desc    Oznacz jako przeczytaną
// @access  Private
router.put('/:id/przeczytana', protect, async (req, res) => {
    try {
        const wiadomosc = await Wiadomosc.findByIdAndUpdate(
            req.params.id,
            { przeczytana: true },
            { new: true }
        );
        
        if (!wiadomosc) {
            return res.status(404).json({
                success: false,
                message: 'Wiadomość nie znaleziona'
            });
        }
        
        res.json({
            success: true,
            data: wiadomosc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd aktualizacji'
        });
    }
});

// @route   DELETE /api/kontakt/:id
// @desc    Usuń wiadomość
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const wiadomosc = await Wiadomosc.findByIdAndDelete(req.params.id);
        
        if (!wiadomosc) {
            return res.status(404).json({
                success: false,
                message: 'Wiadomość nie znaleziona'
            });
        }
        
        res.json({
            success: true,
            message: 'Wiadomość usunięta'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd usuwania'
        });
    }
});

// @route   GET /api/kontakt/nieprzeczytane
// @desc    Liczba nieprzeczytanych wiadomości
// @access  Private
router.get('/nieprzeczytane', protect, async (req, res) => {
    try {
        const count = await Wiadomosc.countDocuments({ przeczytana: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ count: 0 });
    }
});

module.exports = router;
