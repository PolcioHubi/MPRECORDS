const mongoose = require('mongoose');

const zamowienieSchema = new mongoose.Schema({
    numerZamowienia: {
        type: String,
        unique: true
    },
    klient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Klient'
    },
    // Dane do wysyłki (mogą być inne niż dane klienta)
    daneDostawy: {
        imie: { type: String, required: true },
        nazwisko: { type: String, required: true },
        email: { type: String, required: true },
        telefon: { type: String, required: true },
        ulica: { type: String, required: true },
        miasto: { type: String, required: true },
        kodPocztowy: { type: String, required: true },
        kraj: { type: String, default: 'Polska' }
    },
    produkty: [{
        produkt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produkt'
        },
        nazwa: String,
        cena: Number,
        rozmiar: String,
        ilosc: { type: Number, default: 1 },
        zdjecie: String
    }],
    podsumowanie: {
        produkty: { type: Number, default: 0 },
        wysylka: { type: Number, default: 15 },
        razem: { type: Number, default: 0 }
    },
    metodaPlatnosci: {
        type: String,
        enum: ['przelew', 'blik', 'karta', 'paypal', 'pobranie'],
        default: 'przelew'
    },
    statusPlatnosci: {
        type: String,
        enum: ['oczekuje', 'oplacone', 'anulowane', 'zwrot'],
        default: 'oczekuje'
    },
    statusZamowienia: {
        type: String,
        enum: ['nowe', 'potwierdzone', 'w_realizacji', 'wyslane', 'dostarczone', 'anulowane'],
        default: 'nowe'
    },
    notatki: String,
    numerSledzenia: String
}, {
    timestamps: true
});

// Generate order number before saving
zamowienieSchema.pre('save', async function(next) {
    if (!this.numerZamowienia) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.numerZamowienia = `MP${year}${month}${day}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Zamowienie', zamowienieSchema);
