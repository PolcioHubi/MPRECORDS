const Wydanie = require('../models/Wydanie');

// @desc    Get all wydania
// @route   GET /api/wydania
// @access  Public
exports.getWydania = async (req, res) => {
    try {
        const wydania = await Wydanie.find({ aktywny: true }).sort({ kolejnosc: 1, createdAt: -1 });
        res.status(200).json({
            success: true,
            count: wydania.length,
            data: wydania
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all wydania (admin - include inactive)
// @route   GET /api/wydania/admin
// @access  Private
exports.getWydaniaAdmin = async (req, res) => {
    try {
        const wydania = await Wydanie.find().sort({ kolejnosc: 1, createdAt: -1 });
        res.status(200).json({
            success: true,
            count: wydania.length,
            data: wydania
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single wydanie
// @route   GET /api/wydania/:id
// @access  Public
exports.getWydanie = async (req, res) => {
    try {
        const wydanie = await Wydanie.findById(req.params.id);
        
        if (!wydanie) {
            return res.status(404).json({
                success: false,
                message: 'Wydanie nie znalezione'
            });
        }
        
        res.status(200).json({
            success: true,
            data: wydanie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create wydanie
// @route   POST /api/wydania
// @access  Private
exports.createWydanie = async (req, res) => {
    try {
        const wydanie = await Wydanie.create(req.body);
        res.status(201).json({
            success: true,
            data: wydanie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update wydanie
// @route   PUT /api/wydania/:id
// @access  Private
exports.updateWydanie = async (req, res) => {
    try {
        const wydanie = await Wydanie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!wydanie) {
            return res.status(404).json({
                success: false,
                message: 'Wydanie nie znalezione'
            });
        }
        
        res.status(200).json({
            success: true,
            data: wydanie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete wydanie
// @route   DELETE /api/wydania/:id
// @access  Private
exports.deleteWydanie = async (req, res) => {
    try {
        const wydanie = await Wydanie.findByIdAndDelete(req.params.id);
        
        if (!wydanie) {
            return res.status(404).json({
                success: false,
                message: 'Wydanie nie znalezione'
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

// @desc    Move wydanie (change order)
// @route   PUT /api/wydania/:id/move
// @access  Private
exports.moveWydanie = async (req, res) => {
    try {
        const { direction } = req.body;
        const wydania = await Wydanie.find().sort({ kolejnosc: 1, createdAt: -1 });
        
        const currentIndex = wydania.findIndex(w => w._id.toString() === req.params.id);
        if (currentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Wydanie nie znalezione'
            });
        }
        
        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (swapIndex < 0 || swapIndex >= wydania.length) {
            return res.status(400).json({
                success: false,
                message: 'Nie można przenieść wydania'
            });
        }
        
        // Swap using index-based ordering
        const currentWydanie = wydania[currentIndex];
        const swapWydanie = wydania[swapIndex];
        
        // Use new order values based on swapped positions
        await Wydanie.findByIdAndUpdate(currentWydanie._id, { kolejnosc: swapIndex });
        await Wydanie.findByIdAndUpdate(swapWydanie._id, { kolejnosc: currentIndex });
        
        res.status(200).json({
            success: true,
            message: 'Kolejność zmieniona'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
