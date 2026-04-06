import React, { useEffect } from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Component hiển thị notification khi token hết hạn
 * Tự động chuyển hướng về trang login sau khi dismiss
 */
const TokenExpiredNotification = () => {
  const { tokenExpiredError, clearTokenExpiredError, logout } = useAuth();

  useEffect(() => {
    if (tokenExpiredError) {
      // Hiển thị thông báo trong 3 giây rồi tự động chuyển hướng
      const timer = setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [tokenExpiredError, logout]);

  if (!tokenExpiredError) {
    return null;
  }

  const handleDismiss = () => {
    clearTokenExpiredError();
    logout();
    window.location.href = '/';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Phiên đăng nhập hết hạn
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Token của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng ứng dụng.
              Sẽ tự động chuyển hướng trong vài giây...
            </p>
            <div className="mt-3">
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Đăng nhập lại
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-3 text-red-400 hover:text-red-500"
          >
            <span className="sr-only">Đóng</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenExpiredNotification;
