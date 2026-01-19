const mongoose = require('mongoose');

const wiadomoscSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email jest wymagany'],
        trim: true,
        lowercase: true
    },
    temat: {
        type: String,
        default: 'Kontakt'
    },
    tresc: {
        type: String,
        required: [true, 'Treść wiadomości jest wymagana'],
        maxlength: [2000, 'Wiadomość może mieć maksymalnie 2000 znaków']
    },
    przeczytana: {
        type: Boolean,
        default: false
    },
    dataWyslania: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wiadomosc', wiadomoscSchema);
