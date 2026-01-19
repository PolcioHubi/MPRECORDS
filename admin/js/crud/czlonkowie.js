/**
 * Czlonkowie CRUD - MP RECORDS Admin
 */

const CzlonkowieCRUD = {
    async render() {
        const content = document.getElementById('adminContent');
        const actions = document.getElementById('pageActions');
        
        actions.innerHTML = `<button class="btn btn-primary" id="addCzlonekBtn">+ DODAJ CZŁONKA</button>`;
        content.innerHTML = '<div class="loading"></div>';
        
        document.getElementById('addCzlonekBtn').addEventListener('click', () => this.showForm());
        
        try {
            const response = await AdminAPI.get('/czlonkowie/admin');
            const czlonkowie = response.data || [];
            
            if (czlonkowie.length === 0) {
                content.innerHTML = '<p style="color: var(--color-text-secondary);">Brak członków. Dodaj pierwszego!</p>';
                return;
            }
            
            content.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ZDJĘCIE</th>
                            <th>PSEUDONIM</th>
                            <th>ROLA</th>
                            <th>KOLEJNOŚĆ</th>
                            <th>SOCIAL MEDIA</th>
                            <th>AKCJE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${czlonkowie.map(item => `
                            <tr>
                                <td><img src="${item.zdjecie || '/assets/image/placeholder-member.jpg'}" class="table-image" alt=""></td>
                                <td>${item.pseudonim}</td>
                                <td>${item.rola || '-'}</td>
                                <td>${item.kolejnosc || 0}</td>
                                <td>
                                    ${item.instagram ? '📷' : ''}
                                    ${item.spotify ? '🎵' : ''}
                                    ${!item.instagram && !item.spotify ? '-' : ''}
                                </td>
                                <td class="table-actions">
                                    <button class="btn btn-sm" onclick="CzlonkowieCRUD.showForm('${item._id}')">EDYTUJ</button>
                                    <button class="btn btn-sm btn-danger" onclick="CzlonkowieCRUD.delete('${item._id}')">USUŃ</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            content.innerHTML = '<p style="color: var(--color-danger);">Błąd ładowania danych</p>';
        }
    },
    
    async showForm(id = null) {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = id ? 'EDYTUJ CZŁONKA' : 'DODAJ CZŁONKA';
        
        let data = {
            pseudonim: '',
            rola: '',
            zdjecie: '',
            opis: '',
            instagram: '',
            spotify: '',
            kolejnosc: 0
        };
        
        if (id) {
            try {
                const response = await AdminAPI.get(`/czlonkowie/${id}`);
                data = response.data;
            } catch (error) {
                Admin.showToast('Błąd ładowania danych', 'error');
                return;
            }
        }
        
        modalBody.innerHTML = `
            <form id="czlonekForm">
                <div class="form-group">
                    <label>PSEUDONIM *</label>
                    <input type="text" name="pseudonim" value="${data.pseudonim}" required>
                </div>
                <div class="form-group">
                    <label>ROLA</label>
                    <input type="text" name="rola" value="${data.rola || ''}" placeholder="np. Producent, Raper, DJ, Wokalista...">
                </div>
                <div class="form-group">
                    <label>ZDJĘCIE</label>
                    <div class="upload-group">
                        <input type="text" name="zdjecie" id="zdjecieUrl" value="${data.zdjecie || ''}" placeholder="URL zdjęcia lub wgraj plik">
                        <div class="upload-row">
                            <input type="file" id="zdjecieFile" accept="image/*" class="file-input">
                            <button type="button" class="btn btn-sm" onclick="CzlonkowieCRUD.uploadFile()">WGRAJ ZDJĘCIE</button>
                        </div>
                        <div id="zdjeciePreview">
                            ${data.zdjecie ? `<img src="${data.zdjecie}" class="preview-image" alt="Podgląd">` : ''}
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>OPIS / BIO</label>
                    <textarea name="opis" rows="4">${data.opis || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>INSTAGRAM (pełny URL)</label>
                    <input type="text" name="instagram" value="${data.instagram || ''}" placeholder="https://instagram.com/username">
                </div>
                <div class="form-group">
                    <label>SPOTIFY (pełny URL)</label>
                    <input type="text" name="spotify" value="${data.spotify || ''}" placeholder="https://open.spotify.com/artist/...">
                </div>
                <div class="form-group">
                    <label>KOLEJNOŚĆ (niższy = wyżej)</label>
                    <input type="number" name="kolejnosc" value="${data.kolejnosc || 0}">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="Admin.closeModal()">ANULUJ</button>
                    <button type="submit" class="btn btn-primary">ZAPISZ</button>
                </div>
            </form>
        `;
        
        document.getElementById('czlonekForm').addEventListener('submit', (e) => this.save(e, id));
        modal.classList.add('active');
    },
    
    async save(e, id) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const data = {
            pseudonim: formData.get('pseudonim'),
            rola: formData.get('rola'),
            zdjecie: formData.get('zdjecie'),
            opis: formData.get('opis'),
            instagram: formData.get('instagram'),
            spotify: formData.get('spotify'),
            kolejnosc: parseInt(formData.get('kolejnosc')) || 0
        };
        
        try {
            if (id) {
                await AdminAPI.put(`/czlonkowie/${id}`, data);
                Admin.showToast('Członek zaktualizowany', 'success');
            } else {
                await AdminAPI.post('/czlonkowie', data);
                Admin.showToast('Członek dodany', 'success');
            }
            
            Admin.closeModal();
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    },
    
    async delete(id) {
        if (!confirm('Czy na pewno chcesz usunąć tego członka?')) return;
        
        try {
            await AdminAPI.delete(`/czlonkowie/${id}`);
            Admin.showToast('Członek usunięty', 'success');
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    },
    
    async uploadFile() {
        const fileInput = document.getElementById('zdjecieFile');
        const urlInput = document.getElementById('zdjecieUrl');
        const preview = document.getElementById('zdjeciePreview');
        
        if (!fileInput.files[0]) {
            Admin.showToast('Wybierz plik', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        try {
            Admin.showToast('Wgrywanie...', 'info');
            const response = await AdminAPI.upload('/upload/czlonkowie', formData);
            
            if (response.success) {
                urlInput.value = response.data.url;
                preview.innerHTML = `<img src="${response.data.url}" class="preview-image" alt="Podgląd">`;
                Admin.showToast('Zdjęcie wgrane!', 'success');
            }
        } catch (error) {
            Admin.showToast('Błąd wgrywania: ' + error.message, 'error');
        }
    }
};
