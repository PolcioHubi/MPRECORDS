const mongoose = require('mongoose');

const rozmiarSchema = new mongoose.Schema({
    nazwa: {
        type: String,
        required: true
    },
    stan: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const produktSchema = new mongoose.Schema({
    nazwa: {
        type: String,
        required: [true, 'Nazwa produktu jest wymagana'],
        trim: true
    },
    cena: {
        type: Number,
        required: [true, 'Cena jest wymagana'],
        min: 0
    },
    kategoria: {
        type: String,
        enum: ['odziez', 'akcesoria', 'muzyka', 'inne'],
        default: 'inne'
    },
    rozmiary: [rozmiarSchema],
    zdjecia: [{
        type: String
    }],
    opis: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['aktywny', 'ukryty', 'wyprzedany'],
        default: 'aktywny'
    }
}, {
    timestamps: true
});

// Virtual dla całkowitego stanu magazynowego
produktSchema.virtual('stanMagazynowy').get(function() {
    if (!this.rozmiary || this.rozmiary.length === 0) return 0;
    return this.rozmiary.reduce((sum, r) => sum + (r.stan || 0), 0);
});

// Upewnij się, że virtualne pola są w JSON
produktSchema.set('toJSON', { virtuals: true });
produktSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Produkt', produktSchema);
