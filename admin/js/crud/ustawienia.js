/**
 * Ustawienia CRUD - MP RECORDS Admin
 */

const UstawieniaCRUD = {
    async render() {
        const content = document.getElementById('adminContent');
        const actions = document.getElementById('pageActions');
        
        actions.innerHTML = '';
        content.innerHTML = '<div class="loading"></div>';
        
        try {
            const response = await AdminAPI.get('/ustawienia');
            const data = response || {};
            
            content.innerHTML = `
                <form id="ustawieniaForm" class="settings-form">
                    <div class="settings-section">
                        <h3 class="settings-title">MARQUEE BANNER (SCROLLUJĄCY PASEK)</h3>
                        
                        <div class="form-group">
                            <label class="toggle-label">
                                <input type="checkbox" name="marqueeEnabled" ${data.marqueeEnabled ? 'checked' : ''}>
                                <span class="toggle-text">WŁĄCZ MARQUEE</span>
                            </label>
                            <p class="form-hint">Scrollujący pasek u góry strony</p>
                        </div>
                        
                        <div class="form-group">
                            <label>TEKST MARQUEE</label>
                            <input type="text" name="marqueeText" value="${data.marqueeText || 'MP RECORDS • NOWA MUZYKA • SPRAWDŹ WYDANIA •'}" placeholder="Tekst do wyświetlenia...">
                            <p class="form-hint">Tekst będzie się powtarzał i scrollował</p>
                        </div>
                        
                        <div class="form-group">
                            <label>WYŚWIETLAJ NA STRONACH</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="marqueePage_home" ${(data.marqueePages || ['/']).includes('/') ? 'checked' : ''}>
                                    <span>Strona główna</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="marqueePage_wydania" ${(data.marqueePages || []).includes('/wydania') ? 'checked' : ''}>
                                    <span>Wydania</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="marqueePage_sklep" ${(data.marqueePages || []).includes('/sklep') ? 'checked' : ''}>
                                    <span>Sklep</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="marqueePage_kontakt" ${(data.marqueePages || []).includes('/kontakt') ? 'checked' : ''}>
                                    <span>Kontakt</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="marqueePage_czlonkowie" ${(data.marqueePages || []).includes('/czlonkowie') ? 'checked' : ''}>
                                    <span>Członkowie</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="settings-title">ANIMOWANY NAGŁÓWEK - STRONA GŁÓWNA</h3>
                        
                        <div class="form-group">
                            <label class="toggle-label">
                                <input type="checkbox" name="headlineEnabled" ${data.headlineEnabled ? 'checked' : ''}>
                                <span class="toggle-text">WŁĄCZ ROTATING HEADLINE</span>
                            </label>
                            <p class="form-hint">Główny napis będzie się zmieniał co kilka sekund</p>
                        </div>
                        
                        <div class="form-group">
                            <label>FRAZY (KAŻDA W NOWEJ LINII)</label>
                            <textarea name="headlinePhrases" rows="6" placeholder="MP RECORDS&#10;NOWA ERA&#10;SŁUCHAJ TERAZ">${(data.headlinePhrases || ['MP RECORDS', 'NOWA ERA', 'SŁUCHAJ TERAZ']).join('\n')}</textarea>
                            <p class="form-hint">Każda linia to osobna fraza do wyświetlenia</p>
                        </div>
                        
                        <div class="form-group">
                            <label>INTERWAŁ (MS)</label>
                            <input type="number" name="headlineInterval" value="${data.headlineInterval || 3000}" min="1000" step="500">
                            <p class="form-hint">Czas między zmianami (w milisekundach, np. 3000 = 3 sekundy)</p>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="settings-title">ANIMOWANE NAGŁÓWKI - PODSTRONY</h3>
                        <p class="form-hint" style="margin-bottom: 15px;">Włącz animowany nagłówek dla poszczególnych podstron</p>
                        
                        ${['wydania', 'sklep', 'kontakt', 'czlonkowie'].map(page => {
                            const pageData = data.pageHeadlines?.[page] || { enabled: false, phrases: [], interval: 3000 };
                            const pageName = page.charAt(0).toUpperCase() + page.slice(1);
                            return `
                            <div class="page-headline-config" style="background: rgba(124,58,237,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(124,58,237,0.2);">
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label class="toggle-label">
                                        <input type="checkbox" name="pageHeadline_${page}_enabled" ${pageData.enabled ? 'checked' : ''}>
                                        <span class="toggle-text">${pageName.toUpperCase()}</span>
                                    </label>
                                </div>
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label style="font-size: 0.7rem;">FRAZY DLA /${page.toUpperCase()}</label>
                                    <textarea name="pageHeadline_${page}_phrases" rows="3" placeholder="${pageName}&#10;NASZA MUZYKA&#10;SPRAWDŹ">${(pageData.phrases || []).join('\n')}</textarea>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label style="font-size: 0.7rem;">INTERWAŁ (MS)</label>
                                    <input type="number" name="pageHeadline_${page}_interval" value="${pageData.interval || 3000}" min="1000" step="500">
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="settings-title">EFEKTY WIZUALNE</h3>
                        
                        <div class="form-group">
                            <label class="toggle-label">
                                <input type="checkbox" name="particlesEnabled" ${data.particlesEnabled !== false ? 'checked' : ''}>
                                <span class="toggle-text">ANIMOWANE CZĄSTECZKI</span>
                            </label>
                            <p class="form-hint">Fioletowe cząsteczki unoszące się w tle strony</p>
                        </div>
                        
                        <div class="form-group">
                            <label class="toggle-label">
                                <input type="checkbox" name="customCursorEnabled" ${data.customCursorEnabled !== false ? 'checked' : ''}>
                                <span class="toggle-text">NIESTANDARDOWY KURSOR</span>
                            </label>
                            <p class="form-hint">Fioletowy neonowy kursor zamiast standardowego</p>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="settings-title">MINI PLAYER</h3>
                        
                        <div class="form-group">
                            <label class="toggle-label">
                                <input type="checkbox" name="miniPlayerEnabled" ${data.miniPlayerEnabled !== false ? 'checked' : ''}>
                                <span class="toggle-text">WŁĄCZ MINI PLAYER</span>
                            </label>
                            <p class="form-hint">Odtwarzacz muzyki w stopce strony</p>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="settings-title">SOCIAL MEDIA</h3>
                        
                        <div class="form-group">
                            <label>INSTAGRAM</label>
                            <input type="text" name="instagram" value="${data.socialMedia?.instagram || ''}" placeholder="https://instagram.com/...">
                        </div>
                        
                        <div class="form-group">
                            <label>YOUTUBE</label>
                            <input type="text" name="youtube" value="${data.socialMedia?.youtube || ''}" placeholder="https://youtube.com/...">
                        </div>
                        
                        <div class="form-group">
                            <label>SPOTIFY</label>
                            <input type="text" name="spotify" value="${data.socialMedia?.spotify || ''}" placeholder="https://open.spotify.com/...">
                        </div>
                        
                        <div class="form-group">
                            <label>TIKTOK</label>
                            <input type="text" name="tiktok" value="${data.socialMedia?.tiktok || ''}" placeholder="https://tiktok.com/...">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">ZAPISZ USTAWIENIA</button>
                    </div>
                </form>
            `;
            
            document.getElementById('ustawieniaForm').addEventListener('submit', (e) => this.save(e));
            
        } catch (error) {
            content.innerHTML = '<p style="color: var(--color-danger);">Błąd ładowania ustawień</p>';
        }
    },
    
    async save(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Parse headline phrases from textarea
        const phrasesText = formData.get('headlinePhrases') || '';
        const headlinePhrases = phrasesText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        
        // Parse marquee pages
        const marqueePages = [];
        if (formData.get('marqueePage_home') === 'on') marqueePages.push('/');
        if (formData.get('marqueePage_wydania') === 'on') marqueePages.push('/wydania');
        if (formData.get('marqueePage_sklep') === 'on') marqueePages.push('/sklep');
        if (formData.get('marqueePage_kontakt') === 'on') marqueePages.push('/kontakt');
        if (formData.get('marqueePage_czlonkowie') === 'on') marqueePages.push('/czlonkowie');
        
        // Parse page headlines
        const pageHeadlines = {};
        ['wydania', 'sklep', 'kontakt', 'czlonkowie'].forEach(page => {
            const enabled = formData.get(`pageHeadline_${page}_enabled`) === 'on';
            const phrasesRaw = formData.get(`pageHeadline_${page}_phrases`) || '';
            const phrases = phrasesRaw.split('\n').map(p => p.trim()).filter(p => p.length > 0);
            const interval = parseInt(formData.get(`pageHeadline_${page}_interval`)) || 3000;
            pageHeadlines[page] = { enabled, phrases, interval };
        });
        
        const data = {
            marqueeEnabled: formData.get('marqueeEnabled') === 'on',
            marqueeText: formData.get('marqueeText'),
            marqueePages: marqueePages,
            headlineEnabled: formData.get('headlineEnabled') === 'on',
            headlinePhrases: headlinePhrases,
            headlineInterval: parseInt(formData.get('headlineInterval')) || 3000,
            pageHeadlines: pageHeadlines,
            particlesEnabled: formData.get('particlesEnabled') === 'on',
            customCursorEnabled: formData.get('customCursorEnabled') === 'on',
            miniPlayerEnabled: formData.get('miniPlayerEnabled') === 'on',
            socialMedia: {
                instagram: formData.get('instagram'),
                youtube: formData.get('youtube'),
                spotify: formData.get('spotify'),
                tiktok: formData.get('tiktok')
            }
        };
        
        try {
            await AdminAPI.put('/ustawienia', data);
            Admin.showToast('Ustawienia zapisane', 'success');
        } catch (error) {
            Admin.showToast(error.message, 'error');
        }
    }
};
