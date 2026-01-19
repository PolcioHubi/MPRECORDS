const Czlonek = require('../models/Czlonek');

// @desc    Get all czlonkowie
// @route   GET /api/czlonkowie
// @access  Public
exports.getCzlonkowie = async (req, res) => {
    try {
        const czlonkowie = await Czlonek.find({ aktywny: true }).sort({ kolejnosc: 1 });
        res.status(200).json({
            success: true,
            count: czlonkowie.length,
            data: czlonkowie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all czlonkowie (admin)
// @route   GET /api/czlonkowie/admin
// @access  Private
exports.getCzlonkowieAdmin = async (req, res) => {
    try {
        const czlonkowie = await Czlonek.find().sort({ kolejnosc: 1 });
        res.status(200).json({
            success: true,
            count: czlonkowie.length,
            data: czlonkowie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single czlonek
// @route   GET /api/czlonkowie/:id
// @access  Public
exports.getCzlonek = async (req, res) => {
    try {
        const czlonek = await Czlonek.findById(req.params.id);
        
        if (!czlonek) {
            return res.status(404).json({
                success: false,
                message: 'Członek nie znaleziony'
            });
        }
        
        res.status(200).json({
            success: true,
            data: czlonek
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create czlonek
// @route   POST /api/czlonkowie
// @access  Private
exports.createCzlonek = async (req, res) => {
    try {
        const czlonek = await Czlonek.create(req.body);
        res.status(201).json({
            success: true,
            data: czlonek
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update czlonek
// @route   PUT /api/czlonkowie/:id
// @access  Private
exports.updateCzlonek = async (req, res) => {
    try {
        const czlonek = await Czlonek.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!czlonek) {
            return res.status(404).json({
                success: false,
                message: 'Członek nie znaleziony'
            });
        }
        
        res.status(200).json({
            success: true,
            data: czlonek
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete czlonek
// @route   DELETE /api/czlonkowie/:id
// @access  Private
exports.deleteCzlonek = async (req, res) => {
    try {
        const czlonek = await Czlonek.findByIdAndDelete(req.params.id);
        
        if (!czlonek) {
            return res.status(404).json({
                success: false,
                message: 'Członek nie znaleziony'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
