import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Charts({ expenses }) {
  // Dữ liệu cho Donut Chart - Phân loại chi tiêu
  const categoryData = [
    { name: 'Ăn uống', value: expenses?.byCategory?.food || 0, color: '#EF4444' },
    { name: 'Di chuyển', value: expenses?.byCategory?.transport || 0, color: '#F97316' },
    { name: 'Nhà cửa', value: expenses?.byCategory?.housing || 0, color: '#06B6D4' },
    { name: 'Giải trí', value: expenses?.byCategory?.entertainment || 0, color: '#8B5CF6' },
    { name: 'Khác', value: expenses?.byCategory?.others || 0, color: '#6B7280' },
  ].filter(item => item.value > 0);

  // Dữ liệu cho Bar Chart - Xu hướng hàng ngày
  const dailyData = [
    { day: 'T2', amount: expenses?.daily?.[0] || 0 },
    { day: 'T3', amount: expenses?.daily?.[1] || 0 },
    { day: 'T4', amount: expenses?.daily?.[2] || 0 },
    { day: 'T5', amount: expenses?.daily?.[3] || 0 },
    { day: 'T6', amount: expenses?.daily?.[4] || 0 },
    { day: 'T7', amount: expenses?.daily?.[5] || 0 },
    { day: 'CN', amount: expenses?.daily?.[6] || 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Donut Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🥧</span>
          Phân loại chi tiêu
        </h2>
        
        {categoryData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <ResponsiveContainer width="50%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="space-y-2 w-full lg:w-auto">
              {categoryData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 flex-1">
                    {item.name}
                  </span>
                  <span className="font-bold text-gray-600 dark:text-gray-400">
                    {item.value.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            📊 Chưa có dữ liệu chi tiêu để hiển thị
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Xu hướng chi tiêu (Tuần này)
        </h2>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="day" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => value.toLocaleString('vi-VN') + 'đ'}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
