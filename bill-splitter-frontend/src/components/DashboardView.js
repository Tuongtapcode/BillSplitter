import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Users, Calendar } from 'lucide-react';
import OverviewCards from './dashboard/OverviewCards';

export default function DashboardView({ bills = [] }) {
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    monthComparison: 0,
    owedToYou: 0,
    youOwe: 0,
    budgetRemaining: 0,
    totalBills: 0,
    totalPeople: 0
  });

  useEffect(() => {
    if (!bills || bills.length === 0) return;

    const now = new Date();
    const thisMonth = bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return (
        billDate.getMonth() === now.getMonth() &&
        billDate.getFullYear() === now.getFullYear()
      );
    });

    const lastMonth = bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return (
        billDate.getMonth() === lastMonthDate.getMonth() &&
        billDate.getFullYear() === lastMonthDate.getFullYear()
      );
    });

    const thisMonthTotal = thisMonth.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const lastMonthTotal = lastMonth.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const comparison = thisMonthTotal - lastMonthTotal;

    // Calculate unique people count
    const uniquePeople = new Set();
    bills.forEach(bill => {
      bill.people?.forEach(p => uniquePeople.add(p));
    });

    setStats({
      totalThisMonth: thisMonthTotal,
      monthComparison: comparison,
      owedToYou: 0,
      youOwe: 0,
      budgetRemaining: 10000000 - thisMonthTotal,
      totalBills: bills.length,
      totalPeople: uniquePeople.size
    });
  }, [bills]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <OverviewCards stats={stats} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Bills */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tổng số hóa đơn</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalBills}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tất cả các hóa đơn</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        {/* Total People */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Người chia tiền</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalPeople}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Bạn bè và đồng nghiệp</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>

        {/* Average Bill */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bình quân/hóa đơn</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {stats.totalBills > 0 
                  ? Math.round(stats.totalThisMonth / stats.totalBills).toLocaleString('vi-VN')
                  : '0'
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Này tháng</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📋 Hoạt động gần đây</h2>
        
        {bills && bills.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bills.slice(0, 5).map((bill) => (
              <div key={bill._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-white">{bill.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    👥 {bill.people.length} người • 🛒 {bill.items.length} món
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 dark:text-white">
                    {bill.total.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(bill.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              📭 Chưa có hoạt động nào
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">💡 Mẹo sử dụng</h3>
        <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
          <li>✓ Chụp ảnh hóa đơn để AI tự động nhập danh sách sản phẩm</li>
          <li>✓ Sử dụng "Chia số lượng riêng" khi các bạn mua lượng khác nhau</li>
          <li>✓ Kiểm tra "Sổ chi tiêu" để xem xu hướng chi tiêu của bạn</li>
          <li>✓ Tạo "Nhóm" để nhanh chóng thêm danh sách người thường xuyên chia tiền</li>
        </ul>
      </div>
    </div>
  );
}
