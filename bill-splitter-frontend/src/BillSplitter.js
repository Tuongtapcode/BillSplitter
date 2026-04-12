import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import AuthForm from './components/AuthForm';
import TokenExpiredNotification from './components/TokenExpiredNotification';
import DashboardView from './components/DashboardView';
import SplitBillView from './components/SplitBillView';
import ExpensesManagement from './components/dashboard/ExpensesManagement';
import GroupsView from './components/GroupsView';
import ReportsView from './components/ReportsView';
import SmartDebtView from './components/SmartDebtView';
import { fetchWithTokenCheck } from './api/apiInterceptor';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// === LOCAL STORAGE cho Theme ===
const themeStorage = {
  save: (theme) => localStorage.setItem('theme', theme),
  load: () => localStorage.getItem('theme') || 'system'
};

// === API Service ===
const api = {
  async getBills(token, startDate, endDate, limit = 50, skip = 0) {
    const params = new URLSearchParams({ limit, skip });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch bills');
    return response.json();
  },

  async getBillStats(token, year, month) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);

    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills/stats?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }
};

// === COMPONENT CHÍNH ===
export default function BillSplitter() {
  const { user, logout, getToken, isAuthenticated, login } = useAuth();

  const [currentTab, setCurrentTab] = useState('split');
  const [theme, setTheme] = useState('system');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history & theme on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }

    const savedTheme = themeStorage.load();
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');
    const username = urlParams.get('username');

    if (token && userId && username) {
      window.history.replaceState({}, document.title, window.location.pathname);
      login({ userId, username }, token);
      alert('✅ Đăng nhập thành công với Google!');
    }
  }, [isAuthenticated]);

  // --- THEME LOGIC ---
  const saveThemeSetting = (newTheme) => {
    setTheme(newTheme);
    themeStorage.save(newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (currentTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark');

    if (currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
    applyTheme(theme);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // --- API CALLS ---
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const token = getToken();
      const data = await api.getBills(token);
      setHistory(data.bills || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, [isAuthenticated, user, getToken]);

  const handleLogout = () => {
    logout();
    setCurrentTab('split');
  };

  // Render content dựa trên tab hiện tại
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">📊 Tổng quan</h1>
            <DashboardView bills={history} />
          </div>
        );

      case 'split':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">🧾 Chia hóa đơn</h1>
            <SplitBillView history={history} onHistoryUpdate={loadHistory} />
          </div>
        );

      case 'expenses':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">💰 Sổ chi tiêu</h1>
            <ExpensesManagement bills={history} />
          </div>
        );

      case 'debts':
        return (
          <SmartDebtView userId={user?.userId} token={getToken()} />
        );

      case 'groups':
        return (
          <div>
            <GroupsView />
          </div>
        );

      case 'reports':
        return (
          <div>
            <ReportsView />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout
      user={user}
      onLogin={() => setShowAuthForm(true)}
      onLogout={handleLogout}
      theme={theme}
      onThemeChange={saveThemeSetting}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
    >
      <TokenExpiredNotification />
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <AuthForm onClose={() => setShowAuthForm(false)} />
          </div>
        </div>
      )}

      {renderContent()}
    </AppLayout>
  );
}
