// src/api/billApiService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const billApiService = (token) => {
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    });

    return {
        // --- Authentication ---
        async auth(username, password, isRegister) {
            const endpoint = isRegister ? 'register' : 'login';
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to ${endpoint}`);
            }
            return response.json();
        },

        // --- Gemini/OCR ---
        async extractBill(imageBase64, mimeType) {
            const response = await fetch(`${API_BASE_URL}/gemini/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageBase64, mimeType })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to extract bill');
            }
            return response.json();
        },

        // --- Bills CRUD ---
        async createBill(billData) {
            const response = await fetch(`${API_BASE_URL}/bills`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(billData)
            });
            if (!response.ok) throw new Error('Failed to create bill');
            return response.json();
        },

        async getBills(startDate, endDate, limit = 50, skip = 0) {
            const params = new URLSearchParams({ limit, skip });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            
            const response = await fetch(`${API_BASE_URL}/bills?${params}`, {
                 headers: getAuthHeaders()
            }); 
            if (!response.ok) throw new Error('Failed to fetch bills');
            return response.json();
        },

        async updateBill(billId, billData) {
            const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(billData)
            });
            if (!response.ok) throw new Error('Failed to update bill');
            return response.json();
        },

        async deleteBill(billId) {
            const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete bill');
            return response.json();
        }
    };
};

export default billApiService;