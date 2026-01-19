/**
 * Admin API - MP RECORDS
 */

const AdminAPI = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
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
            
            if (response.status === 401) {
                localStorage.removeItem('mprecords_token');
                window.location.reload();
                return;
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Wystąpił błąd');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
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
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Błąd uploadu');
        }
        
        return data;
    }
};
