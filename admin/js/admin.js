/**
 * Main Admin Module - MP RECORDS
 */

const Admin = {
    currentSection: 'dashboard',
    
    init() {
        this.setupNavigation();
        this.setupModal();
        this.loadSection('dashboard');
    },
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = link.dataset.section;
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Load section
                this.loadSection(section);
            });
        });
    },
    
    setupModal() {
        const modal = document.getElementById('adminModal');
        const closeBtn = document.getElementById('modalCloseBtn');
        
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // Śledź czy użytkownik zaznacza tekst (mousedown wewnątrz modal-content)
        let isSelecting = false;
        const modalContent = modal.querySelector('.modal-content');
        
        if (modalContent) {
            modalContent.addEventListener('mousedown', () => {
                isSelecting = true;
            });
        }
        
        document.addEventListener('mouseup', () => {
            // Resetuj flagę po krótkim czasie, żeby click event zdążył się wykonać
            setTimeout(() => {
                isSelecting = false;
            }, 100);
        });
        
        // Zamykaj tylko przy kliknięciu w tło modala, NIE gdy zaznaczamy tekst
        modal.addEventListener('click', (e) => {
            if (e.target === modal && !isSelecting) {
                this.closeModal();
            }
        });
        
        // Zapobiegaj zamykaniu przy przytrzymaniu (long press / context menu)
        modal.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Zapobiegaj zamykaniu przy touchstart na modal-content
        if (modalContent) {
            modalContent.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            });
            modalContent.addEventListener('touchend', (e) => {
                e.stopPropagation();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },
    
    async loadSection(section) {
        this.currentSection = section;
        const pageTitle = document.getElementById('pageTitle');
        const pageActions = document.getElementById('pageActions');
        
        pageActions.innerHTML = '';
        
        const titles = {
            dashboard: 'DASHBOARD',
            wydania: 'WYDANIA',
            produkty: 'PRODUKTY',
            wiadomosci: 'WIADOMOŚCI',
            czlonkowie: 'CZŁONKOWIE',
            zamowienia: 'ZAMÓWIENIA',
            ustawienia: 'USTAWIENIA',
            backup: 'BACKUP'
        };
        
        pageTitle.textContent = titles[section] || section.toUpperCase();
        
        switch (section) {
            case 'dashboard':
                await Dashboard.render();
                break;
            case 'wydania':
                await WydaniaCRUD.render();
                break;
            case 'produkty':
                await ProduktyCRUD.render();
                break;
            case 'wiadomosci':
                await WiadomosciCRUD.render();
                break;
            case 'czlonkowie':
                await CzlonkowieCRUD.render();
                break;
            case 'zamowienia':
                await ZamowieniaCRUD.render();
                break;
            case 'ustawienia':
                await UstawieniaCRUD.render();
                break;
            case 'backup':
                await BackupCRUD.render();
                break;
        }
    },
    
    closeModal() {
        const modal = document.getElementById('adminModal');
        modal.classList.remove('active');
    },
    
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// Initialize Auth on page load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
