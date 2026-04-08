import React from 'react';
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';

export default function OverviewCards({ stats }) {
  const cards = [
    {
      title: 'Tổng chi tháng này',
      value: stats?.totalThisMonth || 0,
      icon: DollarSign,
      bgColor: 'from-blue-500 to-blue-600',
      comparison: stats?.monthComparison || 0,
      showTrend: true
    },
    {
      title: 'Đang nợ bạn',
      value: stats?.owedToYou || 0,
      icon: TrendingUp,
      bgColor: 'from-green-500 to-green-600',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Bạn đang nợ',
      value: stats?.youOwe || 0,
      icon: TrendingDown,
      bgColor: 'from-red-500 to-red-600',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Ngân sách còn lại',
      value: stats?.budgetRemaining || 0,
      icon: Wallet,
      bgColor: 'from-purple-500 to-purple-600',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
          >
            {/* Header với gradient */}
            <div className={`bg-gradient-to-br ${card.bgColor} p-4 text-white`}>
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium opacity-90">{card.title}</h3>
                <Icon size={24} className="opacity-75" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {card.value.toLocaleString('vi-VN')}
                <span className="text-lg text-gray-500 dark:text-gray-400">đ</span>
              </div>

              {/* Trend indicator nếu có */}
              {card.showTrend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.comparison > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {card.comparison > 0 ? (
                    <>
                      <TrendingUp size={14} />
                      +{Math.abs(card.comparison).toLocaleString('vi-VN')}đ vs tháng trước
                    </>
                  ) : (
                    <>
                      <TrendingDown size={14} />
                      -{Math.abs(card.comparison).toLocaleString('vi-VN')}đ vs tháng trước
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
