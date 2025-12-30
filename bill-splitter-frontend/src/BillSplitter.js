import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Users, Plus, Trash2, Calculator, History, Camera, Save, FolderOpen, RefreshCw, Printer, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AuthForm from './components/AuthForm';

// === CẤU HÌNH API BACKEND ===
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bill-splitter-backend-zju5.onrender.com/api';

// === API Service ===
const api = {
  // Gemini - Đọc hóa đơn (không cần auth)
  async extractBill(imageBase64, mimeType) {
    const response = await fetch(`${API_BASE_URL}/gemini/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, mimeType })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract bill');
    }
    
    return response.json();
  },

  // Bills CRUD (cần auth)
  async createBill(billData, token) {
    const response = await fetch(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(billData)
    });
    
    if (!response.ok) throw new Error('Failed to create bill');
    return response.json();
  },

  async getBills(token, startDate, endDate, limit = 50, skip = 0) {
    const params = new URLSearchParams({ limit, skip });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`${API_BASE_URL}/bills?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch bills');
    return response.json();
  },

  async getBillStats(token, year, month) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const response = await fetch(`${API_BASE_URL}/bills/stats?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async updateBill(billId, billData, token) {
    const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(billData)
    });
    
    if (!response.ok) throw new Error('Failed to update bill');
    return response.json();
  },

  async deleteBill(billId, token) {
    const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to delete bill');
    return response.json();
  }
};

// === LOCAL STORAGE cho Theme ===
const themeStorage = {
  save: (theme) => localStorage.setItem('theme', theme),
  load: () => localStorage.getItem('theme') || 'system'
};

// === COMPONENT CHÍNH ===
export default function BillSplitter() {
  const { user, logout, getToken, isAuthenticated } = useAuth();
  
  const [people, setPeople] = useState(['Ngọc Tưởng', 'Long Ánh', 'Duy Đông', 'Công Trực']);
  const [items, setItems] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [billName, setBillName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [theme, setTheme] = useState('system');
  const [currentBillId, setCurrentBillId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [currentImage, setCurrentImage] = useState(null); // THÊM: Lưu thông tin ảnh
  const [isDragging, setIsDragging] = useState(false); // THÊM: Trạng thái drag
  const resultRef = useRef(null);
  const fileInputRef = useRef(null); // THÊM: Ref cho input file

  // Load history & theme on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
    const savedTheme = themeStorage.load();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, [isAuthenticated]);

  // --- THEME LOGIC ---
  const saveThemeSetting = (newTheme) => {
    setTheme(newTheme);
    themeStorage.save(newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (currentTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark');
    
    if (currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
    applyTheme(theme);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // --- PRINT LOGIC (CẬP NHẬT: Thêm ảnh) ---
  const handlePrintResult = () => {
    if (resultRef.current) {
      const printContents = resultRef.current.innerHTML;
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write('<html><head><title>Kết quả chia tiền</title>');
      
      printWindow.document.write(`
        <style>
            @media print {
                body { 
                    margin: 0; 
                    padding: 20px; 
                    background-color: white !important; 
                    color: black !important;
                    font-family: sans-serif;
                }
                .print-area {
                    border: 1px solid #ccc;
                    padding: 20px;
                    border-radius: 8px;
                }
                h1, h2, h3, div, span, p { 
                    color: black !important; 
                    text-shadow: none !important;
                }
                .bg-gradient-to-r { background: #f0fdf4 !important; }
                .text-green-600 { color: #059669 !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .text-gray-600, .text-gray-500 { color: #4b5563 !important; }
                /* THÊM: Style cho ảnh khi in */
                .bill-image {
                    max-width: 100%;
                    height: auto;
                    margin: 20px 0;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                .image-section {
                    page-break-inside: avoid;
                    margin-bottom: 20px;
                }
            }
        </style>
      `);
      
      printWindow.document.write('</head><body><div class="print-area">');
      
      // THÊM: In ảnh hóa đơn nếu có
      if (currentImage && currentImage.url) {
        printWindow.document.write(`
          <div class="image-section">
            <h3 style="color: #1d4ed8; margin-bottom: 10px;">📷 Ảnh hóa đơn gốc</h3>
            <img src="${currentImage.url}" alt="Bill Image" class="bill-image" />
          </div>
        `);
      }
      
      printWindow.document.write(printContents);
      printWindow.document.write('</div></body></html>');
      
      printWindow.document.close();
      printWindow.focus();
      
      // Đợi ảnh load xong rồi mới in
      if (currentImage && currentImage.url) {
        const img = printWindow.document.querySelector('.bill-image');
        if (img) {
          img.onload = () => {
            printWindow.print();
          };
        } else {
          printWindow.print();
        }
      } else {
        printWindow.print();
      }
    }
  };

  // --- API CALLS ---
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    try {
      const token = getToken();
      const data = await api.getBills(token);
      setHistory(data.bills || []);
    } catch (error) {
      console.error('Error loading history:', error);
      alert('❌ Lỗi khi tải lịch sử: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getToken]);

  const saveBill = async () => {
    if (!isAuthenticated) {
      alert('⚠️ Bạn cần đăng nhập để lưu hóa đơn!');
      setShowAuthForm(true);
      return;
    }

    if (items.length === 0) {
      alert('Vui lòng thêm sản phẩm trước khi lưu!');
      return;
    }

    const name = billName.trim() || `Hóa đơn ${new Date().toLocaleDateString('vi-VN')}`;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      const token = getToken();
      const billData = {
        name,
        people: [...people],
        items: [...items],
        total,
        image: currentImage // THÊM: Gửi thông tin ảnh
      };

      if (currentBillId) {
        await api.updateBill(currentBillId, billData, token);
        alert('✅ Đã cập nhật hóa đơn thành công!');
      } else {
        await api.createBill(billData, token);
        alert('✅ Đã lưu hóa đơn thành công!');
      }
      
      await loadHistory();
      setBillName('');
      setCurrentBillId(null);
      setCurrentImage(null); // THÊM: Reset ảnh sau khi lưu
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Lỗi khi lưu hóa đơn: ' + error.message);
    }
  };

  const loadBill = (bill) => {
    setPeople(bill.people);
    setItems(bill.items);
    setBillName(bill.name);
    setCurrentBillId(bill._id);
    setCurrentImage(bill.image || null); // THÊM: Load ảnh từ bill
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBill = async (billId) => {
    if (confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
      try {
        const token = getToken();
        await api.deleteBill(billId, token);
        await loadHistory();
        alert('✅ Đã xóa hóa đơn!');
      } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Lỗi khi xóa: ' + error.message);
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await api.extractBill(base64Data, file.type);

      if (result.success) {
        // THÊM: Lưu thông tin ảnh từ Cloudinary
        if (result.image) {
          setCurrentImage({
            url: result.image.url,
            publicId: result.image.publicId,
            originalName: file.name
          });
        }

        // Thêm sản phẩm nếu có
        if (result.data.items && result.data.items.length > 0) {
          const newItems = result.data.items.map(item => ({
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 1,
            assignedTo: null
          }));
          setItems([...items, ...newItems]);
          alert(`✅ Đã thêm ${newItems.length} sản phẩm từ hóa đơn!`);
        } else {
          alert('⚠️ AI không tìm thấy sản phẩm nào trong hóa đơn.');
        }
      }

    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Lỗi khi đọc hóa đơn: ${error.message}`);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  // THÊM: Xử lý kéo thả file
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Kiểm tra file type
    if (!file.type.startsWith('image/')) {
      alert('⚠️ Vui lòng chỉ tải lên file ảnh!');
      return;
    }

    setIsProcessing(true);

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await api.extractBill(base64Data, file.type);

      if (result.success) {
        if (result.image) {
          setCurrentImage({
            url: result.image.url,
            publicId: result.image.publicId,
            originalName: file.name
          });
        }

        if (result.data.items && result.data.items.length > 0) {
          const newItems = result.data.items.map(item => ({
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 1,
            assignedTo: null
          }));
          setItems([...items, ...newItems]);
          alert(`✅ Đã thêm ${newItems.length} sản phẩm từ hóa đơn!`);
        } else {
          alert('⚠️ AI không tìm thấy sản phẩm nào trong hóa đơn.');
        }
      }

    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Lỗi khi đọc hóa đơn: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetBill = () => {
    setPeople(['']);
    setItems([]);
    setBillName('');
    setCurrentBillId(null);
    setCurrentImage(null); // THÊM: Reset ảnh
  };

  // --- NGƯỜI DÙNG & SẢN PHẨM LOGIC ---
  const addPerson = () => {
    if (newPersonName.trim()) {
      setPeople([...people, newPersonName.trim()]);
      setNewPersonName('');
      setShowAddPerson(false);
    }
  };

  const removePerson = (index) => {
    if (people.length > 1) {
      const newPeople = people.filter((_, i) => i !== index);
      setPeople(newPeople);
      setItems(items.map(item => ({
        ...item,
        assignedTo: item.assignedTo === index ? null : 
                    item.assignedTo > index ? item.assignedTo - 1 : item.assignedTo
      })));
    }
  };

  const addItem = () => {
    setItems([...items, {
      name: '',
      price: 0,
      quantity: 1,
      assignedTo: null
    }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSplit = () => {
    const sharedItems = items.filter(item => item.assignedTo === null);
    const sharedTotal = sharedItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    const sharedPerPerson = sharedTotal / people.length;

    return people.map((person, personIndex) => {
      const personalItems = items.filter(item => item.assignedTo === personIndex);
      const personalTotal = personalItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      return {
        name: person,
        shared: sharedPerPerson,
        personal: personalTotal,
        total: sharedPerPerson + personalTotal,
        personalItems: personalItems
      };
    });
  };

  const results = calculateSplit();
  const totalBill = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- RENDERING ---
  const bgColor = "bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800";
  const cardColor = "bg-white shadow-xl dark:bg-gray-700";
  const textColor = "text-gray-800 dark:text-gray-100";
  const headerTextColor = "text-gray-800 dark:text-white";
  const inputStyle = "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400";
  const itemCardStyle = "border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600";
  const buttonSecondaryStyle = "px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500";

  return (
    <div className={`min-h-screen flex flex-col ${bgColor} transition-colors duration-300`}>
      {/* Header */}
      <Header 
        user={user}
        onLogin={() => setShowAuthForm(true)}
        onLogout={logout}
        theme={theme}
        onThemeChange={saveThemeSetting}
      />

      {/* Auth Modal */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <AuthForm onClose={() => setShowAuthForm(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={resetBill}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <RefreshCw size={16} />
                  Hóa đơn mới
                </button>
                
                {isAuthenticated && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    <History size={18} />
                    Lịch sử ({history.length})
                  </button>
                )}
              </div>

              {!isAuthenticated && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  💡 <button 
                    onClick={() => setShowAuthForm(true)}
                    className="underline hover:text-green-600 dark:hover:text-green-400"
                  >
                    Đăng nhập
                  </button> để lưu hóa đơn
                </div>
              )}
            </div>
          </div>

          {/* History Panel - CẬP NHẬT: Hiển thị ảnh thumbnail */}
          {showHistory && isAuthenticated && (
            <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
              <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
                <FolderOpen className="text-blue-600 dark:text-blue-400" />
                Lịch sử hóa đơn
              </h2>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
                </div>
              ) : history.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Chưa có hóa đơn nào được lưu</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((bill) => (
                    <div key={bill._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                      {/* THÊM: Hiển thị ảnh thumbnail */}
                      {bill.image && bill.image.url && (
                        <div className="mb-3 relative group">
                          <img 
                            src={bill.image.url} 
                            alt={bill.name}
                            className="w-full h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <ImageIcon size={12} />
                            Có ảnh
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className={`font-bold ${headerTextColor}`}>{bill.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(bill.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {bill.total.toLocaleString('vi-VN')}đ
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {bill.items.length} sản phẩm • {bill.people.length} người
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => loadBill(bill)}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                          Tải lại
                        </button>
                        <button
                          onClick={() => deleteBill(bill._id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Image - CẬP NHẬT: Hỗ trợ kéo thả, chụp ảnh và upload */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
              <Camera className="text-purple-600 dark:text-purple-400" />
              Tự động đọc hóa đơn
            </h2>
            
            {/* THÊM: Preview ảnh đã upload */}
            {currentImage && currentImage.url && (
              <div className="mb-4 relative">
                <img 
                  src={currentImage.url} 
                  alt="Bill Preview" 
                  className="w-full max-h-80 object-contain rounded-lg border-2 border-green-500 dark:border-green-400"
                />
                <button
                  onClick={() => setCurrentImage(null)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                  title="Xóa ảnh"
                >
                  <X size={20} />
                </button>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <ImageIcon size={16} />
                    ✅ Ảnh đã lưu trên cloud
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentImage.originalName}
                  </p>
                </div>
              </div>
            )}
            
            {/* THÊM: Khu vực kéo thả với 2 nút riêng */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isProcessing 
                  ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800' 
                  : isDragging
                  ? 'border-green-500 bg-green-100 dark:bg-green-900/20 scale-105'
                  : 'border-green-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-gray-600'
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="animate-spin h-12 w-12 text-green-500 dark:text-green-400" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Đang upload và đọc hóa đơn...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI đang xử lý...</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-3 text-green-600 dark:text-green-400" size={48} />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {isDragging ? '📥 Thả ảnh vào đây' : 'Tải ảnh hóa đơn'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Gemini AI trích xuất 
                  </p>
                  
                  {/* THÊM: 2 nút riêng biệt cho chụp ảnh và upload */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                    {/* Nút chụp ảnh (chỉ trên mobile) */}
                    <label className="flex-1 w-full sm:w-auto">
                      <div className="cursor-pointer px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium flex items-center justify-center gap-2">
                        <Camera size={20} />
                        Chụp ảnh
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        disabled={isProcessing}
                        className="hidden"
                      />
                    </label>
                    
                    {/* Nút upload từ thư viện */}
                    <label className="flex-1 w-full sm:w-auto">
                      <div className="cursor-pointer px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center justify-center gap-2">
                        <Upload size={20} />
                        Tải ảnh lên
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isProcessing}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                    💡 Trên PC: Kéo thả ảnh vào khung này
                  </p>
                </>
              )}
            </div>
          </div>

          {/* People Management */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
              <Users className="text-blue-600 dark:text-blue-400" />
              Danh sách người ({people.length})
            </h2>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {people.map((person, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                  <span className="font-medium text-blue-800 dark:text-blue-300">{person}</span>
                  {people.length > 1 && (
                    <button
                      onClick={() => removePerson(index)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!showAddPerson ? (
              <button
                onClick={() => setShowAddPerson(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <Plus size={20} />
                Thêm người
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="Tên người..."
                  className={`flex-1 ${inputStyle}`}
                  autoFocus
                />
                <button
                  onClick={addPerson}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Thêm
                </button>
                <button
                  onClick={() => {
                    setShowAddPerson(false);
                    setNewPersonName('');
                  }}
                  className={buttonSecondaryStyle}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${headerTextColor} mb-4`}>Danh sách sản phẩm</h2>
            
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className={itemCardStyle}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Tên sản phẩm"
                      className={`md:col-span-4 ${inputStyle}`}
                    />
                    
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Giá"
                      className={`md:col-span-2 ${inputStyle}`}
                    />
                    
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                      placeholder="SL"
                      className={`md:col-span-2 ${inputStyle}`}
                    />
                    
                    <select
                      value={item.assignedTo === null ? 'shared' : item.assignedTo}
                      onChange={(e) => updateItem(index, 'assignedTo', e.target.value === 'shared' ? null : parseInt(e.target.value))}
                      className={`md:col-span-3 ${inputStyle}`}
                    >
                      <option value="shared">🤝 Chia chung</option>
                      {people.map((person, pIndex) => (
                        <option key={pIndex} value={pIndex}>
                          👤 {person}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => removeItem(index)}
                      className="md:col-span-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className={`mt-2 text-right text-sm font-semibold ${textColor}`}>
                    Thành tiền: {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
            >
              <Plus size={20} />
              Thêm sản phẩm thủ công
            </button>
          </div>

          {/* Save Bill */}
          {items.length > 0 && (
            <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
              <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
                <Save className="text-orange-600 dark:text-orange-400" />
                {currentBillId ? 'Cập nhật hóa đơn' : 'Lưu hóa đơn'}
              </h2>
              
              {!isAuthenticated && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Bạn cần đăng nhập để lưu hóa đơn. 
                  <button 
                    onClick={() => setShowAuthForm(true)}
                    className="ml-2 underline hover:text-yellow-900 dark:hover:text-yellow-100 font-medium"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  placeholder={`Hóa đơn ${new Date().toLocaleDateString('vi-VN')}`}
                  className={`flex-1 px-4 py-3 ${inputStyle}`}
                  disabled={!isAuthenticated}
                />
                <button
                  onClick={saveBill}
                  disabled={!isAuthenticated}
                  className={`px-6 py-3 rounded-lg transition font-medium flex items-center gap-2 ${
                    isAuthenticated 
                      ? 'bg-orange-500 text-white hover:bg-orange-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save size={20} />
                  {currentBillId ? 'Cập nhật' : 'Lưu'}
                </button>
              </div>
            </div>
          )}

          {/* Results - CẬP NHẬT: Sẽ in kèm ảnh */}
          {items.length > 0 && (
            <div className={`${cardColor} rounded-2xl p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${headerTextColor}`}>Kết quả</h2>
                <button
                  onClick={handlePrintResult}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  <Printer size={18} />
                  In kết quả {currentImage ? '(có ảnh)' : ''}
                </button>
              </div>

              <div ref={resultRef}>
                {/* Tổng hóa đơn */}
                <div className="mb-6">
                  <h2 className={`text-lg font-bold ${headerTextColor} mb-3`}>Tổng hóa đơn</h2>
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tổng cộng (Đã bao gồm VAT)</div>
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {totalBill.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kết quả chia tiền */}
                <div className="mb-4">
                  <h2 className={`text-lg font-bold ${headerTextColor} mb-3`}>Kết quả chia tiền</h2>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`text-lg font-bold ${headerTextColor}`}>{result.name}</h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {result.total.toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Phần chia chung ({people.length} người):</span>
                            <span className="font-semibold">{result.shared.toLocaleString('vi-VN')}đ</span>
                          </div>
                          
                          {result.personal > 0 && (
                            <>
                              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Sản phẩm riêng:</span>
                                <span className="font-semibold">{result.personal.toLocaleString('vi-VN')}đ</span>
                              </div>
                              
                              <div className="mt-2 pl-4 border-l-2 border-blue-300 dark:border-blue-500">
                                {result.personalItems.map((item, idx) => (
                                  <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    • {item.name} x{item.quantity} = {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}