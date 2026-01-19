/**
 * Backup Controller - MP RECORDS
 * Eksport i import danych
 */

const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { Readable } = require('stream');

// Models
const Wydanie = require('../models/Wydanie');
const Produkt = require('../models/Produkt');
const Czlonek = require('../models/Czlonek');
const Wiadomosc = require('../models/Wiadomosc');
const Zamowienie = require('../models/Zamowienie');
const Ustawienia = require('../models/Ustawienia');
const Klient = require('../models/Klient');

/**
 * Eksport wszystkich danych do pliku ZIP
 */
exports.exportData = async (req, res) => {
    try {
        // Pobierz wszystkie dane z bazy
        const [wydania, produkty, czlonkowie, wiadomosci, zamowienia, ustawienia, klienci] = await Promise.all([
            Wydanie.find().lean(),
            Produkt.find().lean(),
            Czlonek.find().lean(),
            Wiadomosc.find().lean(),
            Zamowienie.find().lean(),
            Ustawienia.find().lean(),
            Klient.find().select('-haslo').lean() // Bez haseł klientów
        ]);

        // Przygotuj dane do eksportu
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                source: 'MP RECORDS'
            },
            data: {
                wydania,
                produkty,
                czlonkowie,
                wiadomosci,
                zamowienia,
                ustawienia,
                klienci
            }
        };

        // Zbierz wszystkie ścieżki do plików (zdjęcia, audio)
        const filesToInclude = [];
        
        // Zdjęcia wydań
        wydania.forEach(w => {
            if (w.okladka && w.okladka.startsWith('/uploads/')) {
                filesToInclude.push(w.okladka);
            }
        });
        
        // Zdjęcia produktów
        produkty.forEach(p => {
            if (p.zdjecie && p.zdjecie.startsWith('/uploads/')) {
                filesToInclude.push(p.zdjecie);
            }
            if (p.zdjecia && Array.isArray(p.zdjecia)) {
                p.zdjecia.forEach(z => {
                    if (z && z.startsWith('/uploads/')) {
                        filesToInclude.push(z);
                    }
                });
            }
        });
        
        // Zdjęcia członków
        czlonkowie.forEach(c => {
            if (c.zdjecie && c.zdjecie.startsWith('/uploads/')) {
                filesToInclude.push(c.zdjecie);
            }
        });

        // Unikalne ścieżki
        const uniqueFiles = [...new Set(filesToInclude)];

        // Ustaw nagłówki odpowiedzi
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=mprecords-backup-${timestamp}.zip`);

        // Utwórz archiwum ZIP
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Błąd tworzenia archiwum' });
            }
        });

        archive.pipe(res);

        // Dodaj plik JSON z danymi
        archive.append(JSON.stringify(exportData, null, 2), { name: 'data.json' });

        // Dodaj pliki z uploadów
        const uploadsDir = path.join(__dirname, '../uploads');
        
        for (const filePath of uniqueFiles) {
            const relativePath = filePath.replace('/uploads/', '');
            const absolutePath = path.join(uploadsDir, relativePath);
            
            try {
                await fs.access(absolutePath);
                archive.file(absolutePath, { name: `uploads/${relativePath}` });
            } catch (err) {
                console.warn(`Plik nie istnieje: ${absolutePath}`);
            }
        }

        await archive.finalize();

    } catch (error) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: 'Błąd eksportu danych',
                error: error.message 
            });
        }
    }
};

/**
 * Import danych z pliku ZIP
 */
exports.importData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Brak pliku do importu' 
            });
        }

        const zipBuffer = req.file.buffer;
        const uploadsDir = path.join(__dirname, '../uploads');
        
        let importedData = null;
        const importedFiles = [];

        // Rozpakuj ZIP z bufora
        const directory = await unzipper.Open.buffer(zipBuffer);
        
        for (const file of directory.files) {
            if (file.path === 'data.json') {
                // Parsuj dane JSON
                const content = await file.buffer();
                importedData = JSON.parse(content.toString());
            } else if (file.path.startsWith('uploads/') && file.type === 'File') {
                // Zapisz plik
                const relativePath = file.path.replace('uploads/', '');
                const absolutePath = path.join(uploadsDir, relativePath);
                
                // Utwórz katalog jeśli nie istnieje
                await fs.mkdir(path.dirname(absolutePath), { recursive: true });
                
                // Zapisz plik
                const content = await file.buffer();
                await fs.writeFile(absolutePath, content);
                importedFiles.push(relativePath);
            }
        }

        if (!importedData || !importedData.data) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nieprawidłowy format pliku backup' 
            });
        }

        const { data } = importedData;
        const stats = {
            wydania: 0,
            produkty: 0,
            czlonkowie: 0,
            wiadomosci: 0,
            zamowienia: 0,
            ustawienia: 0,
            klienci: 0,
            pliki: importedFiles.length
        };

        // Opcja: czy nadpisywać istniejące dane
        const overwrite = req.body.overwrite === 'true' || req.body.overwrite === true;

        // Import wydań
        if (data.wydania && data.wydania.length > 0) {
            for (const item of data.wydania) {
                const { _id, __v, ...itemData } = item;
                try {
                    if (overwrite) {
                        await Wydanie.findOneAndUpdate(
                            { nazwa: itemData.nazwa },
                            itemData,
                            { upsert: true, new: true }
                        );
                    } else {
                        const exists = await Wydanie.findOne({ nazwa: itemData.nazwa });
                        if (!exists) {
                            await Wydanie.create(itemData);
                        }
                    }
                    stats.wydania++;
                } catch (err) {
                    console.warn('Błąd importu wydania:', err.message);
                }
            }
        }

        // Import produktów
        if (data.produkty && data.produkty.length > 0) {
            for (const item of data.produkty) {
                const { _id, __v, ...itemData } = item;
                try {
                    if (overwrite) {
                        await Produkt.findOneAndUpdate(
                            { nazwa: itemData.nazwa },
                            itemData,
                            { upsert: true, new: true }
                        );
                    } else {
                        const exists = await Produkt.findOne({ nazwa: itemData.nazwa });
                        if (!exists) {
                            await Produkt.create(itemData);
                        }
                    }
                    stats.produkty++;
                } catch (err) {
                    console.warn('Błąd importu produktu:', err.message);
                }
            }
        }

        // Import członków
        if (data.czlonkowie && data.czlonkowie.length > 0) {
            for (const item of data.czlonkowie) {
                const { _id, __v, ...itemData } = item;
                try {
                    if (overwrite) {
                        await Czlonek.findOneAndUpdate(
                            { pseudonim: itemData.pseudonim },
                            itemData,
                            { upsert: true, new: true }
                        );
                    } else {
                        const exists = await Czlonek.findOne({ pseudonim: itemData.pseudonim });
                        if (!exists) {
                            await Czlonek.create(itemData);
                        }
                    }
                    stats.czlonkowie++;
                } catch (err) {
                    console.warn('Błąd importu członka:', err.message);
                }
            }
        }

        // Import wiadomości
        if (data.wiadomosci && data.wiadomosci.length > 0) {
            for (const item of data.wiadomosci) {
                const { _id, __v, ...itemData } = item;
                try {
                    if (overwrite) {
                        await Wiadomosc.findOneAndUpdate(
                            { email: itemData.email, createdAt: itemData.createdAt },
                            itemData,
                            { upsert: true, new: true }
                        );
                    } else {
                        // Wiadomości zawsze dodawaj (nie mają unikalnego identyfikatora)
                        await Wiadomosc.create(itemData);
                    }
                    stats.wiadomosci++;
                } catch (err) {
                    console.warn('Błąd importu wiadomości:', err.message);
                }
            }
        }

        // Import zamówień
        if (data.zamowienia && data.zamowienia.length > 0) {
            for (const item of data.zamowienia) {
                const { _id, __v, ...itemData } = item;
                try {
                    if (overwrite) {
                        await Zamowienie.findOneAndUpdate(
                            { numer: itemData.numer },
                            itemData,
                            { upsert: true, new: true }
                        );
                    } else {
                        const exists = await Zamowienie.findOne({ numer: itemData.numer });
                        if (!exists) {
                            await Zamowienie.create(itemData);
                        }
                    }
                    stats.zamowienia++;
                } catch (err) {
                    console.warn('Błąd importu zamówienia:', err.message);
                }
            }
        }

        // Import ustawień (zawsze nadpisuj - jest tylko jeden rekord)
        if (data.ustawienia && data.ustawienia.length > 0) {
            const settingsData = data.ustawienia[0];
            const { _id, __v, ...itemData } = settingsData;
            try {
                await Ustawienia.findOneAndUpdate({}, itemData, { upsert: true });
                stats.ustawienia = 1;
            } catch (err) {
                console.warn('Błąd importu ustawień:', err.message);
            }
        }

        // Import klientów (bez haseł)
        if (data.klienci && data.klienci.length > 0) {
            for (const item of data.klienci) {
                const { _id, __v, haslo, ...itemData } = item;
                try {
                    if (overwrite) {
                        await Klient.findOneAndUpdate(
                            { email: itemData.email },
                            itemData,
                            { upsert: true, new: true }
                        );
                    } else {
                        const exists = await Klient.findOne({ email: itemData.email });
                        if (!exists) {
                            await Klient.create(itemData);
                        }
                    }
                    stats.klienci++;
                } catch (err) {
                    console.warn('Błąd importu klienta:', err.message);
                }
            }
        }

        res.json({
            success: true,
            message: 'Import zakończony pomyślnie',
            stats,
            metadata: importedData.metadata
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd importu danych',
            error: error.message 
        });
    }
};

/**
 * Pobierz statystyki danych
 */
exports.getStats = async (req, res) => {
    try {
        const [wydania, produkty, czlonkowie, wiadomosci, zamowienia, klienci] = await Promise.all([
            Wydanie.countDocuments(),
            Produkt.countDocuments(),
            Czlonek.countDocuments(),
            Wiadomosc.countDocuments(),
            Zamowienie.countDocuments(),
            Klient.countDocuments()
        ]);

        // Oblicz rozmiar uploadów
        const uploadsDir = path.join(__dirname, '../uploads');
        let uploadsSize = 0;
        let filesCount = 0;

        async function getDirSize(dirPath) {
            try {
                const files = await fs.readdir(dirPath);
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stat = await fs.stat(filePath);
                    if (stat.isDirectory()) {
                        await getDirSize(filePath);
                    } else {
                        uploadsSize += stat.size;
                        filesCount++;
                    }
                }
            } catch (err) {
                // Ignoruj błędy dostępu
            }
        }

        await getDirSize(uploadsDir);

        res.json({
            success: true,
            data: {
                records: {
                    wydania,
                    produkty,
                    czlonkowie,
                    wiadomosci,
                    zamowienia,
                    klienci,
                    total: wydania + produkty + czlonkowie + wiadomosci + zamowienia + klienci
                },
                files: {
                    count: filesCount,
                    size: uploadsSize,
                    sizeFormatted: formatBytes(uploadsSize)
                }
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd pobierania statystyk' 
        });
    }
};

/**
 * Formatuj bajty na czytelny format
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
