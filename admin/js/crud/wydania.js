/**
 * Wydania CRUD - MP RECORDS Admin
 */

const WydaniaCRUD = {
    async render() {
        const content = document.getElementById('adminContent');
        const actions = document.getElementById('pageActions');
        
        actions.innerHTML = `<button class="btn btn-primary" id="addWydanieBtn">+ DODAJ WYDANIE</button>`;
        content.innerHTML = '<div class="loading"></div>';
        
        document.getElementById('addWydanieBtn').addEventListener('click', () => this.showForm());
        
        try {
            const response = await AdminAPI.get('/wydania/admin');
            const wydania = response.data || [];
            
            if (wydania.length === 0) {
                content.innerHTML = '<p style="color: var(--color-text-secondary);">Brak wydań. Dodaj pierwsze wydanie!</p>';
                return;
            }
            
            content.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">KOLEJNOŚĆ</th>
                            <th>OKŁADKA</th>
                            <th>NAZWA</th>
                            <th>ARTYŚCI</th>
                            <th>ROK</th>
                            <th>WYRÓŻNIENIE</th>
                            <th>STATUS</th>
                            <th>AKCJE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${wydania.map((item, index) => `
                            <tr data-id="${item._id}">
                                <td class="order-buttons">
                                    <button class="btn btn-xs" data-action="up" data-id="${item._id}" ${index === 0 ? 'disabled' : ''}>↑</button>
                                    <button class="btn btn-xs" data-action="down" data-id="${item._id}" ${index === wydania.length - 1 ? 'disabled' : ''}>↓</button>
                                </td>
                                <td><img src="${item.okladka || '/assets/image/placeholder.png'}" class="table-image" alt=""></td>
                                <td>${item.nazwa}</td>
                                <td>${item.autorzy || '-'}</td>
                                <td>${item.rok || '-'}</td>
                                <td>${this.getBadgeLabel(item.wyroznienie)}</td>
                                <td>${item.aktywny ? '✅ Aktywny' : '❌ Ukryty'}</td>
                                <td class="table-actions">
                                    <button class="btn btn-sm" onclick="WydaniaCRUD.showForm('${item._id}')">EDYTUJ</button>
                                    <button class="btn btn-sm btn-danger" onclick="WydaniaCRUD.delete('${item._id}')">USUŃ</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            // Add event listeners for order buttons
            document.querySelectorAll('.order-buttons button[data-action]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const id = btn.dataset.id;
                    if (action === 'up') {
                        await this.moveUp(id);
                    } else if (action === 'down') {
                        await this.moveDown(id);
                    }
                });
            });
        } catch (error) {
            content.innerHTML = '<p style="color: var(--color-danger);">Błąd ładowania danych</p>';
        }
    },
    
    getBadgeLabel(wyroznienie) {
        const labels = {
            'brak': '—',
            'nowosc': '🆕 NOWOŚĆ',
            'hot': '🔥 HOT',
            'polecane': '⭐ POLECANE'
        };
        return labels[wyroznienie] || '—';
    },
    
    async showForm(id = null) {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = id ? 'EDYTUJ WYDANIE' : 'DODAJ WYDANIE';
        
        let data = {
            nazwa: '',
            autorzy: '',
            opis: '',
            okladka: '',
            rok: new Date().getFullYear(),
            spotifyLink: '',
            previewAudio: '',
            wyroznienie: 'brak',
            aktywny: true
        };
        
        if (id) {
            try {
                const response = await AdminAPI.get(`/wydania/${id}`);
                data = {
                    ...response.data,
                    autorzy: response.data.autorzy || ''
                };
            } catch (error) {
                Admin.showToast('Błąd ładowania danych', 'error');
                return;
            }
        }
        
        modalBody.innerHTML = `
            <form id="wydanieForm">
                <!-- SPOTIFY IMPORT -->
                <div class="form-group spotify-import">
                    <label>🎵 IMPORTUJ ZE SPOTIFY</label>
                    <div class="upload-row">
                        <input type="text" id="spotifyUrl" placeholder="Wklej link do utworu/albumu ze Spotify...">
                        <button type="button" class="btn btn-primary btn-sm" onclick="WydaniaCRUD.fetchSpotify()">POBIERZ DANE</button>
                    </div>
                    <small style="color: var(--color-text-secondary);">Automatycznie uzupełni nazwę, artystów, rok, okładkę i link</small>
                </div>
                
                <hr style="border-color: var(--color-border); margin: 1.5rem 0;">
                
                <div class="form-group">
                    <label>NAZWA *</label>
                    <input type="text" name="nazwa" value="${data.nazwa}" required>
                </div>
                <div class="form-group">
                    <label>ARTYŚCI</label>
                    <input type="text" name="autorzy" value="${data.autorzy}">
                </div>
                <div class="form-group">
                    <label>OPIS</label>
                    <textarea name="opis">${data.opis || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>OKŁADKA</label>
                    <div class="upload-group">
                        <input type="text" name="okladka" value="${data.okladka || ''}" placeholder="URL okładki">
                        <div class="upload-row">
                            <input type="file" id="okladkaFile" accept="image/*" class="file-input">
                            <button type="button" class="btn btn-sm" onclick="WydaniaCRUD.uploadFile('okladkaFile', 'okladka', 'wydania')">WGRAJ</button>
                        </div>
                        <div id="okladkaPreview">
                            ${data.okladka ? `<img src="${data.okladka}" class="preview-image" alt="Podgląd">` : ''}
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>ROK</label>
                    <input type="number" name="rok" value="${data.rok || ''}">
                </div>
                <div class="form-group">
                    <label>LINK SPOTIFY *</label>
                    <input type="text" name="spotifyLink" value="${data.spotifyLink || ''}" placeholder="https://open.spotify.com/..." required>
                </div>
                <div class="form-group">
                    <label>WYRÓŻNIENIE</label>
                    <select name="wyroznienie">
                        <option value="brak" ${data.wyroznienie === 'brak' ? 'selected' : ''}>Brak</option>
                        <option value="nowosc" ${data.wyroznienie === 'nowosc' ? 'selected' : ''}>🆕 NOWOŚĆ</option>
                        <option value="hot" ${data.wyroznienie === 'hot' ? 'selected' : ''}>🔥 HOT</option>
                        <option value="polecane" ${data.wyroznienie === 'polecane' ? 'selected' : ''}>⭐ POLECANE</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="aktywny" ${data.aktywny ? 'checked' : ''}>
                        AKTYWNY (widoczny na stronie)
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="Admin.closeModal()">ANULUJ</button>
                    <button type="submit" class="btn btn-primary">ZAPISZ</button>
                </div>
            </form>
        `;
        
        document.getElementById('wydanieForm').addEventListener('submit', (e) => this.save(e, id));
        modal.classList.add('active');
    },
    
    async save(e, id) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const data = {
            nazwa: formData.get('nazwa'),
            autorzy: formData.get('autorzy'),
            opis: formData.get('opis'),
            okladka: formData.get('okladka'),
            rok: parseInt(formData.get('rok')) || null,
            spotifyLink: formData.get('spotifyLink'),
            wyroznienie: formData.get('wyroznienie'),
            aktywny: formData.get('aktywny') === 'on'
        };
        
        try {
            if (id) {
                await AdminAPI.put(`/wydania/${id}`, data);
                Admin.showToast('Wydanie zaktualizowane', 'success');
            } else {
                await AdminAPI.post('/wydania', data);
                Admin.showToast('Wydanie dodane', 'success');
            }
            
            Admin.closeModal();
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    },
    
    async delete(id) {
        if (!confirm('Czy na pewno chcesz usunąć to wydanie?')) return;
        
        try {
            await AdminAPI.delete(`/wydania/${id}`);
            Admin.showToast('Wydanie usunięte', 'success');
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    },
    
    async uploadFile(inputId, fieldName, type) {
        const fileInput = document.getElementById(inputId);
        const file = fileInput.files[0];
        
        if (!file) {
            Admin.showToast('Wybierz plik do wgrania', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            Admin.showToast('Wgrywanie...', 'info');
            const response = await AdminAPI.upload(`/upload/${type}`, formData);
            
            // Set the URL in the text input
            const urlInput = document.querySelector(`[name="${fieldName}"]`);
            urlInput.value = response.data.url;
            
            // Update preview based on field
            if (fieldName === 'okladka') {
                const previewDiv = document.getElementById('okladkaPreview');
                previewDiv.innerHTML = `<img src="${response.data.url}" class="preview-image" alt="Podgląd">`;
            } else if (fieldName === 'previewAudio') {
                const previewDiv = document.getElementById('audioPreview');
                previewDiv.innerHTML = `<audio controls src="${response.data.url}" class="preview-audio"></audio>`;
            }
            
            Admin.showToast('Plik wgrany!', 'success');
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    },
    
    async fetchSpotify() {
        const urlInput = document.getElementById('spotifyUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            Admin.showToast('Wklej link ze Spotify', 'error');
            return;
        }
        
        if (!url.includes('spotify.com')) {
            Admin.showToast('To nie jest link ze Spotify', 'error');
            return;
        }
        
        try {
            Admin.showToast('Pobieranie danych ze Spotify...', 'info');
            
            const response = await fetch(`/api/spotify/fetch?url=${encodeURIComponent(url)}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            const data = result.data;
            
            // Fill form fields
            if (data.nazwa) {
                document.querySelector('[name="nazwa"]').value = data.nazwa;
            }
            if (data.autorzy) {
                document.querySelector('[name="autorzy"]').value = data.autorzy;
            }
            if (data.rok) {
                document.querySelector('[name="rok"]').value = data.rok;
            }
            if (data.okladka) {
                document.querySelector('[name="okladka"]').value = data.okladka;
                // Show preview
                const previewDiv = document.getElementById('okladkaPreview');
                previewDiv.innerHTML = `<img src="${data.okladka}" class="preview-image" alt="Podgląd">`;
            }
            if (data.spotifyLink) {
                document.querySelector('[name="spotifyLink"]').value = data.spotifyLink;
            }
            
            Admin.showToast('Dane pobrane ze Spotify! 🎵', 'success');
            
        } catch (error) {
            Admin.showToast(error.message || 'Błąd pobierania danych', 'error');
        }
    },
    
    async moveUp(id) {
        try {
            await AdminAPI.put(`/wydania/${id}/move`, { direction: 'up' });
            this.render();
        } catch (error) {
            Admin.showToast('Błąd zmiany kolejności', 'error');
        }
    },
    
    async moveDown(id) {
        try {
            await AdminAPI.put(`/wydania/${id}/move`, { direction: 'down' });
            this.render();
        } catch (error) {
            Admin.showToast('Błąd zmiany kolejności', 'error');
        }
    }
};
