import React, { useState, useEffect } from 'react';
import OverviewCards from './OverviewCards';
import Charts from './Charts';
import TransactionList from './TransactionList';

export default function ExpensesManagement({ bills = [] }) {
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    monthComparison: 0,
    owedToYou: 0,
    youOwe: 0,
    budgetRemaining: 0,
  });

  const [expenses, setExpenses] = useState({
    byCategory: {
      food: 0,
      transport: 0,
      housing: 0,
      entertainment: 0,
      others: 0,
    },
    daily: [0, 0, 0, 0, 0, 0, 0],
  });

  const [transactions, setTransactions] = useState([]);

  // Calculate stats from bills
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

    // Calculate totals
    const thisMonthTotal = thisMonth.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const lastMonthTotal = lastMonth.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const comparison = thisMonthTotal - lastMonthTotal;

    // Calculate owed amounts from results
    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    thisMonth.forEach((bill) => {
      // Parse results to find personal amounts
      // This is simplified - adjust based on your data structure
      if (bill.items) {
        bill.items.forEach((item) => {
          if (item.assignedTo && item.assignedTo.length > 0) {
            // Some people owe for this item
            totalOwedToYou += (item.price * item.quantity) / item.assignedTo.length;
          }
        });
      }
    });

    // Categorize expenses by category (this needs AI tagging in your backend)
    const categoryMap = {
      food: 0,
      transport: 0,
      housing: 0,
      entertainment: 0,
      others: 0,
    };

    // Simple keyword matching for now
    thisMonth.forEach((bill) => {
      const billName = bill.name.toLowerCase();
      const amount = bill.total || 0;

      if (
        billName.includes('cà phê') ||
        billName.includes('ăn') ||
        billName.includes('cơm') ||
        billName.includes('cafe')
      ) {
        categoryMap.food += amount;
      } else if (
        billName.includes('xe') ||
        billName.includes('xăng') ||
        billName.includes('grab') ||
        billName.includes('taxi')
      ) {
        categoryMap.transport += amount;
      } else if (
        billName.includes('nhà') ||
        billName.includes('điện') ||
        billName.includes('nước')
      ) {
        categoryMap.housing += amount;
      } else if (
        billName.includes('phim') ||
        billName.includes('game') ||
        billName.includes('vui')
      ) {
        categoryMap.entertainment += amount;
      } else {
        categoryMap.others += amount;
      }
    });

    // Calculate daily expenses
    const dailyExpenses = [0, 0, 0, 0, 0, 0, 0];
    thisMonth.forEach((bill) => {
      const billDate = new Date(bill.createdAt);
      const dayOfWeek = billDate.getDay() === 0 ? 6 : billDate.getDay() - 1;
      dailyExpenses[dayOfWeek] += bill.total || 0;
    });

    // Convert bills to transactions
    const txns = [];
    thisMonth.forEach((bill) => {
      bill.items?.forEach((item) => {
        txns.push({
          id: `${bill._id}-${item.name}`,
          name: item.name,
          amount: item.price * item.quantity,
          date: bill.createdAt,
          paidBy: bill.paidBy || 'Unknown',
          category: 'others', // Would be set by AI in future
          type: 'expense',
        });
      });
    });

    setStats({
      totalThisMonth: thisMonthTotal,
      monthComparison: comparison,
      owedToYou: totalOwedToYou,
      youOwe: totalYouOwe,
      budgetRemaining: 10000000 - thisMonthTotal, // Dummy budget
    });

    setExpenses({
      byCategory: categoryMap,
      daily: dailyExpenses,
    });

    setTransactions(txns.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, [bills]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <OverviewCards stats={stats} />

      {/* Charts */}
      <Charts expenses={expenses} />

      {/* Transaction List */}
      <TransactionList transactions={transactions} />

      {/* Empty State */}
      {(!bills || bills.length === 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            📊 Chưa có hóa đơn để phân tích
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Hãy tạo hóa đơn đầu tiên để xem thống kê chi tiêu
          </p>
        </div>
      )}
    </div>
  );
}
