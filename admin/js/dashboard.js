/**
 * Dashboard Module - MP RECORDS Admin
 */

const Dashboard = {
    async render() {
        const content = document.getElementById('adminContent');
        content.innerHTML = '<div class="loading"></div>';
        
        try {
            const [wydania, produkty, czlonkowie, zamowienia] = await Promise.all([
                AdminAPI.get('/wydania/admin'),
                AdminAPI.get('/produkty/admin'),
                AdminAPI.get('/czlonkowie/admin'),
                AdminAPI.get('/zamowienia/admin').catch(() => ({ data: [] }))
            ]);

            const wydaniaData = wydania?.data || [];
            const produktyData = produkty?.data || [];
            const czlonkowieData = czlonkowie?.data || [];
            const zamowieniaData = zamowienia?.data || [];
            
            // Calculate orders stats
            const noweZamowienia = zamowieniaData.filter(z => z.statusZamowienia === 'nowe').length;
            const sumaSprzedazy = zamowieniaData.reduce((sum, z) => sum + (z.podsumowanie?.razem || 0), 0);
            
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${wydaniaData.length}</div>
                        <div class="stat-label">WYDANIA</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${produktyData.length}</div>
                        <div class="stat-label">PRODUKTY</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${zamowieniaData.length}</div>
                        <div class="stat-label">ZAMÓWIENIA</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${czlonkowieData.length}</div>
                        <div class="stat-label">CZŁONKOWIE</div>
                    </div>
                </div>
                
                <div class="stats-grid" style="margin-top: var(--spacing-md);">
                    <div class="stat-card" style="background: linear-gradient(135deg, var(--color-primary) 0%, #6b21a8 100%);">
                        <div class="stat-value">${noweZamowienia}</div>
                        <div class="stat-label">NOWE ZAMÓWIENIA</div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                        <div class="stat-value">${sumaSprzedazy.toFixed(0)} PLN</div>
                        <div class="stat-label">SPRZEDAŻ</div>
                    </div>
                </div>
                
                <h2 style="font-family: var(--font-minecraft); font-size: 0.625rem; margin: var(--spacing-lg) 0 var(--spacing-md);">OSTATNIE ZAMÓWIENIA</h2>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>NUMER</th>
                            <th>DATA</th>
                            <th>KLIENT</th>
                            <th>KWOTA</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${zamowieniaData.slice(0, 5).map(z => `
                            <tr>
                                <td><strong>${z.numerZamowienia}</strong></td>
                                <td>${new Date(z.createdAt).toLocaleDateString('pl-PL')}</td>
                                <td>${z.daneDostawy?.imie} ${z.daneDostawy?.nazwisko}</td>
                                <td>${z.podsumowanie?.razem?.toFixed(2) || '0.00'} PLN</td>
                                <td>${this.getStatusBadge(z.statusZamowienia)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="5">Brak zamówień</td></tr>'}
                    </tbody>
                </table>
                
                <h2 style="font-family: var(--font-minecraft); font-size: 0.625rem; margin: var(--spacing-lg) 0 var(--spacing-md);">OSTATNIE WYDANIA</h2>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>OKŁADKA</th>
                            <th>NAZWA</th>
                            <th>ARTYŚCI</th>
                            <th>ROK</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${wydaniaData.slice(0, 5).map(item => {
                            const autorzy = Array.isArray(item.autorzy)
                                ? item.autorzy.join(', ')
                                : (item.autorzy || '-');
                            return `
                            <tr>
                                <td><img src="${item.okladka || '/assets/image/placeholder.png'}" class="table-image" alt=""></td>
                                <td>${item.nazwa}</td>
                                <td>${autorzy}</td>
                                <td>${item.rok || '-'}</td>
                            </tr>
                        `;
                        }).join('') || '<tr><td colspan="4">Brak danych</td></tr>'}
                    </tbody>
                </table>
            `;
        } catch (error) {
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">-</div>
                        <div class="stat-label">BŁĄD ŁADOWANIA</div>
                    </div>
                </div>
            `;
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
    }
};
