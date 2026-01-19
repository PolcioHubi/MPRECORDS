const mongoose = require('mongoose');

const ustawieniaSchema = new mongoose.Schema({
    socialMedia: {
        instagram: { type: String, default: '' },
        youtube: { type: String, default: '' },
        spotify: { type: String, default: '' },
        tiktok: { type: String, default: '' }
    },
    heroVideo: {
        type: String,
        default: ''
    },
    heroImage: {
        type: String,
        default: ''
    },
    // Efekty wizualne
    particlesEnabled: {
        type: Boolean,
        default: true
    },
    customCursorEnabled: {
        type: Boolean,
        default: true
    },
    // Mini player
    miniPlayerEnabled: {
        type: Boolean,
        default: true
    },
    miniPlayerTrackId: {
        type: String,
        default: ''
    },
    // Marquee banner
    marqueeEnabled: {
        type: Boolean,
        default: true
    },
    marqueeText: {
        type: String,
        default: 'MP RECORDS • NOWA MUZYKA • SPRAWDŹ WYDANIA •'
    },
    marqueePages: {
        type: [String],
        default: ['/', '/wydania', '/sklep', '/media', '/czlonkowie']
    },
    // Rotating headline per page
    pageHeadlines: {
        type: Map,
        of: {
            enabled: { type: Boolean, default: false },
            phrases: { type: [String], default: [] },
            interval: { type: Number, default: 3000 }
        },
        default: {}
    },
    // Main hero headline (strona główna)
    headlineEnabled: {
        type: Boolean,
        default: true
    },
    headlinePhrases: {
        type: [String],
        default: ['MP RECORDS', 'NOWA ERA', 'SŁUCHAJ TERAZ', 'DOŁĄCZ DO NAS']
    },
    headlineInterval: {
        type: Number,
        default: 3000
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ustawienia', ustawieniaSchema);
