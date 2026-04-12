import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, Filter, RotateCcw } from 'lucide-react';
import DebtCard from './DebtCard';
import billService from '../api/billApiService';

export default function DebtList({ userId, token, title = 'Danh sách nợ', initialFilters = {} }) {
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: initialFilters.status || null,
    type: initialFilters.type || null
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load debts on mount or when filters change
  useEffect(() => {
    fetchDebts();
  }, [filters]);

  const fetchDebts = async () => {
    if (!userId || !token) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Build filter object (exclude null values)
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== null)
      );

      const data = await billService.getDebts(userId, token, activeFilters);
      setDebts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching debts:', err);
      setError(err.message || 'Failed to load debts');
      setDebts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (updatedDebt) => {
    // Update debt in list
    setDebts(debts.map(d => d._id === updatedDebt._id ? updatedDebt : d));
  };

  const handleRemove = async (debtId) => {
    // Remove from UI (actual deletion would need a DELETE endpoint)
    setDebts(debts.filter(d => d._id !== debtId));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value === prev[filterName] ? null : value
    }));
  };

  const handleResetFilters = () => {
    setFilters({ status: null, type: null });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== null).length;
  };

  // Filter options
  const statusOptions = [
    { value: 'PENDING', label: '⏳ Chờ xác nhận', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
    { value: 'PENDING_VERIFICATION', label: '🔔 Chờ xác minh', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
    { value: 'SETTLED', label: '✓ Đã xong', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
    { value: 'DISPUTED', label: '⚠️ Tranh chấp', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' }
  ];

  const typeOptions = [
    { value: 'OWED_TO', label: '📤 Nợ người khác', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
    { value: 'OWED_FROM', label: '📥 Được nợ', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' }
  ];

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showFilters
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Filter size={18} />
              Bộ lọc
              {getActiveFilterCount() > 0 && (
                <span className="ml-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('status', option.value)}
                    className={`px-3 py-2 rounded-lg transition text-sm font-medium ${
                      filters.status === option.value
                        ? `${option.color} ring-2 ring-offset-2 dark:ring-offset-gray-800`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Loại nợ
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('type', option.value)}
                    className={`px-3 py-2 rounded-lg transition text-sm font-medium ${
                      filters.type === option.value
                        ? `${option.color} ring-2 ring-offset-2 dark:ring-offset-gray-800`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            {getActiveFilterCount() > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition text-sm"
              >
                <RotateCcw size={16} />
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Đang tải...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Lỗi</p>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchDebts}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded text-sm transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && debts.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            {getActiveFilterCount() > 0 ? 'Không có nợ phù hợp với bộ lọc' : 'Chưa có nợ nào'}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            {getActiveFilterCount() > 0
              ? 'Hãy thử thay đổi bộ lọc'
              : 'Tạo hóa đơn để bắt đầu chia tiền'}
          </p>
        </div>
      )}

      {/* Debts List */}
      {!isLoading && !error && debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {debts.map(debt => (
            <DebtCard
              key={debt._id}
              debt={debt}
              userId={userId}
              token={token}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Results Info */}
      {!isLoading && !error && debts.length > 0 && (
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          Hiển thị {debts.length} khoản nợ
        </div>
      )}
    </div>
  );
}
