import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Users, Plus, Trash2, Calculator, History, Camera, Save, FolderOpen, RefreshCw, Printer, X, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AuthForm from './components/AuthForm';

// === CẤU HÌNH API BACKEND ===
const API_BASE_URL = process.env.REACT_APP_API_URL;

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
  
  // State quản lý ảnh
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const resultRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // --- PRINT LOGIC (FIX LỖI TRẮNG TRANG ĐẦU) ---
  const handlePrintResult = () => {
    const results = calculateSplit();

    // Tạo Iframe ẩn
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0', zIndex: '-1'
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Lấy danh sách ảnh cần in
    const imagesToPrint = (images && images.length > 0) 
      ? images 
      : (currentImage ? [currentImage] : []);

    // HTML cho ảnh
    const imagesHtml = imagesToPrint.map((img, index) => `
      <div class="image-wrapper">
        <h3>📷 Ảnh hóa đơn ${imagesToPrint.length > 1 ? `#${index + 1}` : ''}</h3>
        <div class="img-container">
          <img src="${img.url}" alt="Bill ${index + 1}" class="bill-image" />
        </div>
      </div>
    `).join('');

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${billName || 'Hóa đơn chia tiền'}</title>
        <style>
          /* RESET CSS để tránh margin thừa gây trắng trang */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          /* Cấu hình trang in */
          @page {
            size: A4;
            margin: 5mm; /* Margin nhỏ để tận dụng giấy */
          }

          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: white; 
            color: #1f2937; 
            width: 100%;
            /* Không set height 100% để tránh lỗi overflow */
            padding: 10px; 
          }
          
          /* Header */
          .header { text-align: center; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #10b981; }
          .header h1 { font-size: 20px; color: #059669; margin-bottom: 5px; text-transform: uppercase; }
          .header .info { font-size: 11px; color: #6b7280; margin: 2px 0; }
          
          /* Image Section */
          .image-wrapper {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 15px;
            page-break-inside: avoid; /* Cố gắng không cắt đôi ảnh */
          }
          
          /* Ngắt trang sau mỗi ảnh để gọn gàng */
          .image-wrapper { page-break-after: always; }
          .image-wrapper:last-of-type { page-break-after: auto; }

          .image-wrapper h3 {
             width: 100%; text-align: left; font-size: 13px; color: #2563eb; 
             border-bottom: 1px solid #e5e7eb; margin-bottom: 5px; padding-bottom: 2px;
          }

          .img-container {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          .bill-image {
            width: auto;
            max-width: 100%;
            /* QUAN TRỌNG: Giới hạn chiều cao 80vh để chừa chỗ cho Header ở trang 1 */
            /* Nếu để 100% hoặc quá lớn, nó sẽ đẩy sang trang 2 */
            max-height: 80vh; 
            object-fit: contain; 
            border: 1px solid #ddd;
            border-radius: 4px;
          }

          /* Content */
          .section { margin: 15px 0; page-break-inside: avoid; }
          .section-title { font-size: 15px; font-weight: bold; color: #2563eb; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
          
          table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 11px; }
          th { background: #f3f4f6; padding: 5px; text-align: left; border-bottom: 1px solid #d1d5db; color: #374151; font-weight: bold; }
          td { padding: 5px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
          
          .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .person-card { 
            background: #fcfdfc; border: 1px solid #10b981; border-radius: 6px; 
            padding: 8px; page-break-inside: avoid; box-shadow: 0 1px 1px rgba(0,0,0,0.05);
          }
          .person-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px dashed #10b981; }
          .person-name { font-size: 13px; font-weight: bold; color: #065f46; }
          .person-total { font-size: 14px; font-weight: bold; color: #059669; }
          .breakdown-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
          
          .item-list { margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e5e7eb; background: #f9fafb; padding: 4px; border-radius: 4px; }
          .item-detail { font-size: 10px; color: #4b5563; margin-bottom: 2px; display: flex; justify-content: space-between; }
          
          .footer { margin-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #9ca3af; padding-top: 5px; }

          @media print {
            body { margin: 0; padding: 0; }
            /* Đảm bảo bảng không bị cắt dòng giữa chừng */
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧾 ${billName || 'Hóa đơn thanh toán'}</h1>
          <div class="info">📅 ${new Date().toLocaleDateString('vi-VN')} | 👥 ${people.length} người | 🛒 ${items.length} món</div>
        </div>

        ${imagesHtml}

        <div class="section">
          <h2 class="section-title">📋 Chi tiết sản phẩm</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 35%">Tên món</th>
                <th style="width: 10%; text-align:center">SL</th>
                <th style="width: 15%; text-align:right">Đơn giá</th>
                <th style="width: 15%; text-align:right">Thành tiền</th>
                <th style="width: 25%; text-align:center">Người trả</th>
              </tr>
            </thead>
            <tbody>
            ${items.map(item => {
              const numPeople = item.assignedTo.length || people.length;
              const sharedWith = item.assignedTo.length === 0 
                ? `<span style="color:#2563eb">Tất cả</span>`
                : item.assignedTo.length === 1 
                  ? `<b>${people[item.assignedTo[0]]}</b>`
                  : `${item.assignedTo.length} người`;
              
              return `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td style="text-align:right">${item.price.toLocaleString('vi-VN')}</td>
                  <td style="text-align:right;font-weight:bold">${(item.price * item.quantity).toLocaleString('vi-VN')}</td>
                  <td style="text-align:center; font-size: 10px">
                    <div>${sharedWith}</div>
                    <div style="color:#10b981">(${((item.price * item.quantity) / numPeople).toLocaleString('vi-VN')}/ng)</div>
                  </td>
                </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">💰 Kết quả chia tiền</h2>
          <div class="grid-container">
          ${results.map(result => `
            <div class="person-card">
              <div class="person-header">
                <div class="person-name">${result.name}</div>
                <div class="person-total">${result.total.toLocaleString('vi-VN')}đ</div>
              </div>
              <div class="breakdown-row"><span>🤝 Chia chung</span><strong>${result.shared.toLocaleString('vi-VN')}đ</strong></div>
              ${result.personal > 0 ? `<div class="breakdown-row"><span>👤 Riêng</span><strong>${result.personal.toLocaleString('vi-VN')}đ</strong></div>` : ''}
              ${result.personalItems.length > 0 ? `
                <div class="item-list">
                  ${result.personalItems.map(item => `<div class="item-detail"><span>• ${item.name} (x${item.quantity})</span><span>${((item.price * item.quantity) / (item.assignedTo.length || 1)).toLocaleString('vi-VN')}</span></div>`).join('')}
                </div>` : ''}
            </div>
          `).join('')}
          </div>
        </div>
        <div class="footer">App chia tiền - In lúc ${new Date().toLocaleString('vi-VN')}</div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(content);
    doc.close();

    const doPrint = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
    };

    if (imagesToPrint.length > 0) {
      const imgElements = Array.from(doc.querySelectorAll('.bill-image'));
      let loadedCount = 0;
      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount >= imgElements.length) doPrint();
      };

      if (imgElements.length === 0) {
        doPrint();
      } else {
        imgElements.forEach(img => {
          if (img.complete) checkAllLoaded();
          else {
            img.onload = checkAllLoaded;
            img.onerror = checkAllLoaded;
          }
        });
        setTimeout(() => {
          if (document.body.contains(iframe) && loadedCount < imgElements.length) doPrint();
        }, 3000);
      }
    } else {
      doPrint();
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
        images: images, 
        image: images[0] || null 
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
      setImages([]); 
      setCurrentImage(null);
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
    if (bill.images && Array.isArray(bill.images)) {
      setImages(bill.images);
      setCurrentImage(bill.images[0] || null);
    } else if (bill.image) {
      setImages([bill.image]);
      setCurrentImage(bill.image);
    } else {
      setImages([]);
      setCurrentImage(null);
    }
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
        if (result.image) {
          const newImg = {
            url: result.image.url,
            publicId: result.image.publicId,
            originalName: file.name
          };
          setImages(prev => [...prev, newImg]);
          setCurrentImage(newImg);
        }
        if (result.data.items && result.data.items.length > 0) {
          const newItems = result.data.items.map(item => ({
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 1,
            assignedTo: []
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

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (newImages.length > 0) {
      setCurrentImage(newImages[newImages.length - 1]);
    } else {
      setCurrentImage(null);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('⚠️ Vui lòng chỉ tải lên file ảnh!'); return; }
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
          const newImg = {
            url: result.image.url,
            publicId: result.image.publicId,
            originalName: file.name
          };
          setImages(prev => [...prev, newImg]);
          setCurrentImage(newImg);
        }
        if (result.data.items && result.data.items.length > 0) {
          const newItems = result.data.items.map(item => ({
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 1,
            assignedTo: []
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
    setPeople(['']); setItems([]); setBillName(''); setCurrentBillId(null); setImages([]); setCurrentImage(null);
  };

  // --- Logic Người/Sản phẩm ---
  const addPerson = () => { if (newPersonName.trim()) { setPeople([...people, newPersonName.trim()]); setNewPersonName(''); setShowAddPerson(false); } };
  const removePerson = (index) => { if (people.length > 1) { const newPeople = people.filter((_, i) => i !== index); setPeople(newPeople); setItems(items.map(item => ({ ...item, assignedTo: item.assignedTo === index ? null : item.assignedTo > index ? item.assignedTo - 1 : item.assignedTo }))); } };
  const addItem = () => { setItems([...items, { name: '', price: 0, quantity: 1, assignedTo: [] }]); };
  const updateItem = (index, field, value) => { const newItems = [...items]; newItems[index][field] = value; setItems(newItems); };
  const togglePersonForItem = (itemIndex, personIndex) => { const newItems = [...items]; const currentAssigned = newItems[itemIndex].assignedTo; if (currentAssigned.includes(personIndex)) { newItems[itemIndex].assignedTo = currentAssigned.filter(p => p !== personIndex); } else { newItems[itemIndex].assignedTo = [...currentAssigned, personIndex]; } setItems(newItems); };
  const setAllPeopleForItem = (itemIndex) => { const newItems = [...items]; newItems[itemIndex].assignedTo = []; setItems(newItems); };
  const removeItem = (index) => { setItems(items.filter((_, i) => i !== index)); };
  
  const calculateSplit = () => {
    const sharedItems = items.filter(item => item.assignedTo.length === 0);
    const sharedTotal = sharedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const sharedPerPerson = sharedTotal / people.length;
    return people.map((person, personIndex) => {
      const personalItems = items.filter(item => item.assignedTo.includes(personIndex));
      const personalTotal = personalItems.reduce((sum, item) => sum + (item.price * item.quantity) / item.assignedTo.length, 0);
      return { name: person, shared: sharedPerPerson, personal: personalTotal, total: sharedPerPerson + personalTotal, personalItems: personalItems };
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
      <Header user={user} onLogin={() => setShowAuthForm(true)} onLogout={logout} theme={theme} onThemeChange={saveThemeSetting} />
      {showAuthForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"><AuthForm onClose={() => setShowAuthForm(false)} /></div></div>}

      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <button onClick={resetBill} className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"><RefreshCw size={16} />Hóa đơn mới</button>
                {isAuthenticated && <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"><History size={18} />Lịch sử ({history.length})</button>}
              </div>
              {!isAuthenticated && <div className="text-sm text-gray-600 dark:text-gray-400">💡 <button onClick={() => setShowAuthForm(true)} className="underline hover:text-green-600 dark:hover:text-green-400">Đăng nhập</button> để lưu hóa đơn</div>}
            </div>
          </div>

          {/* History Panel */}
          {showHistory && isAuthenticated && (
            <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
              <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}><FolderOpen className="text-blue-600 dark:text-blue-400" />Lịch sử hóa đơn</h2>
              {isLoading ? <div className="text-center py-8"><RefreshCw className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" /><p className="text-gray-500 dark:text-gray-400">Đang tải...</p></div> : history.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-center py-8">Chưa có hóa đơn nào được lưu</p> : 
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((bill) => (
                    <div key={bill._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                      {((bill.images && bill.images.length > 0) || (bill.image && bill.image.url)) && (
                        <div className="mb-3 relative group">
                          <img 
                            src={bill.images?.[0]?.url || bill.image?.url} 
                            alt={bill.name} 
                            className="w-full h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-600" 
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <ImageIcon size={12} />{bill.images?.length > 1 ? `${bill.images.length} ảnh` : 'Có ảnh'}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div><h3 className={`font-bold ${headerTextColor}`}>{bill.name}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{new Date(bill.createdAt).toLocaleString('vi-VN')}</p></div>
                        <div className="text-right"><div className="text-lg font-bold text-green-600 dark:text-green-400">{bill.total.toLocaleString('vi-VN')}đ</div><div className="text-xs text-gray-500 dark:text-gray-400">{bill.items.length} sản phẩm • {bill.people.length} người</div></div>
                      </div>
                      <div className="flex gap-2 mt-3"><button onClick={() => loadBill(bill)} className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">Tải lại</button><button onClick={() => deleteBill(bill._id)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><Trash2 size={16} /></button></div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* Upload Image Section - CẬP NHẬT UI GRID ĐẸP HƠN */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}><Camera className="text-purple-600 dark:text-purple-400" />Tự động đọc hóa đơn</h2>

            {/* Grid hiển thị ảnh (Mobile & Desktop) */}
            {images.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                      {/* Dùng object-contain và padding để hiển thị trọn vẹn hóa đơn dài */}
                      <div className="w-full h-48 md:h-56 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-2">
                         <img src={img.url} alt={`Bill ${index + 1}`} className="w-full h-full object-contain" />
                      </div>
                      
                      <div className="absolute top-0 left-0 w-full h-full bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      
                      <button onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 hover:scale-110 transition shadow-lg z-10" title="Xóa ảnh">
                        <X size={14} />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 p-2 text-xs truncate border-t border-gray-100 dark:border-gray-700">
                        <span className="font-medium text-gray-700 dark:text-gray-300">#{index + 1}</span> <span className="text-gray-500">{img.originalName}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                  <ImageIcon size={16} /> Đã tải lên {images.length} ảnh hóa đơn
                </div>
              </div>
            )}

            {/* Khu vực Drag & Drop */}
            <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isProcessing ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800' : isDragging ? 'border-green-500 bg-green-100 dark:bg-green-900/20 scale-105' : 'border-green-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-gray-600'}`}>
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3"><RefreshCw className="animate-spin h-12 w-12 text-green-500 dark:text-green-400" /><p className="text-gray-600 dark:text-gray-300 font-medium">Đang upload và đọc hóa đơn...</p><p className="text-sm text-gray-500 dark:text-gray-400">AI đang xử lý...</p></div>
              ) : (
                <>
                  <Upload className="mx-auto mb-3 text-green-600 dark:text-green-400" size={48} />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">{isDragging ? '📥 Thả ảnh vào đây' : 'Tải thêm ảnh hóa đơn'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bạn có thể upload nhiều ảnh cùng lúc</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                    <label className="flex-1 w-full sm:w-auto"><div className="cursor-pointer px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium flex items-center justify-center gap-2"><Camera size={20} />Chụp tiếp</div><input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} disabled={isProcessing} className="hidden" /></label>
                    <label className="flex-1 w-full sm:w-auto"><div className="cursor-pointer px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center justify-center gap-2"><Upload size={20} />Tải ảnh lên</div><input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={isProcessing} className="hidden" /></label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* People Management */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}><Users className="text-blue-600 dark:text-blue-400" />Danh sách người ({people.length})</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              {people.map((person, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full"><span className="font-medium text-blue-800 dark:text-blue-300">{person}</span>{people.length > 1 && <button onClick={() => removePerson(index)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 size={16} /></button>}</div>
              ))}
            </div>
            {!showAddPerson ? <button onClick={() => setShowAddPerson(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"><Plus size={20} />Thêm người</button> : <div className="flex gap-2"><input type="text" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addPerson()} placeholder="Tên người..." className={`flex-1 ${inputStyle}`} autoFocus /><button onClick={addPerson} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Thêm</button><button onClick={() => { setShowAddPerson(false); setNewPersonName(''); }} className={buttonSecondaryStyle}>Hủy</button></div>}
          </div>

          {/* Items List */}
          <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${headerTextColor}`}>Danh sách sản phẩm</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {items.length} món
              </span>
            </div>

            {/* --- THÊM: Hàng tiêu đề cho giao diện Desktop --- */}
            {items.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div className="col-span-4">Tên món</div>
                <div className="col-span-2">Đơn giá</div>
                <div className="col-span-2">Số lượng</div>
                <div className="col-span-3">Người trả</div>
                <div className="col-span-1 text-center">Xóa</div>
              </div>
            )}

            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className={`${itemCardStyle} transition-all duration-200 hover:shadow-md`}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    
                    {/* Cột 1: Tên sản phẩm */}
                    <div className="md:col-span-4">
                      <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Tên món</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Ví dụ: Cà phê sữa..."
                        className={`w-full ${inputStyle}`}
                      />
                    </div>

                    {/* Cột 2: Đơn giá (Thêm hậu tố đ) */}
                    <div className="md:col-span-2 relative">
                      <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Đơn giá</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className={`w-full ${inputStyle} pr-8 font-mono`} // pr-8 để chừa chỗ cho chữ đ
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-bold">đ</span>
                      </div>
                    </div>

                    {/* Cột 3: Số lượng */}
                    <div className="md:col-span-2">
                      <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Số lượng</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        placeholder="1"
                        className={`w-full ${inputStyle} text-center`}
                      />
                    </div>

                    {/* Cột 4: Checkbox người trả */}
                    <div className="md:col-span-3">
                      <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Người trả tiền</label>
                      <div className="flex flex-wrap gap-1.5 bg-white dark:bg-gray-900/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-600">
                        <button
                          onClick={() => setAllPeopleForItem(index)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            item.assignedTo.length === 0
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Tất cả
                        </button>
                        {people.map((person, pIndex) => (
                          <label
                            key={pIndex}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer select-none transition-colors border ${
                              item.assignedTo.includes(pIndex)
                                ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                                : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={item.assignedTo.includes(pIndex)}
                              onChange={() => togglePersonForItem(index, pIndex)}
                              className="hidden" // Ẩn checkbox mặc định đi cho đẹp
                            />
                            {/* Dùng màu chữ để báo hiệu đã chọn thay vì checkbox thô */}
                            <span className={item.assignedTo.includes(pIndex) ? 'font-bold' : ''}>{person}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Cột 5: Nút xóa */}
                    <button
                      onClick={() => removeItem(index)}
                      className="md:col-span-1 h-[42px] w-full md:w-auto flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-6 md:mt-0"
                      title="Xóa món này"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Thành tiền dưới mỗi món */}
                  <div className={`mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-600 flex justify-between items-center text-sm`}>
                       <span className="text-gray-400 text-xs italic">
                          {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                       </span>
                       <span className={`font-bold ${textColor}`}>
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                       </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-bold shadow-lg shadow-green-500/30 active:scale-95 transform duration-100"
            >
              <Plus size={20} /> Thêm món mới
            </button>
          </div>

          {/* Save Bill */}
          {items.length > 0 && (
            <div className={`${cardColor} rounded-2xl p-6 mb-6`}>
              <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}><Save className="text-orange-600 dark:text-orange-400" />{currentBillId ? 'Cập nhật hóa đơn' : 'Lưu hóa đơn'}</h2>
              {!isAuthenticated && <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">⚠️ Bạn cần đăng nhập để lưu hóa đơn.<button onClick={() => setShowAuthForm(true)} className="ml-2 underline hover:text-yellow-900 dark:hover:text-yellow-100 font-medium">Đăng nhập ngay</button></div>}
              <div className="flex gap-2"><input type="text" value={billName} onChange={(e) => setBillName(e.target.value)} placeholder={`Hóa đơn ${new Date().toLocaleDateString('vi-VN')}`} className={`flex-1 px-4 py-3 ${inputStyle}`} disabled={!isAuthenticated} /><button onClick={saveBill} disabled={!isAuthenticated} className={`px-6 py-3 rounded-lg transition font-medium flex items-center gap-2 ${isAuthenticated ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}><Save size={20} />{currentBillId ? 'Cập nhật' : 'Lưu'}</button></div>
            </div>
          )}

          {/* Results */}
          {items.length > 0 && (
            <div className={`${cardColor} rounded-2xl p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${headerTextColor}`}>Kết quả</h2>
                <button onClick={handlePrintResult} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"><Printer size={18} />In kết quả {images.length > 0 ? `(${images.length} ảnh)` : ''}</button>
              </div>
              <div ref={resultRef}>
                <div className="mb-6"><h2 className={`text-lg font-bold ${headerTextColor} mb-3`}>Tổng hóa đơn</h2><div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4"><div className="text-center"><div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tổng cộng (Đã bao gồm VAT)</div><div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalBill.toLocaleString('vi-VN')}đ</div></div></div></div>
                <div className="mb-4">
                  <h2 className={`text-lg font-bold ${headerTextColor} mb-3`}>Kết quả chia tiền</h2>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                        <div className="flex justify-between items-start mb-3"><h3 className={`text-lg font-bold ${headerTextColor}`}>{result.name}</h3><div className="text-right"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.total.toLocaleString('vi-VN')}đ</div></div></div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Phần chia chung ({people.length} người):</span><span className="font-semibold">{result.shared.toLocaleString('vi-VN')}đ</span></div>
                          {result.personal > 0 && (<><div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Sản phẩm riêng:</span><span className="font-semibold">{result.personal.toLocaleString('vi-VN')}đ</span></div><div className="mt-2 pl-4 border-l-2 border-blue-300 dark:border-blue-500">{result.personalItems.map((item, idx) => (<div key={idx} className="text-xs text-gray-500 dark:text-gray-400 mb-1">• {item.name} x{item.quantity} = {(item.price * item.quantity).toLocaleString('vi-VN')}đ</div>))}</div></>)}
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
      <Footer />
    </div>
  );
}