const Produkt = require('../models/Produkt');

// @desc    Get all produkty
// @route   GET /api/produkty
// @access  Public
exports.getProdukty = async (req, res) => {
    try {
        const { kategoria, status } = req.query;
        let query = { status: 'aktywny' };
        
        if (kategoria) query.kategoria = kategoria;
        
        const produkty = await Produkt.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: produkty.length,
            data: produkty
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all produkty (admin)
// @route   GET /api/produkty/admin
// @access  Private
exports.getProduktyAdmin = async (req, res) => {
    try {
        const produkty = await Produkt.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: produkty.length,
            data: produkty
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single produkt
// @route   GET /api/produkty/:id
// @access  Public
exports.getProdukt = async (req, res) => {
    try {
        const produkt = await Produkt.findById(req.params.id);
        
        if (!produkt) {
            return res.status(404).json({
                success: false,
                message: 'Produkt nie znaleziony'
            });
        }
        
        res.status(200).json({
            success: true,
            data: produkt
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create produkt
// @route   POST /api/produkty
// @access  Private
exports.createProdukt = async (req, res) => {
    try {
        const produkt = await Produkt.create(req.body);
        res.status(201).json({
            success: true,
            data: produkt
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update produkt
// @route   PUT /api/produkty/:id
// @access  Private
exports.updateProdukt = async (req, res) => {
    try {
        const produkt = await Produkt.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!produkt) {
            return res.status(404).json({
                success: false,
                message: 'Produkt nie znaleziony'
            });
        }
        
        res.status(200).json({
            success: true,
            data: produkt
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete produkt
// @route   DELETE /api/produkty/:id
// @access  Private
exports.deleteProdukt = async (req, res) => {
    try {
        const produkt = await Produkt.findByIdAndDelete(req.params.id);
        
        if (!produkt) {
            return res.status(404).json({
                success: false,
                message: 'Produkt nie znaleziony'
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
