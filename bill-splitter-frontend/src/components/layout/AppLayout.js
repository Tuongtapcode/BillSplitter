import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function AppLayout({
  user,
  onLogin,
  onLogout,
  theme,
  onThemeChange,
  currentTab,
  onTabChange,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bgColor = "bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800";

  return (
    <div className={`min-h-screen flex flex-col ${bgColor} transition-colors duration-300`}>
      {/* Header */}
      <Header user={user} onLogin={onLogin} onLogout={onLogout} theme={theme} onThemeChange={onThemeChange} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={onTabChange}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={onLogout}
        />

        {/* Main Content */}
        <main className="flex-1 w-full lg:w-auto p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
