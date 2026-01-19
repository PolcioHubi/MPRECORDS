/**
 * Wiadomości CRUD - MP RECORDS Admin
 */

const WiadomosciCRUD = {
    async render() {
        const content = document.getElementById('adminContent');
        const actions = document.getElementById('pageActions');
        
        actions.innerHTML = '';
        content.innerHTML = '<div class="loading"></div>';
        
        try {
            const response = await AdminAPI.get('/kontakt');
            const wiadomosci = response.data || [];
            
            if (wiadomosci.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>BRAK WIADOMOŚCI</p>
                        <span>Gdy ktoś napisze przez formularz kontaktowy, wiadomość pojawi się tutaj</span>
                    </div>
                `;
                return;
            }
            
            const nieprzeczytane = wiadomosci.filter(w => !w.przeczytana).length;
            
            content.innerHTML = `
                <div class="messages-header">
                    <div class="messages-stats">
                        <span class="stat-badge ${nieprzeczytane > 0 ? 'unread' : ''}">
                            ${nieprzeczytane > 0 ? `${nieprzeczytane} NOWYCH` : 'WSZYSTKIE PRZECZYTANE'}
                        </span>
                        <span class="stat-total">${wiadomosci.length} wiadomości</span>
                    </div>
                </div>
                <div class="messages-list">
                    ${wiadomosci.map(w => `
                        <div class="message-item ${w.przeczytana ? 'read' : 'unread'}" data-id="${w._id}">
                            <div class="message-header">
                                <div class="message-sender">
                                    <span class="sender-icon">${w.przeczytana ? '📧' : '📬'}</span>
                                    <span class="sender-email">${w.email}</span>
                                </div>
                                <div class="message-date">${this.formatDate(w.dataWyslania)}</div>
                            </div>
                            <div class="message-subject">${w.temat || 'Kontakt'}</div>
                            <div class="message-preview">${this.truncate(w.tresc, 100)}</div>
                            <div class="message-actions">
                                <button class="btn btn-sm btn-secondary view-btn" data-id="${w._id}">
                                    ZOBACZ
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${w._id}">
                                    USUŃ
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            this.setupListeners();
            
        } catch (error) {
            content.innerHTML = '<p style="color: var(--color-danger);">Błąd ładowania wiadomości</p>';
        }
    },
    
    setupListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.viewMessage(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteMessage(btn.dataset.id));
        });
    },
    
    async viewMessage(id) {
        try {
            const response = await AdminAPI.get('/kontakt');
            const wiadomosc = response.data.find(w => w._id === id);
            
            if (!wiadomosc) return;
            
            // Mark as read
            if (!wiadomosc.przeczytana) {
                await AdminAPI.put(`/kontakt/${id}/przeczytana`);
            }
            
            const modal = document.getElementById('adminModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = 'WIADOMOŚĆ';
            
            modalBody.innerHTML = `
                <div class="message-detail">
                    <div class="detail-row">
                        <label>OD:</label>
                        <a href="mailto:${wiadomosc.email}" class="email-link">${wiadomosc.email}</a>
                    </div>
                    <div class="detail-row">
                        <label>TEMAT:</label>
                        <span>${wiadomosc.temat || 'Kontakt'}</span>
                    </div>
                    <div class="detail-row">
                        <label>DATA:</label>
                        <span>${this.formatDate(wiadomosc.dataWyslania, true)}</span>
                    </div>
                    <div class="detail-content">
                        <label>TREŚĆ:</label>
                        <div class="message-body">${wiadomosc.tresc.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="detail-actions">
                        <a href="mailto:${wiadomosc.email}?subject=Re: ${wiadomosc.temat || 'Kontakt'}" class="btn btn-primary">
                            ODPOWIEDZ
                        </a>
                        <button class="btn btn-danger" onclick="WiadomosciCRUD.deleteMessage('${wiadomosc._id}')">
                            USUŃ
                        </button>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
            
            // Refresh list to update read status
            this.render();
            
        } catch (error) {
            Admin.showToast('Błąd ładowania wiadomości', 'error');
        }
    },
    
    async deleteMessage(id) {
        if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) return;
        
        try {
            await AdminAPI.delete(`/kontakt/${id}`);
            Admin.showToast('Wiadomość usunięta', 'success');
            Admin.closeModal();
            this.render();
        } catch (error) {
            Admin.showToast('Błąd usuwania', 'error');
        }
    },
    
    formatDate(dateString, full = false) {
        const date = new Date(dateString);
        
        if (full) {
            return date.toLocaleString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Wczoraj';
        } else if (days < 7) {
            return `${days} dni temu`;
        } else {
            return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        }
    },
    
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
};
