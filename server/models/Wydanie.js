const mongoose = require('mongoose');

const wydanieSchema = new mongoose.Schema({
    nazwa: {
        type: String,
        required: [true, 'Nazwa wydania jest wymagana'],
        trim: true
    },
    autorzy: {
        type: String,
        required: [true, 'Autorzy są wymagani'],
        trim: true
    },
    opis: {
        type: String,
        default: ''
    },
    okladka: {
        type: String,
        default: ''
    },
    rok: {
        type: Number,
        default: new Date().getFullYear()
    },
    spotifyLink: {
        type: String,
        default: ''
    },
    previewAudio: {
        type: String,
        default: ''
    },
    aktywny: {
        type: Boolean,
        default: true
    },
    wyroznienie: {
        type: String,
        enum: ['brak', 'nowosc', 'hot', 'polecane'],
        default: 'brak'
    },
    kolejnosc: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wydanie', wydanieSchema);
