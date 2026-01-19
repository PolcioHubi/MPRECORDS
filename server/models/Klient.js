const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const klientSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email jest wymagany'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Podaj poprawny email']
    },
    haslo: {
        type: String,
        required: [true, 'Hasło jest wymagane'],
        minlength: [6, 'Hasło musi mieć minimum 6 znaków'],
        select: false
    },
    imie: {
        type: String,
        required: [true, 'Imię jest wymagane'],
        trim: true
    },
    nazwisko: {
        type: String,
        required: [true, 'Nazwisko jest wymagane'],
        trim: true
    },
    telefon: {
        type: String,
        trim: true
    },
    adres: {
        ulica: String,
        miasto: String,
        kodPocztowy: String,
        kraj: { type: String, default: 'Polska' }
    },
    koszyk: [{
        produkt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produkt'
        },
        rozmiar: String,
        ilosc: { type: Number, default: 1 }
    }],
    aktywny: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
klientSchema.pre('save', async function(next) {
    if (!this.isModified('haslo')) return next();
    this.haslo = await bcrypt.hash(this.haslo, 12);
    next();
});

// Compare password
klientSchema.methods.porownajHaslo = async function(haslo) {
    return await bcrypt.compare(haslo, this.haslo);
};

module.exports = mongoose.model('Klient', klientSchema);
