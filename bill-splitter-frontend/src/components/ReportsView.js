import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ReportsView() {
  // Dummy data
  const monthlyData = [
    { month: 'T1', amount: 2000000, trend: 0 },
    { month: 'T2', amount: 2500000, trend: 500000 },
    { month: 'T3', amount: 2200000, trend: -300000 },
    { month: 'T4', amount: 3100000, trend: 900000 },
    { month: 'T5', amount: 2900000, trend: -200000 },
    { month: 'T6', amount: 3500000, trend: 600000 },
  ];

  const typeData = [
    { name: 'Ăn uống', time: 'T1', amount: 800000 },
    { name: 'Ăn uống', time: 'T2', amount: 950000 },
    { name: 'Di chuyển', time: 'T1', amount: 300000 },
    { name: 'Di chuyển', time: 'T2', amount: 350000 },
    { name: 'Khác', time: 'T1', amount: 900000 },
    { name: 'Khác', time: 'T2', amount: 1200000 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📊 Báo cáo chi tiết</h1>

        {/* Monthly Trend */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Xu hướng chi tiêu hàng tháng</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(value) => value.toLocaleString('vi-VN') + 'đ'}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Report */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">So sánh chi tiêu theo loại</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(value) => value.toLocaleString('vi-VN') + 'đ'}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Bar dataKey="amount" stackId="a" fill="#3B82F6" name="Ăn uống" />
              <Bar dataKey="amount" stackId="a" fill="#F97316" name="Di chuyển" />
              <Bar dataKey="amount" stackId="a" fill="#8B5CF6" name="Khác" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📈 Thống kê nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng 6 tháng</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">16,200,000đ</p>
          </div>
          <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Bình quân/tháng</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">2,700,000đ</p>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cao nhất/tháng</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">3,500,000đ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
