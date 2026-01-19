/**
 * Produkty CRUD - MP RECORDS Admin
 */

const ProduktyCRUD = {
    uploadedImages: [],
    
    async render() {
        const content = document.getElementById('adminContent');
        const actions = document.getElementById('pageActions');
        
        actions.innerHTML = `<button class="btn btn-primary" id="addProduktBtn">+ DODAJ PRODUKT</button>`;
        content.innerHTML = '<div class="loading"></div>';
        
        document.getElementById('addProduktBtn').addEventListener('click', () => this.showForm());
        
        try {
            const response = await AdminAPI.get('/produkty/admin');
            const produkty = response.data || [];
            
            if (produkty.length === 0) {
                content.innerHTML = '<p style="color: var(--color-text-secondary);">Brak produktów. Dodaj pierwszy produkt!</p>';
                return;
            }
            
            content.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ZDJĘCIE</th>
                            <th>NAZWA</th>
                            <th>KATEGORIA</th>
                            <th>CENA</th>
                            <th>STAN</th>
                            <th>STATUS</th>
                            <th>AKCJE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${produkty.map(item => `
                            <tr>
                                <td><img src="${item.zdjecia?.[0] || '/assets/image/placeholder.png'}" class="table-image" alt=""></td>
                                <td>${item.nazwa}</td>
                                <td>${item.kategoria || '-'}</td>
                                <td>${item.cena?.toFixed(2) || '0.00'} PLN</td>
                                <td>${item.stanMagazynowy || 0}</td>
                                <td>${item.status || 'dostępny'}</td>
                                <td class="table-actions">
                                    <button class="btn btn-sm" onclick="ProduktyCRUD.showForm('${item._id}')">EDYTUJ</button>
                                    <button class="btn btn-sm btn-danger" onclick="ProduktyCRUD.delete('${item._id}')">USUŃ</button>
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
    
    rozmiarySizes: [],
    
    async showForm(id = null) {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = id ? 'EDYTUJ PRODUKT' : 'DODAJ PRODUKT';
        this.uploadedImages = [];
        this.rozmiarySizes = [];
        
        let data = {
            nazwa: '',
            cena: '',
            kategoria: 'inne',
            rozmiary: [],
            zdjecia: [],
            opis: '',
            status: 'aktywny'
        };
        
        if (id) {
            try {
                const response = await AdminAPI.get(`/produkty/${id}`);
                data = {
                    ...response.data,
                    zdjecia: response.data.zdjecia || []
                };
                this.uploadedImages = [...data.zdjecia];
                this.rozmiarySizes = data.rozmiary || [];
            } catch (error) {
                Admin.showToast('Błąd ładowania danych', 'error');
                return;
            }
        }
        
        modalBody.innerHTML = `
            <form id="produktForm">
                <div class="form-group">
                    <label>NAZWA *</label>
                    <input type="text" name="nazwa" value="${data.nazwa}" required>
                </div>
                <div class="form-group">
                    <label>CENA (PLN) *</label>
                    <input type="number" step="0.01" name="cena" value="${data.cena}" required>
                </div>
                <div class="form-group">
                    <label>KATEGORIA</label>
                    <select name="kategoria">
                        <option value="odziez" ${data.kategoria === 'odziez' ? 'selected' : ''}>Odzież</option>
                        <option value="akcesoria" ${data.kategoria === 'akcesoria' ? 'selected' : ''}>Akcesoria</option>
                        <option value="muzyka" ${data.kategoria === 'muzyka' ? 'selected' : ''}>Muzyka</option>
                        <option value="inne" ${data.kategoria === 'inne' ? 'selected' : ''}>Inne</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>ROZMIARY I STAN MAGAZYNOWY</label>
                    <div id="rozmiarySizesContainer" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
                        ${this.renderRozmiarySizes()}
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <select id="newSizeName" style="width: 100px;">
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M" selected>M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                            <option value="ONE SIZE">ONE SIZE</option>
                        </select>
                        <input type="number" id="newSizeStock" placeholder="Ilość" min="0" value="0" style="width: 80px;">
                        <button type="button" class="btn btn-primary" onclick="ProduktyCRUD.addSize()">+ DODAJ</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>ZDJĘCIA PRODUKTU</label>
                    <div id="imagesPreview" class="images-preview" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                        ${this.renderImagePreviews()}
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <label class="btn" style="cursor: pointer;">
                            📁 WGRAJ PLIKI
                            <input type="file" id="imageUpload" multiple accept="image/*" style="display: none;">
                        </label>
                        <button type="button" class="btn" onclick="ProduktyCRUD.showUrlInput()">🔗 DODAJ URL</button>
                    </div>
                    <div id="urlInputContainer" style="display: none; margin-top: 10px;">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="imageUrlInput" placeholder="https://example.com/image.jpg" style="flex: 1;">
                            <button type="button" class="btn btn-primary" onclick="ProduktyCRUD.addImageUrl()">DODAJ</button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>OPIS</label>
                    <textarea name="opis">${data.opis || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>STATUS</label>
                    <select name="status">
                        <option value="aktywny" ${data.status === 'aktywny' ? 'selected' : ''}>Aktywny</option>
                        <option value="ukryty" ${data.status === 'ukryty' ? 'selected' : ''}>Ukryty</option>
                        <option value="wyprzedany" ${data.status === 'wyprzedany' ? 'selected' : ''}>Wyprzedany</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="Admin.closeModal()">ANULUJ</button>
                    <button type="submit" class="btn btn-primary">ZAPISZ</button>
                </div>
            </form>
        `;
        
        // Setup file upload listener
        document.getElementById('imageUpload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('produktForm').addEventListener('submit', (e) => this.save(e, id));
        modal.classList.add('active');
    },
    
    // Rozmiary z stanem magazynowym
    renderRozmiarySizes() {
        if (this.rozmiarySizes.length === 0) {
            return '<p style="color: var(--color-text-secondary); margin: 0;">Brak rozmiarów</p>';
        }
        return this.rozmiarySizes.map((r, i) => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(139, 92, 246, 0.1); border-radius: 6px;">
                <strong style="min-width: 70px;">${r.nazwa}</strong>
                <span style="color: var(--color-text-secondary);">Stan:</span>
                <input type="number" value="${r.stan}" min="0" style="width: 70px;" 
                    onchange="ProduktyCRUD.updateSizeStock(${i}, this.value)">
                <span style="color: var(--color-text-secondary);">szt.</span>
                <button type="button" onclick="ProduktyCRUD.removeSize(${i})" 
                    style="margin-left: auto; background: var(--color-danger); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">×</button>
            </div>
        `).join('');
    },
    
    updateRozmiarySizes() {
        const container = document.getElementById('rozmiarySizesContainer');
        if (container) {
            container.innerHTML = this.renderRozmiarySizes();
        }
    },
    
    addSize() {
        const nazwa = document.getElementById('newSizeName').value;
        const stan = parseInt(document.getElementById('newSizeStock').value) || 0;
        
        // Sprawdź czy rozmiar już istnieje
        if (this.rozmiarySizes.some(r => r.nazwa === nazwa)) {
            Admin.showToast('Ten rozmiar już istnieje', 'error');
            return;
        }
        
        this.rozmiarySizes.push({ nazwa, stan });
        this.updateRozmiarySizes();
        document.getElementById('newSizeStock').value = '0';
    },
    
    updateSizeStock(index, value) {
        this.rozmiarySizes[index].stan = parseInt(value) || 0;
    },
    
    removeSize(index) {
        this.rozmiarySizes.splice(index, 1);
        this.updateRozmiarySizes();
    },
    
    renderImagePreviews() {
        if (this.uploadedImages.length === 0) {
            return '<p style="color: var(--color-text-secondary); margin: 0;">Brak zdjęć</p>';
        }
        return this.uploadedImages.map((url, i) => `
            <div style="position: relative; width: 80px; height: 80px;">
                <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 2px solid var(--color-border);">
                <button type="button" onclick="ProduktyCRUD.removeImage(${i})" 
                    style="position: absolute; top: -8px; right: -8px; background: var(--color-danger); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; line-height: 1;">×</button>
            </div>
        `).join('');
    },
    
    updateImagePreviews() {
        const container = document.getElementById('imagesPreview');
        if (container) {
            container.innerHTML = this.renderImagePreviews();
        }
    },
    
    removeImage(index) {
        this.uploadedImages.splice(index, 1);
        this.updateImagePreviews();
    },
    
    showUrlInput() {
        const container = document.getElementById('urlInputContainer');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    },
    
    addImageUrl() {
        const input = document.getElementById('imageUrlInput');
        const url = input.value.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            this.uploadedImages.push(url);
            this.updateImagePreviews();
            input.value = '';
        } else {
            Admin.showToast('Wprowadź poprawny URL zdjęcia', 'error');
        }
    },
    
    async handleFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        const token = localStorage.getItem('mprecords_token');
        if (!token) {
            Admin.showToast('Brak autoryzacji — zaloguj się ponownie', 'error');
            e.target.value = '';
            return;
        }
        
        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch('/api/upload/produkty', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success && result.data?.url) {
                    this.uploadedImages.push(result.data.url);
                    this.updateImagePreviews();
                } else {
                    Admin.showToast(`Błąd uploadu: ${result.message}`, 'error');
                }
            } catch (error) {
                Admin.showToast(`Błąd uploadu: ${error.message}`, 'error');
            }
        }
        
        e.target.value = '';
    },
    
    async save(e, id) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const data = {
            nazwa: formData.get('nazwa'),
            cena: parseFloat(formData.get('cena')),
            kategoria: formData.get('kategoria'),
            rozmiary: this.rozmiarySizes,
            zdjecia: this.uploadedImages,
            opis: formData.get('opis'),
            status: formData.get('status')
        };
        
        try {
            if (id) {
                await AdminAPI.put(`/produkty/${id}`, data);
                Admin.showToast('Produkt zaktualizowany', 'success');
            } else {
                await AdminAPI.post('/produkty', data);
                Admin.showToast('Produkt dodany', 'success');
            }
            
            Admin.closeModal();
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    },
    
    async delete(id) {
        if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
        
        try {
            await AdminAPI.delete(`/produkty/${id}`);
            Admin.showToast('Produkt usunięty', 'success');
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    }
};
