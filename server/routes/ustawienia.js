const express = require('express');
const router = express.Router();
const Ustawienia = require('../models/Ustawienia');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/ustawienia
// @desc    Get settings (public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        let ustawienia = await Ustawienia.findOne();
        
        if (!ustawienia) {
            // Create default settings if none exist
            ustawienia = await Ustawienia.create({});
        }
        
        res.json(ustawienia);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd serwera'
        });
    }
});

// @route   PUT /api/ustawienia
// @desc    Update settings
// @access  Private (Admin)
router.put('/', protect, async (req, res) => {
    try {
        let ustawienia = await Ustawienia.findOne();
        
        if (!ustawienia) {
            ustawienia = await Ustawienia.create(req.body);
        } else {
            Object.assign(ustawienia, req.body);
            await ustawienia.save();
        }
        
        res.json({
            success: true,
            data: ustawienia
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd aktualizacji ustawień'
        });
    }
});

module.exports = router;
