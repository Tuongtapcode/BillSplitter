import React from 'react';
import { Calculator, LogIn, LogOut, User, Sun, Moon, Monitor } from 'lucide-react';

export default function Header({ user, onLogin, onLogout, theme, onThemeChange }) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-blue-600 p-2 rounded-xl">
              <Calculator className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                Bill Splitter AI
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by Gemini
              </p>
            </div>
          </div>

          {/* Right Section: Theme + Auth */}
          <div className="flex items-center gap-4">
            {/* Theme Switcher */}
            <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => onThemeChange('light')}
                className={`p-2 rounded-lg transition ${
                  theme === 'light' 
                    ? 'bg-white shadow text-yellow-500' 
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Giao diện Sáng"
              >
                <Sun size={18} />
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`p-2 rounded-lg transition ${
                  theme === 'dark' 
                    ? 'bg-gray-600 shadow text-blue-400' 
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Giao diện Tối"
              >
                <Moon size={18} />
              </button>
              <button
                onClick={() => onThemeChange('system')}
                className={`p-2 rounded-lg transition ${
                  theme === 'system' 
                    ? 'bg-white dark:bg-gray-600 shadow text-purple-500' 
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Theo thiết bị"
              >
                <Monitor size={18} />
              </button>
            </div>

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <User size={18} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* Guest Mode Warning */}
        {!user && (
          <div className="mt-3 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Chế độ khách:</strong> Bạn có thể sử dụng tính năng chia tiền nhưng không thể lưu hóa đơn. 
              <button 
                onClick={onLogin}
                className="ml-2 underline hover:text-yellow-900 dark:hover:text-yellow-100 font-medium"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        )}
      </div>
    </header>
  );
}