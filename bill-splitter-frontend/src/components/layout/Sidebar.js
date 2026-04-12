import React from 'react';
import { Home, Receipt, TrendingUp, Users, BarChart3, Settings, LogOut, Menu, X, Wallet } from 'lucide-react';

export default function Sidebar({ currentTab, onTabChange, isOpen, onToggle, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'split', label: 'Chia hóa đơn', icon: Receipt, color: 'text-green-600 dark:text-green-400' },
    { id: 'debts', label: 'Sổ nợ thông minh', icon: Wallet, color: 'text-indigo-600 dark:text-indigo-400' },
    { id: 'expenses', label: 'Sổ chi tiêu', icon: TrendingUp, color: 'text-orange-600 dark:text-orange-400' },
    { id: 'groups', label: 'Nhóm/Bạn bè', icon: Users, color: 'text-purple-600 dark:text-purple-400' },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed lg:static left-0 top-0 h-screen lg:h-auto w-64 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 transition-transform duration-300 ease-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        {/* Logo / Brand */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 mt-16 lg:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Receipt size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">BillSplitter</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">v2.0 Pro</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onToggle(); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 border-l-4 border-blue-500 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} className={isActive ? item.color : ''} />
                <span className={`font-medium ${isActive ? 'text-gray-800 dark:text-white' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
          {user && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Đăng nhập dưới tên</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.username}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-medium"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </nav>
    </>
  );
}
