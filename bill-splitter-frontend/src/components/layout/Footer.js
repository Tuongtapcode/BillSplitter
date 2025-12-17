import React from 'react';
import { Github, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 shadow-md mt-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
              Bill Splitter AI
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Ứng dụng chia tiền thông minh sử dụng Gemini AI để tự động đọc hóa đơn 
              và tính toán chính xác phần tiền mỗi người cần thanh toán.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
              Tính năng
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✨ Đọc hóa đơn tự động bằng AI</li>
              <li>💾 Lưu trữ lịch sử hóa đơn</li>
              <li>👥 Chia tiền cho nhiều người</li>
              <li>🌓 Hỗ trợ giao diện sáng/tối</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
              Liên hệ
            </h3>
            <div className="space-y-3">
              <a 
                href="https://github.com/Tuongtapcode/BillSplitter" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                <Github size={18} />
                <span>GitHub Repository</span>
              </a>
              <a 
                href="mailto:ngoctuong230804@gmail.com"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                <Mail size={18} />
                <span>ngoctuong230804@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Bill Splitter AI. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              Made with <Heart size={16} className="text-red-500" fill="currentColor" /> by Nguyen Ngoc Tuong
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}