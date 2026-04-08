import React, { useState } from 'react';
import { ChefHat, Car, Home, Zap, Filter, Search } from 'lucide-react';

const categoryIcons = {
  food: { icon: ChefHat, color: '#EF4444', name: 'Ăn uống' },
  transport: { icon: Car, color: '#F97316', name: 'Di chuyển' },
  housing: { icon: Home, color: '#06B6D4', name: 'Nhà cửa' },
  entertainment: { icon: Zap, color: '#8B5CF6', name: 'Giải trí' },
  others: { icon: Filter, color: '#6B7280', name: 'Khác' },
};

export default function TransactionList({ transactions = [] }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesCategory = filter === 'all' || t.category === filter;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.paidBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedByDate = (transactionList) => {
    const groups = {};
    transactionList.forEach((t) => {
      const date = new Date(t.date).toLocaleDateString('vi-VN');
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  };

  const grouped = groupedByDate(filteredTransactions);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">💳</span>
        Danh sách giao dịch
      </h2>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm giao dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 text-sm rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Tất cả
          </button>
          {Object.entries(categoryIcons).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 text-sm rounded-lg transition flex items-center gap-1 ${
                filter === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={filter === key ? {} : { borderLeft: `3px solid ${val.color}` }}
            >
              {val.name}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).length > 0 ? (
          Object.entries(grouped).map(([date, dateTransactions]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  📅 {date}
                </h3>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {dateTransactions.length} giao dịch
                </span>
              </div>

              {/* Transactions for this date */}
              <div className="space-y-2 mb-4">
                {dateTransactions.map((transaction, idx) => {
                  const categoryData = categoryIcons[transaction.category] || categoryIcons.others;
                  const Icon = categoryData.icon;
                  const isIncome = transaction.type === 'income';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition group"
                    >
                      {/* Icon & Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition"
                          style={{ backgroundColor: categoryData.color + '20' }}
                        >
                          <Icon size={18} style={{ color: categoryData.color }} />
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                            {transaction.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Trả bởi <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {transaction.paidBy}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div
                          className={`font-bold text-sm ${
                            isIncome
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{transaction.amount.toLocaleString('vi-VN')}đ
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.category ? categoryData.name : 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchTerm || filter !== 'all' ? '🔍 Không tìm thấy giao dịch' : '📋 Chưa có giao dịch nào'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
