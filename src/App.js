import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Users, Plus, Trash2, Calculator, History, Camera, Save, FolderOpen, Sun, Moon, Monitor, Printer, RefreshCw } from 'lucide-react';

// === KHAI BÁO CẤU HÌNH API GEMINI ===
const GEMINI_API_KEY = "AIzaSyCDHVPp8VjA34TiWsXsIwu1z8tcNsmMgCw"; 
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";
const PROMPT_TEXT = "Đây là hóa đơn từ siêu thị. Hãy trích xuất thông tin các sản phẩm và trả về ONLY JSON theo format sau (không thêm markdown, không thêm text khác):\n{\n  \"items\": [\n    {\"name\": \"tên sản phẩm\", \"price\": giá_sau_VAT, \"quantity\": số_lượng}\n  ]\n}\n\nLưu ý:\n- Lấy giá ĐÃ BAO GỒM VAT (cột \"Giá bán (có VAT)\")\n- Quantity là số ở cột SL hoặc số lượng\n- Bỏ qua các dòng không phải sản phẩm\n- Chỉ trả về JSON thuần, không có ```json hay text thừa";

// === STORAGE WRAPPER với fallback ===
const storage = {
  isClaudeStorage: typeof window !== 'undefined' && window.storage,
  
  async set(key, value) {
    if (this.isClaudeStorage) {
      return await window.storage.set(key, value);
    } else {
      // Fallback to localStorage
      localStorage.setItem(key, value);
      return { key, value };
    }
  },
  
  async get(key) {
    if (this.isClaudeStorage) {
      const result = await window.storage.get(key);
      return result ? { key, value: result.value } : null;
    } else {
      // Fallback to localStorage
      const value = localStorage.getItem(key);
      return value ? { key, value } : null;
    }
  },
  
  async delete(key) {
    if (this.isClaudeStorage) {
      return await window.storage.delete(key);
    } else {
      // Fallback to localStorage
      localStorage.removeItem(key);
      return { key, deleted: true };
    }
  },
  
  async list(prefix) {
    if (this.isClaudeStorage) {
      return await window.storage.list(prefix);
    } else {
      // Fallback to localStorage
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys };
    }
  }
};

// === COMPONENT CHÍNH ===

export default function BillSplitter() {
  const [people, setPeople] = useState(['Nguyễn Ngọc Tưởng', 'Dương Xuân Thắng']);
  const [items, setItems] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [billName, setBillName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [storageType, setStorageType] = useState('');
  const [theme, setTheme] = useState('system'); // 'light', 'dark', 'system'
  const resultRef = useRef(null);

  // Load history & theme from storage on mount
  useEffect(() => {
    const type = storage.isClaudeStorage ? 'Claude Storage (Persistent)' : 'LocalStorage (Browser)';
    setStorageType(type);
    loadHistory();
    loadThemeSetting();
  }, []);

  // --- THEME LOGIC ---

  const loadThemeSetting = async () => {
    const storedTheme = await storage.get('theme');
    const initialTheme = storedTheme ? storedTheme.value : 'system';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  };

  const saveThemeSetting = async (newTheme) => {
    setTheme(newTheme);
    await storage.set('theme', newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (currentTheme) => {
    const root = document.documentElement;
    
    // 1. Luôn đảm bảo nền HTML là trắng (cho light mode) và chữ đen,
    //    sau đó chỉ ghi đè khi cần dark mode.
    root.classList.remove('dark');
    root.classList.add('bg-white'); // Buộc nền HTML là trắng
    
    // 2. Thêm class 'dark' nếu cần (sẽ ghi đè bg-white thành dark:bg-gray-900)
    if (currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    }
  };

  useEffect(() => {
    // Listen for system theme changes if 'system' is selected
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
    // Áp dụng lại theme khi component mount để đảm bảo đồng bộ
    applyTheme(theme); 
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // --- INN ẨN LOGIC ---
  const handlePrintResult = () => {
    if (resultRef.current) {
      const printContents = resultRef.current.innerHTML;

      // Tạo cửa sổ in mới
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write('<html><head><title>Kết quả chia tiền</title>');
      
      // Đảm bảo CSS in ấn
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
                .bg-gradient-to-r { background: #f0fdf4 !important; } /* Light green background for items */
                .text-green-600 { color: #059669 !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .text-gray-600, .text-gray-500 { color: #4b5563 !important; }
            }
        </style>
      `);
      
      printWindow.document.write('</head><body><div class="print-area">');
      printWindow.document.write(printContents);
      printWindow.document.write('</div></body></html>');
      
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // --- HỆ THỐNG DỮ LIỆU ---

  const loadHistory = useCallback(async () => {
    try {
      const result = await storage.list('bill:');
      if (result && result.keys && result.keys.length > 0) {
        const bills = [];
        for (const key of result.keys) {
          try {
            const item = await storage.get(key);
            if (item && item.value) {
              bills.push(JSON.parse(item.value));
            }
          } catch (err) {
            console.error('Error loading bill:', key, err);
          }
        }
        setHistory(bills.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  }, []);

  const saveBill = async () => {
    if (items.length === 0) {
      alert('Vui lòng thêm sản phẩm trước khi lưu!');
      return;
    }

    const name = billName.trim() || `Hóa đơn ${new Date().toLocaleDateString('vi-VN')}`;
    const bill = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString(),
      people: [...people],
      items: [...items],
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    try {
      const result = await storage.set(`bill:${bill.id}`, JSON.stringify(bill));
      if (result) {
        alert('✅ Đã lưu hóa đơn thành công!');
        await loadHistory();
        setBillName('');
      } else {
        throw new Error('Storage operation failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Lỗi khi lưu hóa đơn: ' + error.message);
    }
  };

  const loadBill = (bill) => {
    setPeople(bill.people);
    setItems(bill.items);
    setBillName(bill.name);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBill = async (billId) => {
    if (confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
      try {
        const result = await storage.delete(`bill:${billId}`);
        if (result) {
          await loadHistory();
          alert('✅ Đã xóa hóa đơn!');
        } else {
          throw new Error('Delete operation failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Lỗi khi xóa: ' + error.message);
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
        alert('⚠️ Lỗi: API Key chưa được cấu hình. Vui lòng kiểm tra lại file code.');
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

      const body = JSON.stringify({
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data
                        }
                    },
                    {
                        text: PROMPT_TEXT
                    }
                ]
            }
        ]
      });

      const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body
      });

      const data = await response.json();
      
      if (data.error) {
          throw new Error(data.error.message || "Lỗi API Gemini không xác định.");
      }

      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error("Mô hình AI không trả về nội dung trích xuất.");
      }

      let parsed;
      try {
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : textContent.trim();
          parsed = JSON.parse(jsonString);
      } catch (parseError) {
          console.error('Lỗi Parse JSON:', parseError);
          throw new Error('Lỗi phân tích cú pháp JSON từ AI.');
      }

      if (parsed.items && parsed.items.length > 0) {
        const newItems = parsed.items.map(item => ({
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

    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Lỗi khi đọc hóa đơn: ${error.message}`);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
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

  // Màu nền cho chế độ Sáng (mặc định) và Tối (dark:...)
  const bgColor = "bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800";
  const cardColor = "bg-white shadow-xl dark:bg-gray-700";
  const textColor = "text-gray-800 dark:text-gray-100";
  const headerTextColor = "text-gray-800 dark:text-white";
  const inputStyle = "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400";
  const itemCardStyle = "border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600";
  const buttonSecondaryStyle = "px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500";

  return (
    // Thêm className="text-gray-800" để đảm bảo màu chữ mặc định là đen (Light mode)
    <div className={`min-h-screen ${bgColor} p-4 transition-colors duration-300 ${textColor}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header and Theme Switch */}
        <div className={`${cardColor} rounded-2xl p-6 mb-6 flex justify-between items-start`}>
          <div>
            <h1 className={`text-3xl font-bold ${headerTextColor} mb-2 flex items-center gap-2`}>
              <Calculator className="text-green-600 dark:text-green-400" />
              Chia Hóa Đơn Thông Minh
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Sử dụng Gemini AI để tự động đọc hóa đơn và chia tiền công bằng</p>
            
            {/* Storage Status */}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${storage.isClaudeStorage ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              {storageType}
            </div>
          </div>

          {/* Theme Switch & History Button */}
          <div className="flex flex-col items-end gap-2 mt-1">
            <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                    onClick={() => saveThemeSetting('light')}
                    className={`p-2 rounded-lg transition ${theme === 'light' ? 'bg-white shadow dark:bg-gray-600 text-yellow-500' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Giao diện Sáng"
                >
                    <Sun size={18} />
                </button>
                <button
                    onClick={() => saveThemeSetting('dark')}
                    className={`p-2 rounded-lg transition ${theme === 'dark' ? 'bg-white shadow dark:bg-gray-600 text-blue-500' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Giao diện Tối"
                >
                    <Moon size={18} />
                </button>
                <button
                    onClick={() => saveThemeSetting('system')}
                    className={`p-2 rounded-lg transition ${theme === 'system' ? 'bg-white shadow dark:bg-gray-600 text-purple-500' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Theo thiết bị"
                >
                    <Monitor size={18} />
                </button>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              <History size={18} />
              Lịch sử ({history.length})
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
              <FolderOpen className="text-blue-600 dark:text-blue-400" />
              Lịch sử hóa đơn
            </h2>
            
            {history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Chưa có hóa đơn nào được lưu</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((bill) => (
                  <div key={bill.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`font-bold ${headerTextColor}`}>{bill.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(bill.date).toLocaleString('vi-VN')}
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
                        onClick={() => deleteBill(bill.id)}
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

        {/* Upload Image */}
        <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
          <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
            <Camera className="text-purple-600 dark:text-purple-400" />
            Tự động đọc hóa đơn
          </h2>
          
          <label className="block">
            <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              isProcessing ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800' : 'border-green-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-gray-600'
            }`}>
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="animate-spin h-12 w-12 text-green-500 dark:text-green-400" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Đang đọc hóa đơn...</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-3 text-green-600 dark:text-green-400" size={48} />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Chụp hoặc tải ảnh hóa đơn
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sử dụng Gemini AI để trích xuất thông tin sản phẩm
                  </p>
                </>
              )}
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
              Lưu hóa đơn
            </h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                placeholder={`Hóa đơn ${new Date().toLocaleDateString('vi-VN')}`}
                className={`flex-1 px-4 py-3 ${inputStyle}`}
              />
              <button
                onClick={saveBill}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium flex items-center gap-2"
              >
                <Save size={20} />
                Lưu
              </button>
            </div>
          </div>
        )}

        {/* Results (for Print) */}
        {items.length > 0 && (
          <div className={`${cardColor} rounded-2xl p-6`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${headerTextColor}`}>Kết quả</h2>
                <button
                    onClick={handlePrintResult}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                >
                    <Printer size={18} />
                    In kết quả
                </button>
            </div>

            <div ref={resultRef}>
                {/* Tổng hóa đơn - New Section */}
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

                {/* Kết quả chia tiền - New Section */}
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
    </div>
  );
}