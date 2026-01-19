/**
 * API Utility - MP RECORDS
 * Handles all API requests to the backend
 */

const API = {
    baseURL: '/api',
    
    /**
     * Generic fetch wrapper with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Add auth token if available
        const token = localStorage.getItem('mprecords_token');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Wystąpił błąd');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * GET request
     */
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    /**
     * POST request
     */
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * PUT request
     */
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * DELETE request
     */
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    /**
     * Upload file(s)
     */
    async upload(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        
        const options = {
            method: 'POST',
            body: formData
        };
        
        const token = localStorage.getItem('mprecords_token');
        if (token) {
            options.headers = {
                'Authorization': `Bearer ${token}`
            };
        }
        
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Błąd uploadu');
            }
            
            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
};

// API Endpoints
const WydaniaAPI = {
    getAll: () => API.get('/wydania'),
    getOne: (id) => API.get(`/wydania/${id}`),
    create: (data) => API.post('/wydania', data),
    update: (id, data) => API.put(`/wydania/${id}`, data),
    delete: (id) => API.delete(`/wydania/${id}`)
};

const ProduktyAPI = {
    getAll: () => API.get('/produkty'),
    getById: (id) => API.get(`/produkty/${id}`),
    getOne: (id) => API.get(`/produkty/${id}`),
    create: (data) => API.post('/produkty', data),
    update: (id, data) => API.put(`/produkty/${id}`, data),
    delete: (id) => API.delete(`/produkty/${id}`)
};

const MediaAPI = {
    getAll: () => API.get('/media'),
    getFeatured: () => API.get('/media/featured'),
    getOne: (id) => API.get(`/media/${id}`),
    create: (data) => API.post('/media', data),
    update: (id, data) => API.put(`/media/${id}`, data),
    delete: (id) => API.delete(`/media/${id}`)
};

const CzlonkowieAPI = {
    getAll: () => API.get('/czlonkowie'),
    getOne: (id) => API.get(`/czlonkowie/${id}`),
    create: (data) => API.post('/czlonkowie', data),
    update: (id, data) => API.put(`/czlonkowie/${id}`, data),
    delete: (id) => API.delete(`/czlonkowie/${id}`)
};

const AuthAPI = {
    login: (credentials) => API.post('/auth/login', credentials),
    verify: () => API.get('/auth/verify'),
    setup: (data) => API.post('/auth/setup', data)
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, WydaniaAPI, ProduktyAPI, MediaAPI, CzlonkowieAPI, AuthAPI };
}
