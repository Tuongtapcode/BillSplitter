// api/apiInterceptor.js - Interceptor để xử lý token expiration

let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

/**
 * Fetch wrapper that handles token expiration
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} Response
 */
export const fetchWithTokenCheck = async (url, options = {}) => {
  const response = await fetch(url, options);

  // Kiểm tra nếu token hết hạn hoặc không hợp lệ
  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({}));
    const errorMsg = data.error || 'Authentication failed';
    
    // Nếu là lỗi token invalid/expired, đăng xuất người dùng
    if (
      errorMsg.includes('expired') || 
      errorMsg.includes('invalid') || 
      errorMsg.includes('Authentication required')
    ) {
      console.warn('Token expired or invalid, logging out...');
      
      // Gọi logout callback nếu có
      if (logoutCallback) {
        logoutCallback();
      }
      
      // Throw error để component xử lý
      throw new Error(`Session expired: ${errorMsg}`);
    }
  }

  return response;
};
