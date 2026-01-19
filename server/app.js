const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const wydaniaRoutes = require('./routes/wydania');
const produktyRoutes = require('./routes/produkty');
const czlonkowieRoutes = require('./routes/czlonkowie');
const ustawieniaRoutes = require('./routes/ustawienia');
const uploadRoutes = require('./routes/upload');
const kontaktRoutes = require('./routes/kontakt');
const klienciRoutes = require('./routes/klienci');
const zamowieniaRoutes = require('./routes/zamowienia');
const backupRoutes = require('./routes/backup');

// Import middleware
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// ===================
// MIDDLEWARE
// ===================

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static files - assets (from root)
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Static files - client
app.use(express.static(path.join(__dirname, '../client')));

// Static files - admin
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ===================
// API ROUTES
// ===================

app.use('/api/auth', authRoutes);
app.use('/api/wydania', wydaniaRoutes);
app.use('/api/produkty', produktyRoutes);
app.use('/api/czlonkowie', czlonkowieRoutes);
app.use('/api/ustawienia', ustawieniaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/kontakt', kontaktRoutes);
app.use('/api/klienci', klienciRoutes);
app.use('/api/zamowienia', zamowieniaRoutes);
app.use('/api/backup', backupRoutes);

// Spotify data fetch endpoint (no auth needed)
app.get('/api/spotify/fetch', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ success: false, message: 'Brak URL' });
        }
        
        // Extract Spotify ID from URL
        const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Nieprawidłowy link Spotify' });
        }
        
        const [, type, id] = match;
        
        // Fetch both oEmbed (for thumbnail) and page (for artist info)
        const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${id}`;
        const pageUrl = `https://open.spotify.com/${type}/${id}`;
        
        const [oembedRes, pageRes] = await Promise.all([
            fetch(oembedUrl),
            fetch(pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })
        ]);
        
        const oembedData = await oembedRes.json();
        const pageHtml = await pageRes.text();
        
        let nazwa = oembedData.title || '';
        let autorzy = '';
        let rok = null;
        
        // Try to extract artist and year from page meta tags
        // og:description format: "Artist · album/Song · Title · Year"
        // description format: "Listen to X on Spotify. Song · Artist · Year"
        const ogDescMatch = pageHtml.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
        const descMatch = pageHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
        
        if (descMatch) {
            const desc = descMatch[1];
            // Format: "Listen to X on Spotify. Song · Artist · Year"
            // or: "Listen to X on Spotify. Artist · Song · Year"
            const songMatch = desc.match(/Song\s*·\s*([^·]+)/i);
            if (songMatch) {
                // Artist is before "Song ·" or after it
                autorzy = songMatch[1].trim().replace(/\s*·\s*\d{4}.*$/, '');
            }
            
            // Extract year (4 digits at the end)
            const yearMatch = desc.match(/·\s*(\d{4})\s*$/);
            if (yearMatch) {
                rok = parseInt(yearMatch[1]);
            }
        }
        
        // Fallback: og:description - first part before " · album" or " · Song"
        if (!autorzy && ogDescMatch) {
            const desc = ogDescMatch[1];
            // Format: "Artist · album · Title · Year" or "Artist · Song · Year"
            const parts = desc.split(' · ');
            if (parts.length >= 1) {
                // First part is artist(s)
                const firstPart = parts[0].trim();
                // Skip if it looks like just the title
                if (!firstPart.toLowerCase().includes('listen to')) {
                    autorzy = firstPart;
                }
            }
            
            // Try to get year from og:description if not found yet
            if (!rok) {
                const yearMatch = desc.match(/·\s*(\d{4})\s*$/);
                if (yearMatch) {
                    rok = parseInt(yearMatch[1]);
                }
            }
        }
        
        res.json({
            success: true,
            data: {
                nazwa: nazwa,
                autorzy: autorzy,
                rok: rok,
                okladka: oembedData.thumbnail_url || '',
                spotifyLink: url,
                type: type
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===================
// FRONTEND ROUTES
// ===================

// Admin panel - Express 5 syntax
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Client routes - SPA style
app.get('/sklep', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/sklep.html'));
});

app.get('/kontakt', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/kontakt.html'));
});

app.get('/czlonkowie', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/czlonkowie.html'));
});

app.get('/wydania', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/wydania.html'));
});

app.get('/wydania/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/wydanie.html'));
});

app.get('/produkt', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/produkt.html'));
});

app.get('/koszyk', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/koszyk.html'));
});

app.get('/zamowienie', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/pages/zamowienie.html'));
});

// Homepage - use client index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Client homepage (alternative)
app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ===================
// ERROR HANDLING
// ===================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Nie znaleziono endpointu'
    });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
