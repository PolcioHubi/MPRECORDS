const Klient = require('../models/Klient');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id, type: 'klient' }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register klient
// @route   POST /api/klienci/rejestracja
// @access  Public
exports.rejestracja = async (req, res) => {
    try {
        const { email, haslo, imie, nazwisko, telefon } = req.body;

        // Check if klient exists
        const exists = await Klient.findOne({ email });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Konto z tym emailem już istnieje'
            });
        }

        const klient = await Klient.create({
            email,
            haslo,
            imie,
            nazwisko,
            telefon
        });

        const token = generateToken(klient._id);

        res.status(201).json({
            success: true,
            data: {
                _id: klient._id,
                email: klient.email,
                imie: klient.imie,
                nazwisko: klient.nazwisko
            },
            token
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Login klient
// @route   POST /api/klienci/logowanie
// @access  Public
exports.logowanie = async (req, res) => {
    try {
        const { email, haslo } = req.body;

        if (!email || !haslo) {
            return res.status(400).json({
                success: false,
                message: 'Podaj email i hasło'
            });
        }

        const klient = await Klient.findOne({ email }).select('+haslo');

        if (!klient || !(await klient.porownajHaslo(haslo))) {
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowy email lub hasło'
            });
        }

        if (!klient.aktywny) {
            return res.status(401).json({
                success: false,
                message: 'Konto zostało dezaktywowane'
            });
        }

        const token = generateToken(klient._id);

        res.status(200).json({
            success: true,
            data: {
                _id: klient._id,
                email: klient.email,
                imie: klient.imie,
                nazwisko: klient.nazwisko
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current klient profile
// @route   GET /api/klienci/profil
// @access  Private (Klient)
exports.getProfil = async (req, res) => {
    try {
        const klient = await Klient.findById(req.klient._id).populate('koszyk.produkt');
        
        res.status(200).json({
            success: true,
            data: klient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update klient profile
// @route   PUT /api/klienci/profil
// @access  Private (Klient)
exports.updateProfil = async (req, res) => {
    try {
        const { imie, nazwisko, telefon, adres } = req.body;

        const klient = await Klient.findByIdAndUpdate(
            req.klient._id,
            { imie, nazwisko, telefon, adres },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: klient
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get koszyk
// @route   GET /api/klienci/koszyk
// @access  Private (Klient)
exports.getKoszyk = async (req, res) => {
    try {
        const klient = await Klient.findById(req.klient._id).populate('koszyk.produkt');
        
        res.status(200).json({
            success: true,
            data: klient.koszyk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add to koszyk
// @route   POST /api/klienci/koszyk
// @access  Private (Klient)
exports.addToKoszyk = async (req, res) => {
    try {
        const { produktId, rozmiar, ilosc = 1 } = req.body;

        const klient = await Klient.findById(req.klient._id);
        
        // Check if product already in cart with same size
        const existingIndex = klient.koszyk.findIndex(
            item => item.produkt.toString() === produktId && item.rozmiar === rozmiar
        );

        if (existingIndex > -1) {
            klient.koszyk[existingIndex].ilosc += ilosc;
        } else {
            klient.koszyk.push({
                produkt: produktId,
                rozmiar,
                ilosc
            });
        }

        await klient.save();
        
        const updated = await Klient.findById(req.klient._id).populate('koszyk.produkt');

        res.status(200).json({
            success: true,
            data: updated.koszyk
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update koszyk item
// @route   PUT /api/klienci/koszyk/:index
// @access  Private (Klient)
exports.updateKoszykItem = async (req, res) => {
    try {
        const { ilosc } = req.body;
        const index = parseInt(req.params.index);

        const klient = await Klient.findById(req.klient._id);
        
        if (index >= 0 && index < klient.koszyk.length) {
            if (ilosc <= 0) {
                klient.koszyk.splice(index, 1);
            } else {
                klient.koszyk[index].ilosc = ilosc;
            }
            await klient.save();
        }

        const updated = await Klient.findById(req.klient._id).populate('koszyk.produkt');

        res.status(200).json({
            success: true,
            data: updated.koszyk
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Remove from koszyk
// @route   DELETE /api/klienci/koszyk/:index
// @access  Private (Klient)
exports.removeFromKoszyk = async (req, res) => {
    try {
        const index = parseInt(req.params.index);

        const klient = await Klient.findById(req.klient._id);
        
        if (index >= 0 && index < klient.koszyk.length) {
            klient.koszyk.splice(index, 1);
            await klient.save();
        }

        const updated = await Klient.findById(req.klient._id).populate('koszyk.produkt');

        res.status(200).json({
            success: true,
            data: updated.koszyk
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Clear koszyk
// @route   DELETE /api/klienci/koszyk
// @access  Private (Klient)
exports.clearKoszyk = async (req, res) => {
    try {
        await Klient.findByIdAndUpdate(req.klient._id, { koszyk: [] });

        res.status(200).json({
            success: true,
            data: []
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
