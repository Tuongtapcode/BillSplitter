// api/billService.js - Tách logic API ra file riêng để dễ quản lý
import { fetchWithTokenCheck } from './apiInterceptor';

const API_BASE_URL = process.env.REACT_APP_API_URL;

class BillService {
  // Gemini - Đọc hóa đơn (không cần auth)
  async extractBill(imageBase64, mimeType) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/gemini/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, mimeType })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract bill');
    }
    
    return response.json();
  }

  // Bills CRUD (cần auth)
  async createBill(billData, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(billData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create bill');
    }
    return response.json();
  }

  async getBills(token, options = {}) {
    const { startDate, endDate, limit = 50, skip = 0 } = options;
    const params = new URLSearchParams({ limit, skip });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch bills');
    }
    return response.json();
  }

  async getBillStats(token, year, month) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills/stats?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }
    return response.json();
  }

  async updateBill(billId, billData, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills/${billId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(billData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update bill');
    }
    return response.json();
  }

  async deleteBill(billId, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills/${billId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete bill');
    }
    return response.json();
  }

  // ========== DEBTS ENDPOINTS ==========
  
  // Get list of debts for a user
  async getDebts(userId, token, filters = {}) {
    const { status, type } = filters;
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    
    const url = `${API_BASE_URL}/debts/user/${userId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetchWithTokenCheck(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch debts');
    }
    return response.json();
  }

  // Get debt summary (total owed, received, counts)
  async getDebtSummary(userId, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/debts/summary/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch debt summary');
    }
    return response.json();
  }

  // Update debt status (PENDING → SETTLED, DISPUTED, etc)
  async updateDebtStatus(debtId, status, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/debts/${debtId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update debt status');
    }
    return response.json();
  }

  // Auth endpoints
  async login(email, password) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  }

  async register(username, email, password) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    return response.json();
  }

  // ✅ NEW: Search users by username (for adding friends to bills)
  async searchUsers(query) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Search failed');
    }
    return response.json();
  }
}

export default new BillService();