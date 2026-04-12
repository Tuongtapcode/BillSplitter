import React, { useState } from 'react';
import { Check, AlertCircle, Clock, X, ChevronDown } from 'lucide-react';
import billService from '../api/billApiService';

export default function DebtCard({ debt, userId, token, onStatusChange, onRemove }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  const isUnregistered = debt.creditorId === null;
  const isOwner = debt.userId === userId;
  const isCreditor = debt.creditorId === userId && !isOwner;
  const isOWED_TO = debt.type === 'OWED_TO'; // Nợ người khác
  const isOWED_FROM = debt.type === 'OWED_FROM'; // Được nợ

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge color & icon
  const getStatusBadge = () => {
    switch (debt.status) {
      case 'PENDING':
        return { color: 'bg-yellow-100 dark:bg-yellow-900', textColor: 'text-yellow-700 dark:text-yellow-300', icon: <Clock size={16} />, text: '⏳ Chờ xác nhận' };
      case 'PENDING_VERIFICATION':
        return { color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-700 dark:text-blue-300', icon: <AlertCircle size={16} />, text: '🔔 Chờ xác minh' };
      case 'SETTLED':
        return { color: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-700 dark:text-green-300', icon: <Check size={16} />, text: '✓ Đã xong' };
      case 'DISPUTED':
        return { color: 'bg-red-100 dark:bg-red-900', textColor: 'text-red-700 dark:text-red-300', icon: <X size={16} />, text: '⚠️ Tranh chấp' };
      default:
        return { color: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-700 dark:text-gray-300', text: debt.status };
    }
  };

  const statusBadge = getStatusBadge();

  // Get creditor/debtor name
  const getCreditorName = () => {
    if (isUnregistered) {
      return debt.creditorName || 'Unknown';
    }
    return debt.creditorName || `User ${debt.creditorId?.substring(0, 8)}...`;
  };

  const getDebtorName = () => {
    if (isOWED_FROM) {
      return debt.creditorId?.substring(0, 8) || 'Unknown';
    }
    return debt.userId?.substring(0, 8) || 'Unknown';
  };

  // Handle status update
  const handleUpdateStatus = async (newStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedDebt = await billService.updateDebtStatus(debt._id, newStatus, token);
      onStatusChange(updatedDebt);
    } catch (err) {
      setError(err.message);
      console.error('Error updating debt status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Bạn chắc chắn muốn xóa khoản nợ này?')) {
      onRemove(debt._id);
    }
  };

  return (
    <div className={`${isOWED_TO ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'} bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {isOWED_TO ? '📤 Tôi nợ' : '📥 Được nợ'}
            </h3>
            <span className="text-lg text-gray-700 dark:text-gray-300">{getCreditorName()}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isUnregistered && '(Chưa đăng ký)'}
            {!isUnregistered && debt.creditorId && `(Registered)`}
          </p>
        </div>

        {/* Amount */}
        <div className={`text-right`}>
          <p className={`text-2xl font-bold ${isOWED_TO ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatCurrency(debt.amount)}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color} ${statusBadge.textColor}`}>
          {statusBadge.icon}
          {statusBadge.text}
        </span>
      </div>

      {/* Bill Info */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
        <p className="text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Hóa đơn:</span> {debt.description || 'N/A'}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
          {new Date(debt.createdAt).toLocaleDateString('vi-VN')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* UNREGISTERED USER ACTIONS */}
        {isUnregistered && (
          <>
            {debt.status !== 'SETTLED' && (
              <button
                onClick={() => handleUpdateStatus('SETTLED')}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? '🔄 Đang xử lý...' : '✓ Đã trả'}
              </button>
            )}
          </>
        )}

        {/* REGISTERED USER ACTIONS */}
        {!isUnregistered && debt.status !== 'SETTLED' && (
          <>
            {isOwner && debt.status === 'PENDING_VERIFICATION' && (
              <button
                onClick={() => handleUpdateStatus('SETTLED')}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? '🔄 Đang xử lý...' : '👤 Tôi đã trả'}
              </button>
            )}

            {isCreditor && debt.status === 'PENDING_VERIFICATION' && (
              <button
                onClick={() => handleUpdateStatus('SETTLED')}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? '🔄 Đang xử lý...' : '👍 Tôi nhận rồi'}
              </button>
            )}

            {debt.status !== 'DISPUTED' && (
              <button
                onClick={() => handleUpdateStatus('DISPUTED')}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-orange-400 hover:bg-orange-500 dark:bg-orange-700 dark:hover:bg-orange-600 text-white rounded transition disabled:opacity-50"
              >
                ⚠️ Tranh chấp
              </button>
            )}
          </>
        )}

        {/* SETTLED ACTION */}
        {debt.status === 'SETTLED' && (
          <div className="p-3 bg-green-50 dark:bg-green-900 rounded text-center">
            <p className="text-green-700 dark:text-green-300 font-semibold">✓ Khoản nợ đã được thanh toán</p>
          </div>
        )}

        {/* DISPUTED ACTION */}
        {debt.status === 'DISPUTED' && (
          <button
            onClick={() => handleUpdateStatus('PENDING')}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded transition disabled:opacity-50"
          >
            🔄 Cập nhật trạng thái
          </button>
        )}

        {/* DETAILS / REMOVE */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 px-2 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center gap-1"
          >
            <ChevronDown size={16} className={`transition ${showDetails ? 'rotate-180' : ''}`} />
            Chi tiết
          </button>

          {debt.status === 'SETTLED' && (
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="flex-1 px-2 py-2 text-sm bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-300 dark:hover:bg-red-800 transition disabled:opacity-50"
            >
              🗑️ Xóa
            </button>
          )}
        </div>
      </div>

      {/* Extended Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Số tiền:</span>
            <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(debt.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Loại:</span>
            <span className="font-semibold text-gray-800 dark:text-white">{isOWED_TO ? 'Nợ' : 'Được nợ'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
            <span className="font-semibold text-gray-800 dark:text-white">{debt.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tạo ngày:</span>
            <span className="font-semibold text-gray-800 dark:text-white">
              {new Date(debt.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>
          {debt.verifiedBy && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Xác nhận bởi:</span>
              <span className="text-gray-800 dark:text-white text-xs">{debt.verifiedBy.substring(0, 8)}...</span>
            </div>
          )}
          {debt.description && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Ghi chú:</span>
              <p className="text-gray-800 dark:text-white mt-1">{debt.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
