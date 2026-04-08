import React, { useState, useCallback, useRef } from 'react';
import { Upload, Users, Plus, Trash2, History, Camera, Save, RefreshCw, X, Image as ImageIcon, Eye, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithTokenCheck } from '../api/apiInterceptor';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const api = {
  async extractBill(imageBase64, mimeType) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/gemini/extract`, {
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

  async createBill(billData, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(billData)
    });
    if (!response.ok) throw new Error('Failed to create bill');
    return response.json();
  },

  async getBills(token, startDate, endDate, limit = 50, skip = 0) {
    const params = new URLSearchParams({ limit, skip });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch bills');
    return response.json();
  },

  async updateBill(billId, billData, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills/${billId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(billData)
    });
    if (!response.ok) throw new Error('Failed to update bill');
    return response.json();
  },

  async deleteBill(billId, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills/${billId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete bill');
    return response.json();
  },

  async uploadExportedImage(imageBase64, billId, token) {
    const response = await fetchWithTokenCheck(`${API_BASE_URL}/bills/upload-exported-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ imageBase64, billId })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
};

export default function SplitBillView({ history = [], onHistoryUpdate }) {
  const { user, people, updatePeople, getToken, isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [billName, setBillName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentBillId, setCurrentBillId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [exportedImage, setExportedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const resultRef = useRef(null);
  const fileInputRef = useRef(null);

  // === STYLES ===
  const inputStyle = "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400";
  const itemCardStyle = "border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600";
  const cardColor = "bg-white shadow-xl dark:bg-gray-700";
  const textColor = "text-gray-800 dark:text-gray-100";
  const headerTextColor = "text-gray-800 dark:text-white";
  const buttonSecondaryStyle = "px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500";

  // === EXPORT IMAGE ===
  const handleExportImage = async () => {
    const results = calculateSplit();
    const sharedItems = items.filter(item => item.assignedTo.length === 0);

    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif; text-align: center;
    `;
    loadingMsg.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 10px;">🔄 Đang xuất hóa đơn...</div>
      <div style="font-size: 12px; color: #ccc;">Vui lòng đợi trong giây lát</div>
    `;
    document.body.appendChild(loadingMsg);

    try {
      const convertImageToBase64 = async (url) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.warn('Failed to convert image to base64:', url, error);
          return url;
        }
      };

      const imagesToExport = (images && images.length > 0) ? images : (currentImage ? [currentImage] : []);
      const imagesWithBase64 = await Promise.all(
        imagesToExport.map(async (img, index) => ({
          ...img,
          base64: await convertImageToBase64(img.url),
          index: index + 1
        }))
      );

      const imagesHtml = imagesWithBase64.map((img) => `
        <div style="width: 100%; margin-bottom: 20px; page-break-inside: avoid;">
          <h3 style="font-size: 16px; color: #2563eb; border-bottom: 2px solid #e5e7eb; margin-bottom: 10px; padding-bottom: 5px;">
            📷 Ảnh hóa đơn ${imagesWithBase64.length > 1 ? `#${img.index}` : ''}
          </h3>
          <div style="width: 100%; display: flex; justify-content: center; background: #f9fafb; padding: 10px; border-radius: 8px;">
            <img src="${img.base64}" alt="Bill ${img.index}" style="max-width: 100%; max-height: 400px; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          </div>
        </div>
      `).join('');

      const container = document.createElement('div');
      container.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 800px; background: white; font-family: "Segoe UI", Arial, sans-serif;';

      container.innerHTML = `
        <div style="color: #1f2937; padding: 30px; line-height: 1.5;">
          <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #10b981;">
            <h1 style="font-size: 28px; color: #059669; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">🧾 ${billName || 'Hóa đơn thanh toán'}</h1>
            <div style="font-size: 14px; color: #6b7280; margin: 5px 0;">📅 ${new Date().toLocaleDateString('vi-VN')} | 👥 ${people.length} người | 🛒 ${items.length} món</div>
          </div>
          ${imagesHtml}
          <div style="margin: 25px 0;">
            <h2 style="font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">📋 Chi tiết sản phẩm</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; background: white;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db; color: #374151; font-weight: bold; width: 35%;">Tên món</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #d1d5db; color: #374151; font-weight: bold; width: 10%;">SL</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db; color: #374151; font-weight: bold; width: 15%;">Đơn giá</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db; color: #374151; font-weight: bold; width: 15%;">Thành tiền</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #d1d5db; color: #374151; font-weight: bold; width: 25%;">Người trả</th>
                </tr>
              </thead>
              <tbody>
              ${items.map(item => {
                const numPeople = item.assignedTo.length || people.length;
                const sharedWith = item.assignedTo.length === 0
                  ? '<span style="color:#2563eb">Tất cả</span>'
                  : item.assignedTo.length === 1
                    ? `<b>${people[item.assignedTo[0]]}</b>`
                    : `${item.assignedTo.length} người`;
                return `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px;">${item.name}</td>
                    <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right;">${item.price.toLocaleString('vi-VN')}</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold;">${(item.price * item.quantity).toLocaleString('vi-VN')}</td>
                    <td style="padding: 10px; text-align: center; font-size: 12px;">
                      <div>${sharedWith}</div>
                      <div style="color:#10b981; margin-top: 3px;">(${((item.price * item.quantity) / numPeople).toLocaleString('vi-VN')}/ng)</div>
                    </td>
                  </tr>`;
              }).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin: 25px 0;">
            <h2 style="font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">💰 Kết quả chia tiền</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${results.map(result => `
              <div style="background: #fcfdfc; border: 2px solid #10b981; border-radius: 10px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px dashed #10b981;">
                  <div style="font-size: 16px; font-weight: bold; color: #065f46;">${result.name}</div>
                  <div style="font-size: 18px; font-weight: bold; color: #059669;">${result.total.toLocaleString('vi-VN')}đ</div>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px;">
                  <span>🤝 Chia chung</span>
                  <strong>${result.shared.toLocaleString('vi-VN')}đ</strong>
                </div>
                ${sharedItems.length > 0 ? `
                  <div style="margin-top: 5px; padding: 8px; background: #f0fdf4; border-radius: 6px; margin-bottom: 8px;">
                    ${sharedItems.map(item => `
                      <div style="font-size: 11px; color: #4b5563; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>• ${item.name} (x${item.quantity})</span>
                        <span>${((item.price * item.quantity) / people.length).toLocaleString('vi-VN')}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                ${result.personal > 0 ? `<div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; margin-top: 8px;"><span>👤 Riêng</span><strong>${result.personal.toLocaleString('vi-VN')}đ</strong></div>` : ''}
                ${result.personalItems.length > 0 ? `
                  <div style="margin-top: 5px; padding: 8px; background: #f9fafb; border-radius: 6px;">
                    ${result.personalItems.map(item => {
                      const qtyForPerson = item.useCustom ? (item.customQuantities[result.personIndex] || 0) : item.quantity / item.assignedTo.length;
                      const amountForPerson = item.useCustom ? (item.price * qtyForPerson) : ((item.price * item.quantity) / item.assignedTo.length);
                      return `<div style="font-size: 11px; color: #4b5563; margin-bottom: 4px; display: flex; justify-content: space-between;"><span>• ${item.name} ${item.useCustom ? `(x${qtyForPerson.toFixed(3)})` : `(x${item.quantity})`}</span><span>${amountForPerson.toLocaleString('vi-VN')}</span></div>`;
                    }).join('')}
                  </div>` : ''}
              </div>
            `).join('')}
            </div>
          </div>
          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; padding-top: 15px;">
            App chia tiền - Xuất lúc ${new Date().toLocaleString('vi-VN')}
          </div>
        </div>
      `;

      document.body.appendChild(container);

      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await window.html2canvas(container, {
        scale: 2,
        useCORS: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        windowWidth: 800,
        imageTimeout: 0,
        removeContainer: false
      });

      canvas.toBlob(async (blob) => {
        try {
          if (isAuthenticated) {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64String = reader.result;
              const token = getToken();
              const uploadResult = await api.uploadExportedImage(base64String, currentBillId, token);
              setExportedImage(uploadResult.imageData);
              if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
              alert(`✅ Đã xuất hóa đơn thành công!\n\n🔗 URL: ${uploadResult.imageData.url}\n\n💡 Ảnh đã bao gồm ${imagesWithBase64.length} ảnh hóa đơn gốc`);
            };
            reader.readAsDataURL(blob);
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hoa-don-${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
            alert(`✅ Đã xuất hóa đơn thành công!\n\n💾 Ảnh đã được tải về máy của bạn\n\n💡 Tên file: hoa-don-${new Date().toISOString().split('T')[0]}.png\n\n💡 Ảnh đã bao gồm ${imagesWithBase64.length} ảnh hóa đơn gốc`);
          }
        } catch (error) {
          console.error('Export error:', error);
          if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
          alert('❌ Lỗi khi xuất ảnh: ' + error.message + '\n\nVui lòng thử lại.');
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Export error:', error);
      if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
      alert('❌ Lỗi khi xuất ảnh: ' + error.message);
    } finally {
      const containers = document.querySelectorAll('div[style*="position: fixed; left: -9999px"]');
      containers.forEach(c => { if (document.body.contains(c)) document.body.removeChild(c); });
    }
  };

  // === API CALLS ===
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setIsLoading(true);
    try {
      const token = getToken();
      await api.getBills(token);
      onHistoryUpdate?.();
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getToken, onHistoryUpdate]);

  const saveBill = async () => {
    if (!isAuthenticated) { alert('⚠️ Bạn cần đăng nhập để lưu hóa đơn!'); return; }
    if (items.length === 0) { alert('⚠️ Vui lòng thêm ít nhất một sản phẩm trước khi lưu!'); return; }

    const invalidItems = [];
    const validItems = items.filter((item, index) => {
      const hasName = item.name && item.name.trim() !== '';
      const hasPrice = item.price > 0;
      const hasQuantity = item.quantity > 0;
      if (!hasName || !hasPrice || !hasQuantity) {
        invalidItems.push({
          index: index + 1,
          name: item.name || '(Chưa có tên)',
          issues: [!hasName && 'thiếu tên', !hasPrice && 'chưa nhập giá', !hasQuantity && 'số lượng không hợp lệ'].filter(Boolean)
        });
        return false;
      }
      return true;
    });

    if (invalidItems.length > 0) {
      const itemsList = invalidItems.map(item => `  • Món ${item.index}: ${item.name} - ${item.issues.join(', ')}`).join('\n');
      const message = `⚠️ Phát hiện ${invalidItems.length} món hàng chưa điền đầy đủ thông tin:\n\n${itemsList}\n\n` +
        `${validItems.length > 0 ? `✅ Bạn có muốn lưu ${validItems.length} món hợp lệ và bỏ qua các món thiếu thông tin không?` : '❌ Không có món hàng nào hợp lệ để lưu!'}`;
      if (validItems.length === 0) { alert(message); return; }
      if (!confirm(message)) return;
    }

    const name = billName.trim() || `Hóa đơn ${new Date().toLocaleDateString('vi-VN')}`;
    if (!billName.trim()) {
      if (!confirm(`📝 Bạn chưa đặt tên cho hóa đơn.\n\nHệ thống sẽ tự động đặt tên: "${name}"\n\nBấm OK để tiếp tục, hoặc Cancel để quay lại đặt tên.`)) return;
    }

    const total = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      const token = getToken();
      const billData = {
        name,
        people: [...people],
        items: validItems.map(item => ({
          name: item.name.trim(),
          price: parseFloat(item.price) || 0,
          quantity: parseFloat(item.quantity) || 1,
          assignedTo: Array.isArray(item.assignedTo) ? item.assignedTo : [],
          customQuantities: item.customQuantities || {},
          useCustom: item.useCustom || false
        })),
        total,
        images,
        image: images[0] || null,
        exportedImage
      };

      if (currentBillId) {
        await api.updateBill(currentBillId, billData, token);
        alert(`✅ Đã cập nhật hóa đơn thành công!\n\n📋 Tên: ${name}\n🛒 Sản phẩm: ${validItems.length} món\n💰 Tổng tiền: ${total.toLocaleString('vi-VN')}đ`);
      } else {
        await api.createBill(billData, token);
        alert(`✅ Đã lưu hóa đơn thành công!\n\n📋 Tên: ${name}\n🛒 Sản phẩm: ${validItems.length} món\n💰 Tổng tiền: ${total.toLocaleString('vi-VN')}đ`);
      }

      setItems(validItems);
      await loadHistory();
      // ✅ GIỮ ẢNH để user có thể xuất sau khi lưu
      // setBillName('');  // GIỮ tên để user còn biết tên hóa đơn
      // setCurrentBillId(null);
      // setImages([]);      // GIỮ để xuất ảnh
      // setCurrentImage(null);
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Lỗi khi lưu hóa đơn!\n\n' + error.message + '\n\nVui lòng thử lại sau.');
    }
  };

  const loadBill = (bill) => {
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
    setExportedImage(bill.exportedImage || null);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBill = async (billId) => {
    if (!isAuthenticated) { alert('❌ Bạn cần đăng nhập để xóa hóa đơn!'); return; }
    if (confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
      try {
        const token = getToken();
        await api.deleteBill(billId, token);
        await loadHistory();
        alert('✅ Đã xóa hóa đơn!');
      } catch (error) {
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
          const newImg = { url: result.image.url, publicId: result.image.publicId, originalName: file.name };
          setImages(prev => [...prev, newImg]);
          setCurrentImage(newImg);
        }
        if (result.data.items && result.data.items.length > 0) {
          const newItems = result.data.items.map(item => ({
            name: item.name, price: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 1, assignedTo: [], customQuantities: {}, useCustom: false
          }));
          setItems(prev => [...prev, ...newItems]);
          alert(`✅ Đã thêm ${newItems.length} sản phẩm từ hóa đơn!`);
        } else {
          alert('⚠️ AI không tìm thấy sản phẩm nào trong hóa đơn.');
        }
      }
    } catch (error) {
      alert(`❌ Lỗi khi đọc hóa đơn: ${error.message}`);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setCurrentImage(newImages.length > 0 ? newImages[newImages.length - 1] : null);
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
          const newImg = { url: result.image.url, publicId: result.image.publicId, originalName: file.name };
          setImages(prev => [...prev, newImg]);
          setCurrentImage(newImg);
        }
        if (result.data.items && result.data.items.length > 0) {
          const newItems = result.data.items.map(item => ({
            name: item.name, price: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 1, assignedTo: [], customQuantities: {}, useCustom: false
          }));
          setItems(prev => [...prev, ...newItems]);
          alert(`✅ Đã thêm ${newItems.length} sản phẩm từ hóa đơn!`);
        }
      }
    } catch (error) {
      alert(`❌ Lỗi khi đọc hóa đơn: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetBill = () => {
    setItems([]); setBillName(''); setCurrentBillId(null); setImages([]); setCurrentImage(null); setExportedImage(null);
  };

  // === PEOPLE / ITEMS LOGIC ===
  const addPerson = () => {
    if (newPersonName.trim()) {
      updatePeople([...people, newPersonName.trim()]);
      setNewPersonName('');
      setShowAddPerson(false);
    }
  };

  const removePerson = (index) => {
    if (people.length > 1) {
      const newPeople = people.filter((_, i) => i !== index);
      updatePeople(newPeople);
      setItems(items.map(item => ({
        ...item,
        assignedTo: item.assignedTo.filter(p => p !== index).map(p => p > index ? p - 1 : p),
        customQuantities: Object.fromEntries(
          Object.entries(item.customQuantities || {})
            .filter(([key]) => parseInt(key) !== index)
            .map(([key, value]) => [parseInt(key) > index ? parseInt(key) - 1 : parseInt(key), value])
        )
      })));
    }
  };

  const addItem = () => setItems([...items, { name: '', price: 0, quantity: 1, assignedTo: [], customQuantities: {}, useCustom: false }]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const togglePersonForItem = (itemIndex, personIndex) => {
    const newItems = [...items];
    const currentAssigned = newItems[itemIndex].assignedTo;
    if (currentAssigned.includes(personIndex)) {
      newItems[itemIndex].assignedTo = currentAssigned.filter(p => p !== personIndex);
      if (newItems[itemIndex].customQuantities) delete newItems[itemIndex].customQuantities[personIndex];
    } else {
      newItems[itemIndex].assignedTo = [...currentAssigned, personIndex];
      if (newItems[itemIndex].useCustom) {
        const numPeople = currentAssigned.length + 1;
        const avgQty = newItems[itemIndex].quantity / numPeople;
        newItems[itemIndex].customQuantities = newItems[itemIndex].customQuantities || {};
        newItems[itemIndex].customQuantities[personIndex] = avgQty;
      }
    }
    setItems(newItems);
  };

  const setAllPeopleForItem = (itemIndex) => {
    const newItems = [...items];
    newItems[itemIndex].assignedTo = [];
    newItems[itemIndex].customQuantities = {};
    newItems[itemIndex].useCustom = false;
    setItems(newItems);
  };

  const toggleCustomMode = (itemIndex) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    if (!item.useCustom) {
      const numPeople = item.assignedTo.length || people.length;
      const avgQty = item.quantity / numPeople;
      item.customQuantities = {};
      if (item.assignedTo.length === 0) {
        people.forEach((_, idx) => { item.customQuantities[idx] = avgQty; });
      } else {
        item.assignedTo.forEach((personIdx) => { item.customQuantities[personIdx] = avgQty; });
      }
      item.useCustom = true;
    } else {
      item.useCustom = false;
      item.customQuantities = {};
    }
    setItems(newItems);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const updateCustomQuantity = (itemIndex, personIndex, value) => {
    const newItems = [...items];
    const qty = parseFloat(value) || 0;
    newItems[itemIndex].customQuantities = newItems[itemIndex].customQuantities || {};
    newItems[itemIndex].customQuantities[personIndex] = qty;
    const totalCustomQty = Object.values(newItems[itemIndex].customQuantities).reduce((sum, q) => sum + q, 0);
    newItems[itemIndex].quantity = totalCustomQty;
    setItems(newItems);
  };

  const calculateSplit = () => {
    const sharedItems = items.filter(item => item.assignedTo.length === 0);
    const sharedTotal = sharedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const sharedPerPerson = sharedTotal / people.length;
    return people.map((person, personIndex) => {
      const personalItems = items.filter(item => item.assignedTo.includes(personIndex));
      const personalTotal = personalItems.reduce((sum, item) => {
        if (item.useCustom) {
          return sum + (item.price * (item.customQuantities[personIndex] || 0));
        } else {
          return sum + (item.price * item.quantity) / item.assignedTo.length;
        }
      }, 0);
      return { name: person, shared: sharedPerPerson, personal: personalTotal, total: sharedPerPerson + personalTotal, personalItems, personIndex };
    });
  };

  const results = calculateSplit();
  const totalBill = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // === RENDER ===
  return (
    <div className="space-y-6">

      {/* Action Buttons */}
      <div className={`${cardColor} rounded-2xl p-6`}>
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2">
            <button onClick={resetBill} className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm">
              <RefreshCw size={16} />Hóa đơn mới
            </button>
            {isAuthenticated && (
              <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                <History size={18} />Lịch sử ({history.length})
              </button>
            )}
          </div>
          {!isAuthenticated && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              💡 Đăng nhập để lưu hóa đơn
            </div>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && isAuthenticated && (
        <div className={`${cardColor} rounded-2xl p-6`}>
          <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
            📋 Lịch sử hóa đơn
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
                    <div>
                      <h3 className={`font-bold ${headerTextColor}`}>{bill.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(bill.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">{bill.total.toLocaleString('vi-VN')}đ</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{bill.items.length} sản phẩm • {bill.people.length} người</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => loadBill(bill)} className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">Tải lại</button>
                    <button onClick={() => deleteBill(bill._id)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Image */}
      <div className={`${cardColor} rounded-2xl p-6`}>
        <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
          <Camera className="text-purple-600 dark:text-purple-400" />Tự động đọc hóa đơn
        </h2>

        {images.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-full h-48 md:h-56 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-2">
                    <img src={img.url} alt={`Bill ${index + 1}`} className="w-full h-full object-contain" />
                  </div>
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

        <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isProcessing ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800' : isDragging ? 'border-green-500 bg-green-100 dark:bg-green-900/20 scale-105' : 'border-green-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-gray-600'}`}>
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="animate-spin h-12 w-12 text-green-500 dark:text-green-400" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">Đang upload và đọc hóa đơn...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI đang xử lý...</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto mb-3 text-green-600 dark:text-green-400" size={48} />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">{isDragging ? '📥 Thả ảnh vào đây' : 'Tải thêm ảnh hóa đơn'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bạn có thể upload nhiều ảnh cùng lúc</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                <label className="flex-1 w-full sm:w-auto">
                  <div className="cursor-pointer px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium flex items-center justify-center gap-2">
                    <Camera size={20} />Chụp ảnh
                  </div>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} disabled={isProcessing} className="hidden" />
                </label>
                <label className="flex-1 w-full sm:w-auto">
                  <div className="cursor-pointer px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center justify-center gap-2">
                    <Upload size={20} />Tải ảnh lên
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={isProcessing} className="hidden" />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* People Management */}
      <div className={`${cardColor} rounded-2xl p-6`}>
        <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
          <Users className="text-blue-600 dark:text-blue-400" />Danh sách người ({people.length})
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {people.map((person, index) => (
            <div key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
              <span className="font-medium text-blue-800 dark:text-blue-300">{person}</span>
              {people.length > 1 && (
                <button onClick={() => removePerson(index)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!showAddPerson ? (
          <button onClick={() => setShowAddPerson(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            <Plus size={20} />Thêm người
          </button>
        ) : (
          <div className="flex gap-2">
            <input type="text" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addPerson()} placeholder="Tên người..." className={`flex-1 ${inputStyle}`} autoFocus />
            <button onClick={addPerson} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Thêm</button>
            <button onClick={() => { setShowAddPerson(false); setNewPersonName(''); }} className={buttonSecondaryStyle}>Hủy</button>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className={`${cardColor} rounded-2xl p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${headerTextColor}`}>Danh sách sản phẩm</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{items.length} món</span>
        </div>

        {/* Desktop header */}
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

                {/* Tên sản phẩm */}
                <div className="md:col-span-4">
                  <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Tên món</label>
                  <input type="text" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} placeholder="Ví dụ: Cà phê sữa..." className={`w-full ${inputStyle}`} />
                </div>

                {/* Đơn giá */}
                <div className="md:col-span-2 relative">
                  <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Đơn giá</label>
                  <div className="relative">
                    <input type="number" value={item.price} onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} placeholder="0" className={`w-full ${inputStyle} pr-8 font-mono`} />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-bold">đ</span>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="md:col-span-2">
                  <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Số lượng</label>
                  <input type="text" inputMode="decimal" value={item.quantity} onChange={(e) => {
                    updateItem(index, 'quantity', e.target.value);
                  }} onBlur={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      updateItem(index, 'quantity', '');
                    } else {
                      const num = parseFloat(val);
                      if (isNaN(num) || num <= 0) {
                        updateItem(index, 'quantity', 1);
                      }
                    }
                  }} placeholder="0.5"
                    className={`w-full ${inputStyle} text-center ${item.useCustom ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                    disabled={item.useCustom} title={item.useCustom ? 'Số lượng tự động cập nhật từ chia custom' : ''} />
                </div>

                {/* Người trả */}
                <div className="md:col-span-3">
                  <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">Người trả tiền</label>
                  <div className="flex flex-wrap gap-1.5 bg-white dark:bg-gray-900/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-600">
                    <button onClick={() => setAllPeopleForItem(index)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${item.assignedTo.length === 0 ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'}`}>
                      Tất cả
                    </button>
                    {people.map((person, pIndex) => (
                      <label key={pIndex}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer select-none transition-colors border ${item.assignedTo.includes(pIndex)
                          ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                          : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}>
                        <input type="checkbox" checked={item.assignedTo.includes(pIndex)} onChange={() => togglePersonForItem(index, pIndex)} className="hidden" />
                        <span className={item.assignedTo.includes(pIndex) ? 'font-bold' : ''}>{person}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nút xóa */}
                <button onClick={() => removeItem(index)}
                  className="md:col-span-1 h-[42px] w-full md:w-auto flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-6 md:mt-0"
                  title="Xóa món này">
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Nút chia custom */}
              {item.assignedTo.length > 0 && (
                <div className="mb-3">
                  <button onClick={() => toggleCustomMode(index)}
                    className={`w-full px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium ${item.useCustom
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400 dark:from-gray-600 dark:to-gray-700 dark:text-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-800'}`}>
                    {item.useCustom ? <><span className="text-base">🔄</span><span>Chia đều số lượng</span></> : <><span className="text-base">🔢</span><span>Chia số lượng riêng cho từng người</span></>}
                  </button>
                </div>
              )}

              {/* Panel custom quantities */}
              {item.useCustom && (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-lg mb-3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <span className="text-base">👥</span>Chia số lượng riêng ({item.assignedTo.length} người)
                    </h4>
                    <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full font-medium">Tự động cập nhật</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {item.assignedTo.map(personIdx => {
                      const qty = item.customQuantities[personIdx] || 0;
                      const amount = item.price * qty;
                      return (
                        <div key={personIdx} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-700 hover:shadow-md transition-shadow">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {people[personIdx].charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mb-1">{people[personIdx]}</div>
                            <div className="flex items-center gap-2">
                              <input type="number" value={qty} onChange={(e) => updateCustomQuantity(index, personIdx, e.target.value)}
                                className="flex-1 px-3 py-1 text-sm border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-center font-mono"
                                min="0" step="0.1" placeholder="0" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">x</span>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                            {amount.toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Tổng số lượng:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-800 px-3 py-1 rounded-full">{item.quantity}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      💡 Thay đổi số lượng sẽ tự động cập nhật tổng và hóa đơn
                    </div>
                  </div>
                </div>
              )}

              {/* Thành tiền dưới mỗi món */}
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-600 flex justify-between items-center text-sm">
                <span className="text-gray-400 text-xs italic flex items-center gap-1">
                  {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                  {item.useCustom && <span className="text-purple-500 text-xs">🔢</span>}
                </span>
                <span className={`font-bold ${textColor}`}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addItem} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-bold shadow-lg shadow-green-500/30 active:scale-95 transform duration-100">
          <Plus size={20} />Thêm món mới
        </button>
      </div>

      {/* Save Bill */}
      {items.length > 0 && (
        <div className={`${cardColor} rounded-2xl p-6`}>
          <h2 className={`text-xl font-bold ${headerTextColor} mb-4 flex items-center gap-2`}>
            <Save className="text-orange-600 dark:text-orange-400" />{currentBillId ? 'Cập nhật hóa đơn' : 'Lưu hóa đơn'}
          </h2>
          {!isAuthenticated && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Bạn cần đăng nhập để lưu hóa đơn.
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" value={billName} onChange={(e) => setBillName(e.target.value)} placeholder={`Hóa đơn ${new Date().toLocaleDateString('vi-VN')}`}
              className={`flex-1 px-4 py-3 ${inputStyle}`} disabled={!isAuthenticated} />
            <button onClick={saveBill} disabled={!isAuthenticated}
              className={`px-6 py-3 rounded-lg transition font-medium flex items-center gap-2 ${isAuthenticated ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
              <Save size={20} />{currentBillId ? 'Cập nhật' : 'Lưu'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {items.length > 0 && (
        <div className={`${cardColor} rounded-2xl p-6`} ref={resultRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${headerTextColor}`}>Kết quả</h2>
            <div className="flex gap-2">
              <button onClick={handleExportImage} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm">
                <ImageIcon size={18} />Xuất ảnh PNG {images.length > 0 ? `(${images.length} ảnh)` : ''}
              </button>
              {exportedImage && (
                <button onClick={() => window.open(exportedImage.url, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                  <Eye size={18} />Xem hóa đơn đã xuất
                </button>
              )}
            </div>
          </div>

          {/* Tổng hóa đơn */}
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${headerTextColor} mb-3`}>Tổng hóa đơn</h2>
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tổng cộng (Đã bao gồm VAT)</div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalBill.toLocaleString('vi-VN')}đ</div>
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
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.total.toLocaleString('vi-VN')}đ</div>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    {/* Chia chung */}
                    <div>
                      <div className="flex justify-between text-gray-700 dark:text-gray-300 font-medium bg-green-100 dark:bg-green-900/30 p-2 rounded-t-lg">
                        <span>🤝 Chia chung ({people.length} người):</span>
                        <span className="font-bold">{result.shared.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {items.filter(i => i.assignedTo.length === 0).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-b-lg border border-green-100 dark:border-green-900/30 shadow-sm">
                          {items.filter(i => i.assignedTo.length === 0).map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex justify-between items-center border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0 pb-1 last:pb-0">
                              <span>• {item.name} (x{item.quantity})</span>
                              <span className="font-mono text-green-600 dark:text-green-400">
                                {((item.price * item.quantity) / people.length).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sản phẩm riêng */}
                    {result.personal > 0 && (
                      <div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300 font-medium bg-blue-100 dark:bg-blue-900/30 p-2 rounded-t-lg">
                          <span>👤 Sản phẩm riêng:</span>
                          <span className="font-bold">{result.personal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-b-lg border border-blue-100 dark:border-blue-900/30 shadow-sm">
                          {result.personalItems.map((item, idx) => {
                            const qtyForPerson = item.useCustom ? (item.customQuantities[result.personIndex] || 0) : item.quantity / item.assignedTo.length;
                            const amountForPerson = item.useCustom ? (item.price * qtyForPerson) : ((item.price * item.quantity) / item.assignedTo.length);
                            return (
                              <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex justify-between items-center border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0 pb-1 last:pb-0">
                                <span>• {item.name} {item.useCustom ? `(x${qtyForPerson.toFixed(3)})` : `(x${item.quantity})`} {item.useCustom && <span className="text-purple-500">🔢</span>}</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400">{amountForPerson.toLocaleString('vi-VN')}đ</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}