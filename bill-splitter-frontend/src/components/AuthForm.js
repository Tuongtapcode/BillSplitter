import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AuthForm({ onClose }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // // Validation
    // if (isRegister) {
    //   if (formData.password !== formData.confirmPassword) {
    //     setError('Mật khẩu xác nhận không khớp!');
    //     setIsLoading(false);
    //     return;
    //   }
    //   if (formData.password.length < 6) {
    //     setError('Mật khẩu phải có ít nhất 6 ký tự!');
    //     setIsLoading(false);
    //     return;
    //   }
    //   if (formData.username.length < 3) {
    //     setError('Tên đăng nhập phải có ít nhất 3 ký tự!');
    //     setIsLoading(false);
    //     return;
    //   }
    // }

    try {
      if (isRegister) {
        // Register
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Đăng ký thất bại');
        }

        const data = await response.json();
        alert('✅ Đăng ký thành công! Vui lòng đăng nhập.');
        
        // Switch to login mode and pre-fill username
        setIsRegister(false);
        setFormData({
          username: formData.username,
          password: '',
          confirmPassword: ''
        });
        
      } else {
        // Login
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Đăng nhập thất bại');
        }

        const data = await response.json();
        
        // Save to AuthContext
        login({
          userId: data.userId,
          username: data.username
        }, data.token);

        alert('✅ Đăng nhập thành công!');
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="relative">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
      >
        <X size={24} />
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full">
            {isRegister ? (
              <UserPlus className="text-white" size={28} />
            ) : (
              <LogIn className="text-white" size={28} />
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-sm">
          {isRegister 
            ? 'Tạo tài khoản mới để lưu trữ hóa đơn' 
            : 'Đăng nhập để truy cập lịch sử hóa đơn'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên đăng nhập
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
            placeholder="Nhập tên đăng nhập"
            required
            minLength={3}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mật khẩu
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
            placeholder="Nhập mật khẩu"
            required
            minLength={6}
          />
        </div>

        {/* Confirm Password (Register only) */}
        {isRegister && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
              placeholder="Nhập lại mật khẩu"
              required
              minLength={6}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
              <span>{isRegister ? 'Đăng ký' : 'Đăng nhập'}</span>
            </>
          )}
        </button>
      </form>

      {/* Toggle Mode */}
      <div className="mt-6 text-center">
        <button
          onClick={toggleMode}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          {isRegister 
            ? '← Đã có tài khoản? Đăng nhập ngay' 
            : 'Chưa có tài khoản? Đăng ký →'}
        </button>
      </div>

      {/* Guest Mode Reminder */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Bạn có thể sử dụng chế độ khách để thử nghiệm tính năng mà không cần đăng nhập
        </p>
      </div>
    </div>
  );
}