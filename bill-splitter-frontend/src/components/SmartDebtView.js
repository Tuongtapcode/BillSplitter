import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader, AlertCircle } from 'lucide-react';
import billService from '../api/billApiService';
import DebtList from './DebtList';

export default function SmartDebtView({ userId, token }) {
  const [summary, setSummary] = useState({
    totalPayable: 0,
    payableCount: 0,
    totalReceivable: 0,
    receivableCount: 0,
    unsettledCount: 0,
    disputedCount: 0
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [error, setError] = useState(null);

  // Load summary on mount
  useEffect(() => {
    fetchSummary();
  }, [userId, token]);

  const fetchSummary = async () => {
    if (!userId || !token) {
      setError('User not authenticated');
      return;
    }

    setIsLoadingSummary(true);
    setError(null);
    try {
      const data = await billService.getDebtSummary(userId, token);
      setSummary(data);
    } catch (err) {
      console.error('Error fetching debt summary:', err);
      setError(err.message || 'Failed to load debt summary');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📊 Sổ nợ thông minh</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Quản lý dòng tiền giữa bạn và bạn bè</p>
      </div>

      {/* Summary Cards - Loading */}
      {isLoadingSummary && (
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <Loader size={32} className="text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Đang tải thông tin...</span>
        </div>
      )}

      {/* Summary Cards - Error */}
      {error && !isLoadingSummary && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Lỗi</p>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchSummary}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded text-sm transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!isLoadingSummary && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receivables - Bạn cần thu */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bạn cần thu</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Người khác nợ bạn</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(summary.totalReceivable)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Từ {summary.receivableCount} khoản nợ chưa xử lý
                </p>
              </div>

              {/* Quick stats */}
              <div className="pt-4 border-t border-green-200 dark:border-green-800 flex gap-4 text-sm">
                <div>
                  <p className="text-green-600 dark:text-green-400 font-semibold">{summary.receivableCount}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Khoản chưa xử lý</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payables - Bạn cần trả */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900 dark:to-orange-900 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-lg flex items-center justify-center">
                  <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bạn cần trả</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Bạn nợi người khác</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(summary.totalPayable)}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Từ {summary.payableCount} khoản nợ chưa xử lý
                </p>
              </div>

              {/* Quick stats */}
              <div className="pt-4 border-t border-red-200 dark:border-red-800 flex gap-4 text-sm">
                <div>
                  <p className="text-red-600 dark:text-red-400 font-semibold">{summary.payableCount}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Khoản chưa xử lý</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Overview */}
      {!isLoadingSummary && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Chưa xử lý: <span className="font-bold text-gray-800 dark:text-white">{summary.unsettledCount}</span>
              </span>
            </div>
            {summary.disputedCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Tranh chấp: <span className="font-bold text-red-600 dark:text-red-400">{summary.disputedCount}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Receivables (Được nợ) */}
        <div>
          <DebtList
            userId={userId}
            token={token}
            title="📥 Người khác nợ bạn"
            initialFilters={{ type: 'OWED_FROM' }}
          />
        </div>

        {/* Right Column: Payables (Nợ) */}
        <div>
          <DebtList
            userId={userId}
            token={token}
            title="📤 Bạn nợi người khác"
            initialFilters={{ type: 'OWED_TO' }}
          />
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          💡 Mẹo sử dụng
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <li>✓ Bạn cần thu: Những khoản tiền người khác phải trả bạn</li>
          <li>✓ Bạn cần trả: Những khoản tiền bạn phải trả cho người khác</li>
          <li>✓ Nhấp vào "Đã trả" để đánh dấu đã thanh toán</li>
          <li>✓ Học chủ không đăng ký: Chỉ cần bạn xác nhận trạng thái</li>
          <li>✓ Chủ đã đăng ký: Cần xác nhận từ cả hai bên để hoàn tất</li>
        </ul>
      </div>
    </div>
  );
}
