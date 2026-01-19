/**
 * Zamówienia CRUD - MP RECORDS Admin
 */

const ZamowieniaCRUD = {
    async render() {
        const content = document.getElementById('adminContent');
        const actions = document.getElementById('pageActions');
        
        actions.innerHTML = `
            <select id="statusFilter" class="btn">
                <option value="">Wszystkie statusy</option>
                <option value="nowe">Nowe</option>
                <option value="potwierdzone">Potwierdzone</option>
                <option value="w_realizacji">W realizacji</option>
                <option value="wyslane">Wysłane</option>
                <option value="dostarczone">Dostarczone</option>
                <option value="anulowane">Anulowane</option>
            </select>
        `;
        content.innerHTML = '<div class="loading"></div>';
        
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.loadOrders(e.target.value);
        });
        
        await this.loadOrders();
    },
    
    async loadOrders(status = '') {
        const content = document.getElementById('adminContent');
        
        try {
            const endpoint = status ? `/zamowienia/admin?status=${status}` : '/zamowienia/admin';
            const response = await AdminAPI.get(endpoint);
            const zamowienia = response.data || [];
            
            if (zamowienia.length === 0) {
                content.innerHTML = '<p style="color: var(--color-text-secondary);">Brak zamówień.</p>';
                return;
            }
            
            content.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>NUMER</th>
                            <th>DATA</th>
                            <th>KLIENT</th>
                            <th>PRODUKTY</th>
                            <th>KWOTA</th>
                            <th>STATUS</th>
                            <th>PŁATNOŚĆ</th>
                            <th>AKCJE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${zamowienia.map(z => `
                            <tr>
                                <td><strong>${z.numerZamowienia}</strong></td>
                                <td>${new Date(z.createdAt).toLocaleDateString('pl-PL')}</td>
                                <td>
                                    ${z.daneDostawy?.imie} ${z.daneDostawy?.nazwisko}<br>
                                    <small style="color: var(--color-text-secondary)">${z.daneDostawy?.email}</small>
                                </td>
                                <td>${z.produkty?.length || 0} szt.</td>
                                <td><strong>${z.podsumowanie?.razem?.toFixed(2) || '0.00'} PLN</strong></td>
                                <td>${this.getStatusBadge(z.statusZamowienia)}</td>
                                <td>${this.getPaymentBadge(z.statusPlatnosci)}</td>
                                <td class="table-actions">
                                    <button class="btn btn-sm" onclick="ZamowieniaCRUD.showDetails('${z._id}')">SZCZEGÓŁY</button>
                                    <button class="btn btn-sm btn-danger" onclick="ZamowieniaCRUD.delete('${z._id}')">USUŃ</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            content.innerHTML = '<p style="color: var(--color-danger);">Błąd ładowania zamówień</p>';
        }
    },
    
    getStatusBadge(status) {
        const statuses = {
            'nowe': { label: 'Nowe', color: '#3b82f6' },
            'potwierdzone': { label: 'Potwierdzone', color: '#8b5cf6' },
            'w_realizacji': { label: 'W realizacji', color: '#f59e0b' },
            'wyslane': { label: 'Wysłane', color: '#06b6d4' },
            'dostarczone': { label: 'Dostarczone', color: '#22c55e' },
            'anulowane': { label: 'Anulowane', color: '#ef4444' }
        };
        const s = statuses[status] || { label: status, color: '#6b7280' };
        return `<span style="background: ${s.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${s.label}</span>`;
    },
    
    getPaymentBadge(status) {
        const statuses = {
            'oczekuje': { label: 'Oczekuje', color: '#f59e0b' },
            'oplacone': { label: 'Opłacone', color: '#22c55e' },
            'anulowane': { label: 'Anulowane', color: '#ef4444' },
            'zwrot': { label: 'Zwrot', color: '#6b7280' }
        };
        const s = statuses[status] || { label: status, color: '#6b7280' };
        return `<span style="background: ${s.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${s.label}</span>`;
    },
    
    async showDetails(id) {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = 'SZCZEGÓŁY ZAMÓWIENIA';
        modalBody.innerHTML = '<div class="loading"></div>';
        modal.classList.add('active');
        
        try {
            const response = await AdminAPI.get(`/zamowienia/${id}`);
            const z = response.data;
            
            modalBody.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <h3 style="color: var(--color-primary); margin: 0;">${z.numerZamowienia}</h3>
                        <span style="color: var(--color-text-secondary);">${new Date(z.createdAt).toLocaleString('pl-PL')}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <h4 style="color: var(--color-text-secondary); margin-bottom: 10px;">DANE DOSTAWY</h4>
                            <p style="margin: 0; line-height: 1.6;">
                                <strong>${z.daneDostawy?.imie} ${z.daneDostawy?.nazwisko}</strong><br>
                                ${z.daneDostawy?.ulica}<br>
                                ${z.daneDostawy?.kodPocztowy} ${z.daneDostawy?.miasto}<br>
                                ${z.daneDostawy?.kraj}<br><br>
                                📧 ${z.daneDostawy?.email}<br>
                                📱 ${z.daneDostawy?.telefon}
                            </p>
                        </div>
                        <div>
                            <h4 style="color: var(--color-text-secondary); margin-bottom: 10px;">PODSUMOWANIE</h4>
                            <p style="margin: 0; line-height: 1.8;">
                                Produkty: ${z.podsumowanie?.produkty?.toFixed(2)} PLN<br>
                                Wysyłka: ${z.podsumowanie?.wysylka?.toFixed(2)} PLN<br>
                                <strong style="font-size: 1.2rem;">Razem: ${z.podsumowanie?.razem?.toFixed(2)} PLN</strong>
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="color: var(--color-text-secondary); margin-bottom: 10px;">PRODUKTY</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${z.produkty?.map(p => `
                                <div style="display: flex; gap: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; align-items: center;">
                                    <img src="${p.zdjecie || '/assets/image/placeholder.png'}" 
                                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                                    <div style="flex: 1;">
                                        <strong>${p.nazwa}</strong><br>
                                        <small style="color: var(--color-text-secondary);">
                                            ${p.rozmiar ? `Rozmiar: ${p.rozmiar} · ` : ''}Ilość: ${p.ilosc}
                                        </small>
                                    </div>
                                    <span>${(p.cena * p.ilosc).toFixed(2)} PLN</span>
                                </div>
                            `).join('') || '<p>Brak produktów</p>'}
                        </div>
                    </div>
                    
                    <form id="orderStatusForm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label>STATUS ZAMÓWIENIA</label>
                            <select name="statusZamowienia">
                                <option value="nowe" ${z.statusZamowienia === 'nowe' ? 'selected' : ''}>Nowe</option>
                                <option value="potwierdzone" ${z.statusZamowienia === 'potwierdzone' ? 'selected' : ''}>Potwierdzone</option>
                                <option value="w_realizacji" ${z.statusZamowienia === 'w_realizacji' ? 'selected' : ''}>W realizacji</option>
                                <option value="wyslane" ${z.statusZamowienia === 'wyslane' ? 'selected' : ''}>Wysłane</option>
                                <option value="dostarczone" ${z.statusZamowienia === 'dostarczone' ? 'selected' : ''}>Dostarczone</option>
                                <option value="anulowane" ${z.statusZamowienia === 'anulowane' ? 'selected' : ''}>Anulowane</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>STATUS PŁATNOŚCI</label>
                            <select name="statusPlatnosci">
                                <option value="oczekuje" ${z.statusPlatnosci === 'oczekuje' ? 'selected' : ''}>Oczekuje</option>
                                <option value="oplacone" ${z.statusPlatnosci === 'oplacone' ? 'selected' : ''}>Opłacone</option>
                                <option value="anulowane" ${z.statusPlatnosci === 'anulowane' ? 'selected' : ''}>Anulowane</option>
                                <option value="zwrot" ${z.statusPlatnosci === 'zwrot' ? 'selected' : ''}>Zwrot</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>NUMER ŚLEDZENIA</label>
                            <input type="text" name="numerSledzenia" value="${z.numerSledzenia || ''}" placeholder="np. 123456789">
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>NOTATKI</label>
                            <textarea name="notatki" rows="2">${z.notatki || ''}</textarea>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn" onclick="Admin.closeModal()">ZAMKNIJ</button>
                        <button type="button" class="btn btn-primary" onclick="ZamowieniaCRUD.updateStatus('${z._id}')">ZAPISZ ZMIANY</button>
                    </div>
                </div>
            `;
            
        } catch (error) {
            modalBody.innerHTML = '<p style="color: var(--color-danger);">Błąd ładowania szczegółów</p>';
        }
    },
    
    async updateStatus(id) {
        const form = document.getElementById('orderStatusForm');
        const formData = new FormData(form);
        
        const data = {
            statusZamowienia: formData.get('statusZamowienia'),
            statusPlatnosci: formData.get('statusPlatnosci'),
            numerSledzenia: formData.get('numerSledzenia'),
            notatki: formData.get('notatki')
        };
        
        try {
            await AdminAPI.put(`/zamowienia/${id}`, data);
            Admin.showToast('Status zaktualizowany', 'success');
            Admin.closeModal();
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    },
    
    async delete(id) {
        if (!confirm('Czy na pewno chcesz usunąć to zamówienie?')) return;
        
        try {
            await AdminAPI.delete(`/zamowienia/${id}`);
            Admin.showToast('Zamówienie usunięte', 'success');
            this.render();
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    }
};
