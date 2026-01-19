/**
 * Backup Routes - MP RECORDS
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const backupController = require('../controllers/backupController');

// Konfiguracja multer dla importu (przechowuj w pamięci)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' || 
            file.mimetype === 'application/x-zip-compressed' ||
            file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Tylko pliki ZIP są dozwolone'), false);
        }
    }
});

// Eksport danych (pobierz ZIP)
router.get('/export', protect, backupController.exportData);

// Import danych (wgraj ZIP)
router.post('/import', protect, upload.single('backup'), backupController.importData);

// Statystyki danych
router.get('/stats', protect, backupController.getStats);

module.exports = router;
