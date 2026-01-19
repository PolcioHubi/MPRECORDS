const path = require('path');
const fs = require('fs');

// @desc    Upload file
// @route   POST /api/upload/:type or POST /api/upload
// @access  Private
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nie wybrano pliku'
            });
        }

        // Type from params or body
        const type = req.params.type || req.body.folder || 'general';
        const fileUrl = `/uploads/${type}/${req.file.filename}`;
        
        res.status(200).json({
            success: true,
            data: {
                filename: req.file.filename,
                url: fileUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload multiple files
// @route   POST /api/upload/:type/multiple
// @access  Private
exports.uploadMultiple = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nie wybrano plików'
            });
        }

        const files = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/${req.params.type}/${file.filename}`
        }));
        
        res.status(200).json({
            success: true,
            count: files.length,
            data: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
