/**
 * Backup CRUD - MP RECORDS
 * Eksport i import danych
 */

const BackupCRUD = {
    async render() {
        const content = document.getElementById('adminContent');
        const actions = document.getElementById('pageActions');
        
        actions.innerHTML = '';
        
        content.innerHTML = `
            <div class="backup-container">
                <div class="backup-section">
                    <div class="backup-card">
                        <div class="backup-icon">📦</div>
                        <h3>Eksport danych</h3>
                        <p>Pobierz pełną kopię zapasową wszystkich danych i plików (zdjęcia, audio) w formacie ZIP.</p>
                        <div id="statsContainer" class="stats-container">
                            <div class="loading-mini">Ładowanie statystyk...</div>
                        </div>
                        <button class="backup-btn export-btn" id="exportBtn">
                            <span class="btn-icon">⬇️</span>
                            EKSPORTUJ DANE
                        </button>
                    </div>
                    
                    <div class="backup-card">
                        <div class="backup-icon">📥</div>
                        <h3>Import danych</h3>
                        <p>Przywróć dane z pliku kopii zapasowej. Możesz wybrać czy nadpisać istniejące rekordy.</p>
                        
                        <div class="import-options">
                            <label class="checkbox-label">
                                <input type="checkbox" id="overwriteCheck">
                                <span>Nadpisz istniejące dane</span>
                            </label>
                        </div>
                        
                        <div class="upload-zone" id="uploadZone">
                            <input type="file" id="importFile" accept=".zip" hidden>
                            <div class="upload-icon">📁</div>
                            <p>Przeciągnij plik ZIP tutaj lub <span class="upload-link">wybierz plik</span></p>
                            <p class="upload-hint">Maksymalny rozmiar: 500MB</p>
                        </div>
                        
                        <div id="importProgress" class="import-progress" style="display: none;">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill"></div>
                            </div>
                            <p id="progressText">Importowanie...</p>
                        </div>
                        
                        <div id="importResult" class="import-result" style="display: none;"></div>
                    </div>
                </div>
                
                <div class="backup-info">
                    <h4>ℹ️ Informacje</h4>
                    <ul>
                        <li>Eksport zawiera: wydania, produkty, członków, wiadomości, zamówienia, ustawienia i klientów</li>
                        <li>Wszystkie zdjęcia i pliki audio są dołączane do archiwum</li>
                        <li>Hasła klientów NIE są eksportowane ze względów bezpieczeństwa</li>
                        <li>Import bez opcji "Nadpisz" pominie rekordy, które już istnieją</li>
                    </ul>
                </div>
            </div>
        `;
        
        this.addStyles();
        this.setupEventListeners();
        this.loadStats();
    },
    
    addStyles() {
        if (document.getElementById('backupStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'backupStyles';
        styles.textContent = `
            .backup-container {
                max-width: 1000px;
                margin: 0 auto;
            }
            
            .backup-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 24px;
                margin-bottom: 24px;
            }
            
            .backup-card {
                background: var(--card-bg, #1a1a2e);
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
                padding: 24px;
                text-align: center;
            }
            
            .backup-icon {
                font-size: 3rem;
                margin-bottom: 16px;
            }
            
            .backup-card h3 {
                color: var(--purple-light, #a78bfa);
                margin-bottom: 12px;
                font-size: 1.25rem;
            }
            
            .backup-card p {
                color: var(--gray, #888);
                margin-bottom: 20px;
                font-size: 0.9rem;
                line-height: 1.5;
            }
            
            .stats-container {
                background: rgba(124, 58, 237, 0.1);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 20px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                text-align: center;
            }
            
            .stat-item {
                padding: 8px;
            }
            
            .stat-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--purple-light, #a78bfa);
            }
            
            .stat-label {
                font-size: 0.75rem;
                color: var(--gray, #888);
                margin-top: 4px;
            }
            
            .backup-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 14px 28px;
                font-size: 0.9rem;
                font-weight: 600;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .export-btn {
                background: linear-gradient(135deg, #7c3aed, #a78bfa);
                color: white;
            }
            
            .export-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
            }
            
            .export-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .import-options {
                margin-bottom: 20px;
            }
            
            .checkbox-label {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                color: var(--white, #fff);
                font-size: 0.9rem;
            }
            
            .checkbox-label input {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .upload-zone {
                border: 2px dashed var(--border-color, #444);
                border-radius: 12px;
                padding: 32px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .upload-zone:hover,
            .upload-zone.dragover {
                border-color: var(--purple, #7c3aed);
                background: rgba(124, 58, 237, 0.1);
            }
            
            .upload-icon {
                font-size: 2.5rem;
                margin-bottom: 12px;
            }
            
            .upload-zone p {
                margin: 0;
            }
            
            .upload-link {
                color: var(--purple-light, #a78bfa);
                text-decoration: underline;
            }
            
            .upload-hint {
                font-size: 0.8rem !important;
                color: var(--gray, #666) !important;
                margin-top: 8px !important;
            }
            
            .import-progress {
                margin-top: 20px;
            }
            
            .progress-bar {
                height: 8px;
                background: var(--border-color, #333);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #7c3aed, #a78bfa);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .import-result {
                margin-top: 20px;
                padding: 16px;
                border-radius: 8px;
                text-align: left;
            }
            
            .import-result.success {
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid #22c55e;
            }
            
            .import-result.error {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid #ef4444;
            }
            
            .result-title {
                font-weight: bold;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .result-stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                font-size: 0.85rem;
            }
            
            .result-stat {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .backup-info {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 12px;
                padding: 20px;
            }
            
            .backup-info h4 {
                color: #60a5fa;
                margin-bottom: 12px;
            }
            
            .backup-info ul {
                margin: 0;
                padding-left: 20px;
                color: var(--gray, #888);
                font-size: 0.85rem;
                line-height: 1.8;
            }
            
            .loading-mini {
                color: var(--gray, #888);
                font-size: 0.85rem;
            }
            
            @media (max-width: 900px) {
                .backup-section {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(styles);
    },
    
    setupEventListeners() {
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        
        // Upload zone
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('importFile');
        
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].name.endsWith('.zip')) {
                this.importData(files[0]);
            } else {
                Admin.showToast('Wybierz plik ZIP', 'error');
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
            }
        });
    },
    
    async loadStats() {
        try {
            const response = await AdminAPI.get('/backup/stats');
            const { records, files } = response.data;
            
            document.getElementById('statsContainer').innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${records.total}</div>
                        <div class="stat-label">Rekordów</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${files.count}</div>
                        <div class="stat-label">Plików</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${files.sizeFormatted}</div>
                        <div class="stat-label">Rozmiar</div>
                    </div>
                </div>
            `;
        } catch (error) {
            document.getElementById('statsContainer').innerHTML = `
                <p style="color: var(--gray);">Nie udało się załadować statystyk</p>
            `;
        }
    },
    
    async exportData() {
        const btn = document.getElementById('exportBtn');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-icon">⏳</span> Generowanie...';
            
            // Pobierz plik ZIP
            const token = localStorage.getItem('mprecords_token');
            const response = await fetch('/api/backup/export', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Błąd eksportu');
            }
            
            // Pobierz blob i utwórz link do pobrania
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Pobierz nazwę pliku z nagłówka lub użyj domyślnej
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'mprecords-backup.zip';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename=(.+)/);
                if (match) filename = match[1];
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            Admin.showToast('Eksport zakończony pomyślnie!', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            Admin.showToast('Błąd eksportu: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },
    
    async importData(file) {
        const progressDiv = document.getElementById('importProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const resultDiv = document.getElementById('importResult');
        const uploadZone = document.getElementById('uploadZone');
        
        try {
            uploadZone.style.display = 'none';
            progressDiv.style.display = 'block';
            resultDiv.style.display = 'none';
            
            progressFill.style.width = '20%';
            progressText.textContent = 'Przesyłanie pliku...';
            
            const formData = new FormData();
            formData.append('backup', file);
            formData.append('overwrite', document.getElementById('overwriteCheck').checked);
            
            const token = localStorage.getItem('mprecords_token');
            
            // Symuluj progress
            let progress = 20;
            const progressInterval = setInterval(() => {
                if (progress < 80) {
                    progress += 5;
                    progressFill.style.width = progress + '%';
                }
            }, 500);
            
            progressText.textContent = 'Importowanie danych...';
            
            const response = await fetch('/api/backup/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            
            const result = await response.json();
            
            progressDiv.style.display = 'none';
            resultDiv.style.display = 'block';
            
            if (result.success) {
                resultDiv.className = 'import-result success';
                resultDiv.innerHTML = `
                    <div class="result-title">✅ Import zakończony!</div>
                    <div class="result-stats">
                        <div class="result-stat"><span>Wydania:</span> <span>${result.stats.wydania}</span></div>
                        <div class="result-stat"><span>Produkty:</span> <span>${result.stats.produkty}</span></div>
                        <div class="result-stat"><span>Członkowie:</span> <span>${result.stats.czlonkowie}</span></div>
                        <div class="result-stat"><span>Wiadomości:</span> <span>${result.stats.wiadomosci}</span></div>
                        <div class="result-stat"><span>Zamówienia:</span> <span>${result.stats.zamowienia}</span></div>
                        <div class="result-stat"><span>Pliki:</span> <span>${result.stats.pliki}</span></div>
                    </div>
                    <p style="margin-top: 12px; font-size: 0.8rem; color: var(--gray);">
                        Źródło: ${result.metadata?.exportDate ? new Date(result.metadata.exportDate).toLocaleString('pl-PL') : 'Nieznane'}
                    </p>
                `;
                Admin.showToast('Import zakończony pomyślnie!', 'success');
                this.loadStats();
            } else {
                throw new Error(result.message || 'Błąd importu');
            }
            
        } catch (error) {
            console.error('Import error:', error);
            progressDiv.style.display = 'none';
            resultDiv.style.display = 'block';
            resultDiv.className = 'import-result error';
            resultDiv.innerHTML = `
                <div class="result-title">❌ Błąd importu</div>
                <p>${error.message}</p>
            `;
            Admin.showToast('Błąd importu: ' + error.message, 'error');
        }
        
        // Pokaż upload zone ponownie po chwili
        setTimeout(() => {
            uploadZone.style.display = 'block';
            document.getElementById('importFile').value = '';
        }, 3000);
    }
};
