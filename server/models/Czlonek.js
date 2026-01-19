const mongoose = require('mongoose');

const czlonekSchema = new mongoose.Schema({
    pseudonim: {
        type: String,
        required: [true, 'Pseudonim jest wymagany'],
        trim: true
    },
    rola: {
        type: String,
        trim: true,
        default: ''
    },
    zdjecie: {
        type: String,
        default: ''
    },
    opis: {
        type: String,
        default: ''
    },
    instagram: {
        type: String,
        default: ''
    },
    spotify: {
        type: String,
        default: ''
    },
    kolejnosc: {
        type: Number,
        default: 0
    },
    aktywny: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Czlonek', czlonekSchema);
