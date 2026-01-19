/**
 * Auth Module - MP RECORDS Admin
 */

const Auth = {
    init() {
        this.loginForm = document.getElementById('loginForm');
        this.loginError = document.getElementById('loginError');
        this.loginScreen = document.getElementById('loginScreen');
        this.dashboard = document.getElementById('adminDashboard');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        this.setupEventListeners();
        this.checkAuth();
    },
    
    setupEventListeners() {
        this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutBtn?.addEventListener('click', () => this.logout());
    },
    
    async checkAuth() {
        const token = localStorage.getItem('mprecords_token');
        
        if (!token) {
            this.showLogin();
            return;
        }
        
        try {
            await AdminAPI.get('/auth/verify');
            this.showDashboard();
        } catch (error) {
            localStorage.removeItem('mprecords_token');
            this.showLogin();
        }
    },
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            this.loginError.textContent = '';
            
            const response = await AdminAPI.post('/auth/login', { username, password });
            
            if (response.token) {
                localStorage.setItem('mprecords_token', response.token);
                this.showDashboard();
            }
        } catch (error) {
            this.loginError.textContent = error.message || 'Błąd logowania';
        }
    },
    
    logout() {
        localStorage.removeItem('mprecords_token');
        this.showLogin();
    },
    
    showLogin() {
        this.loginScreen.style.display = 'flex';
        this.dashboard.style.display = 'none';
    },
    
    showDashboard() {
        this.loginScreen.style.display = 'none';
        this.dashboard.style.display = 'flex';
        
        // Initialize admin after showing dashboard
        if (typeof Admin !== 'undefined') {
            Admin.init();
        }
    }
};
