import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, 
  Receipt, ChevronLeft, ChevronRight, ArrowLeft,
  DollarSign, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Chart from 'chart.js/auto';

const StatsDashboard = ({ onBack }) => {
  const { getToken, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyDetail, setMonthlyDetail] = useState(null);
  const [view, setView] = useState('overview'); // 'overview' hoặc 'detail'

  // Refs cho các biểu đồ
  const monthlyChartRef = useRef(null);
  const dailyChartRef = useRef(null);
  const trendChartRef = useRef(null);
  
  // Instances của Chart.js
  const monthlyChartInstance = useRef(null);
  const dailyChartInstance = useRef(null);
  const trendChartInstance = useRef(null);

  // Load thống kê tổng quan
  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  // Load chi tiết tháng khi chọn
  useEffect(() => {
    if (isAuthenticated && selectedMonth && selectedYear) {
      loadMonthlyDetail();
    }
  }, [selectedMonth, selectedYear, isAuthenticated]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();
      if (dailyChartInstance.current) dailyChartInstance.current.destroy();
      if (trendChartInstance.current) trendChartInstance.current.destroy();
    };
  }, []);

  // Render charts when data changes
  useEffect(() => {
    if (stats && stats.monthlyStats && view === 'overview') {
      renderMonthlyChart();
      renderTrendChart();
    }
  }, [stats, view]);

  useEffect(() => {
    if (monthlyDetail && monthlyDetail.dailyStats && view === 'detail') {
      renderDailyChart();
    }
  }, [monthlyDetail, view]);

  const loadStats = async () => {
    try {
      setError(null);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/bills/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyDetail = async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/bills/stats?year=${selectedYear}&month=${selectedMonth}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setMonthlyDetail(data);
      } else {
        setMonthlyDetail(null);
      }
    } catch (error) {
      console.error('Error loading monthly detail:', error);
      setMonthlyDetail(null);
    }
  };

  const renderMonthlyChart = () => {
    if (!monthlyChartRef.current || !stats?.monthlyStats) return;

    // Destroy existing chart
    if (monthlyChartInstance.current) {
      monthlyChartInstance.current.destroy();
    }

    const ctx = monthlyChartRef.current.getContext('2d');
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const data = months.map(m => stats.monthlyStats[m]?.amount || 0);
    const counts = months.map(m => stats.monthlyStats[m]?.count || 0);

    monthlyChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months.map(m => `T${m}`),
        datasets: [{
          label: 'Chi tiêu (VNĐ)',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          borderRadius: 8,
          yAxisID: 'y'
        }, {
          label: 'Số hóa đơn',
          data: counts,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          borderRadius: 8,
          yAxisID: 'y1',
          type: 'line'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { 
              font: { size: 12, weight: 'bold' },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  if (context.datasetIndex === 0) {
                    label += new Intl.NumberFormat('vi-VN').format(context.parsed.y) + 'đ';
                  } else {
                    label += context.parsed.y + ' hóa đơn';
                  }
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('vi-VN', {
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value) + 'đ';
              }
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              callback: function(value) {
                return Math.round(value);
              }
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  };

  const renderTrendChart = () => {
    if (!trendChartRef.current || !stats?.monthlyStats) return;

    if (trendChartInstance.current) {
      trendChartInstance.current.destroy();
    }

    const ctx = trendChartRef.current.getContext('2d');
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const data = months.map(m => stats.monthlyStats[m]?.amount || 0);

    trendChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months.map(m => `T${m}`),
        datasets: [{
          label: 'Xu hướng chi tiêu',
          data: data,
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return new Intl.NumberFormat('vi-VN').format(context.parsed.y) + 'đ';
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('vi-VN', {
                  notation: 'compact'
                }).format(value) + 'đ';
              }
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  };

  const renderDailyChart = () => {
    if (!dailyChartRef.current || !monthlyDetail?.dailyStats) return;

    if (dailyChartInstance.current) {
      dailyChartInstance.current.destroy();
    }

    const ctx = dailyChartRef.current.getContext('2d');
    const days = Object.keys(monthlyDetail.dailyStats).sort((a, b) => parseInt(a) - parseInt(b));
    const data = days.map(day => monthlyDetail.dailyStats[day]?.amount || 0);

    dailyChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days.map(d => `Ngày ${d}`),
        datasets: [{
          label: 'Chi tiêu theo ngày',
          data: data,
          backgroundColor: days.map((_, i) => 
            i % 2 === 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(59, 130, 246, 0.6)'
          ),
          borderColor: days.map((_, i) => 
            i % 2 === 0 ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)'
          ),
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const day = days[context.dataIndex];
                const count = monthlyDetail.dailyStats[day]?.count || 0;
                return [
                  `Chi tiêu: ${new Intl.NumberFormat('vi-VN').format(context.parsed.y)}đ`,
                  `Số hóa đơn: ${count}`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('vi-VN', {
                  notation: 'compact'
                }).format(value) + 'đ';
              }
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: { 
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 45 }
          }
        }
      }
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getMonthName = (month) => {
    const months = [
      'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
      'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
    ];
    return months[month - 1];
  };

  const navigateMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Đang tải thống kê...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <Receipt size={48} className="mx-auto mb-4 text-red-500 opacity-50" />
            <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
              Không thể tải thống kê
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadStats}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
              <BarChart3 className="text-blue-600 dark:text-blue-400" size={28} />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Thống kê chi tiêu
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('overview')}
                className={`px-4 py-2 rounded-lg transition ${
                  view === 'overview'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setView('detail')}
                className={`px-4 py-2 rounded-lg transition ${
                  view === 'detail'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {view === 'overview' ? (
          <>
            {/* Summary Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar size={24} className="opacity-80" />
                    <span className="text-sm opacity-80">Tháng này</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {formatCurrency(stats.currentMonth?.totalAmount || 0)}
                  </div>
                  <div className="text-sm opacity-80">
                    {stats.currentMonth?.billCount || 0} hóa đơn
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar size={24} className="opacity-80" />
                    <span className="text-sm opacity-80">Tháng trước</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {formatCurrency(stats.previousMonth?.totalAmount || 0)}
                  </div>
                  <div className="text-sm opacity-80">
                    {stats.previousMonth?.billCount || 0} hóa đơn
                  </div>
                </div>

                <div className={`rounded-xl p-6 text-white shadow-lg ${
                  (stats.changePercent || 0) >= 0
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-green-500 to-green-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    {(stats.changePercent || 0) >= 0 ? (
                      <TrendingUp size={24} className="opacity-80" />
                    ) : (
                      <TrendingDown size={24} className="opacity-80" />
                    )}
                    <span className="text-sm opacity-80">Thay đổi</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {(stats.changePercent || 0) >= 0 ? '+' : ''}
                    {(stats.changePercent || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm opacity-80">
                    So với tháng trước
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Receipt size={24} className="opacity-80" />
                    <span className="text-sm opacity-80">Trung bình/ngày</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {formatCurrency(
                      (stats.currentMonth?.totalAmount || 0) / new Date().getDate()
                    )}
                  </div>
                  <div className="text-sm opacity-80">
                    Tháng {new Date().getMonth() + 1}
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Chi tiêu theo tháng - Năm {new Date().getFullYear()}
                </h3>
                <div className="h-80">
                  <canvas ref={monthlyChartRef}></canvas>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Xu hướng chi tiêu
                </h3>
                <div className="h-80">
                  <canvas ref={trendChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* Monthly Grid */}
            {stats && stats.monthlyStats && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Chi tiết từng tháng
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const data = stats.monthlyStats[month];
                    return (
                      <div
                        key={month}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 text-center hover:shadow-md transition cursor-pointer"
                        onClick={() => {
                          setSelectedMonth(month);
                          setView('detail');
                        }}
                      >
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {getMonthName(month)}
                        </div>
                        <div className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                          {formatCurrency(data?.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {data?.count || 0} hóa đơn
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Detail View */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Chi tiết tháng
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">
                    {getMonthName(selectedMonth)} {selectedYear}
                  </span>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {monthlyDetail ? (
                <>
                  {/* Monthly Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={20} />
                        <span className="text-sm opacity-80">Tổng chi tiêu</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(monthlyDetail.totalAmount || 0)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt size={20} />
                        <span className="text-sm opacity-80">Số hóa đơn</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {monthlyDetail.billCount || 0}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart size={20} />
                        <span className="text-sm opacity-80">Trung bình/hóa đơn</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          monthlyDetail.billCount > 0
                            ? monthlyDetail.totalAmount / monthlyDetail.billCount
                            : 0
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Daily Chart */}
                  {monthlyDetail.dailyStats && Object.keys(monthlyDetail.dailyStats).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Chi tiêu theo ngày
                      </h4>
                      <div className="h-80">
                        <canvas ref={dailyChartRef}></canvas>
                      </div>
                    </div>
                  )}

                  {/* Bills List */}
                  {monthlyDetail.bills && monthlyDetail.bills.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Danh sách hóa đơn ({monthlyDetail.bills.length})
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {monthlyDetail.bills.map((bill, index) => (
                          <div
                            key={bill?.id || index}
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 dark:text-white mb-1">
                                {bill?.name || 'Không tên'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {bill?.date
                                  ? new Date(bill.date).toLocaleDateString('vi-VN', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : 'Không có ngày'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(bill?.total || 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!monthlyDetail.bills || monthlyDetail.bills.length === 0) && 
                   (!monthlyDetail.dailyStats || Object.keys(monthlyDetail.dailyStats).length === 0) && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Receipt size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-lg">Không có hóa đơn nào trong tháng này</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;