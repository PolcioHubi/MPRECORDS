const Zamowienie = require('../models/Zamowienie');
const Klient = require('../models/Klient');
const Produkt = require('../models/Produkt');

// @desc    Create zamowienie
// @route   POST /api/zamowienia
// @access  Private (Klient) or Public (guest checkout)
exports.createZamowienie = async (req, res) => {
    try {
        const { daneDostawy, produkty, metodaPlatnosci } = req.body;

        if (!produkty || produkty.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Koszyk jest pusty'
            });
        }

        // Calculate totals and validate stock
        let sumaProdukty = 0;
        const produktyZDanymi = [];
        const stockUpdates = [];

        for (const item of produkty) {
            const produkt = await Produkt.findById(item.produktId);
            if (!produkt) {
                return res.status(400).json({
                    success: false,
                    message: `Produkt ${item.produktId} nie istnieje`
                });
            }
            
            // Check stock for size if applicable
            if (item.rozmiar && produkt.rozmiary?.length > 0) {
                const sizeObj = produkt.rozmiary.find(r => r.nazwa === item.rozmiar);
                if (!sizeObj || sizeObj.stan < item.ilosc) {
                    return res.status(400).json({
                        success: false,
                        message: `Niewystarczający stan magazynowy dla ${produkt.nazwa} (${item.rozmiar})`
                    });
                }
                // Prepare stock update
                stockUpdates.push({
                    produktId: produkt._id,
                    rozmiar: item.rozmiar,
                    ilosc: item.ilosc
                });
            }
            
            const itemTotal = produkt.cena * item.ilosc;
            sumaProdukty += itemTotal;
            
            produktyZDanymi.push({
                produkt: produkt._id,
                nazwa: produkt.nazwa,
                cena: produkt.cena,
                rozmiar: item.rozmiar,
                ilosc: item.ilosc,
                zdjecie: produkt.zdjecia?.[0] || ''
            });
        }

        // Update stock
        for (const update of stockUpdates) {
            await Produkt.updateOne(
                { _id: update.produktId, 'rozmiary.nazwa': update.rozmiar },
                { $inc: { 'rozmiary.$.stan': -update.ilosc } }
            );
        }

        const kosztWysylki = sumaProdukty >= 200 ? 0 : 15; // Darmowa wysyłka od 200 PLN

        const zamowienie = await Zamowienie.create({
            klient: req.klient?._id || null,
            daneDostawy,
            produkty: produktyZDanymi,
            podsumowanie: {
                produkty: sumaProdukty,
                wysylka: kosztWysylki,
                razem: sumaProdukty + kosztWysylki
            },
            metodaPlatnosci
        });

        // Clear klient's cart if logged in
        if (req.klient) {
            await Klient.findByIdAndUpdate(req.klient._id, { koszyk: [] });
        }

        res.status(201).json({
            success: true,
            data: zamowienie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get klient's zamowienia
// @route   GET /api/zamowienia/moje
// @access  Private (Klient)
exports.getMojeZamowienia = async (req, res) => {
    try {
        const zamowienia = await Zamowienie.find({ klient: req.klient._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: zamowienia
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single zamowienie
// @route   GET /api/zamowienia/:id
// @access  Private
exports.getZamowienie = async (req, res) => {
    try {
        const zamowienie = await Zamowienie.findById(req.params.id)
            .populate('klient', 'email imie nazwisko');

        if (!zamowienie) {
            return res.status(404).json({
                success: false,
                message: 'Zamówienie nie znalezione'
            });
        }

        res.status(200).json({
            success: true,
            data: zamowienie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all zamowienia (admin)
// @route   GET /api/zamowienia/admin
// @access  Private (Admin)
exports.getZamowieniaAdmin = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        
        if (status) query.statusZamowienia = status;

        const zamowienia = await Zamowienie.find(query)
            .populate('klient', 'email imie nazwisko')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: zamowienia.length,
            data: zamowienia
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update zamowienie status (admin)
// @route   PUT /api/zamowienia/:id
// @access  Private (Admin)
exports.updateZamowienie = async (req, res) => {
    try {
        const { statusZamowienia, statusPlatnosci, numerSledzenia, notatki } = req.body;

        const zamowienie = await Zamowienie.findByIdAndUpdate(
            req.params.id,
            { statusZamowienia, statusPlatnosci, numerSledzenia, notatki },
            { new: true, runValidators: true }
        ).populate('klient', 'email imie nazwisko');

        if (!zamowienie) {
            return res.status(404).json({
                success: false,
                message: 'Zamówienie nie znalezione'
            });
        }

        res.status(200).json({
            success: true,
            data: zamowienie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete zamowienie (admin)
// @route   DELETE /api/zamowienia/:id
// @access  Private (Admin)
exports.deleteZamowienie = async (req, res) => {
    try {
        const zamowienie = await Zamowienie.findByIdAndDelete(req.params.id);

        if (!zamowienie) {
            return res.status(404).json({
                success: false,
                message: 'Zamówienie nie znalezione'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Zamówienie usunięte'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
