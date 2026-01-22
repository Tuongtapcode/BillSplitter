// Test đơn giản để kiểm tra logic export
console.log('🧪 Test logic export functionality...\n');

// Giả lập các giá trị
const isAuthenticated = true; // Test trường hợp đã đăng nhập
const images = [{ url: 'test-image.jpg' }];
const currentImage = null;
const currentBillId = null;

// Giả lập hàm getToken
const getToken = () => 'fake-token';

// Giả lập hàm setExportedImage
const setExportedImage = (data) => {
  console.log('📤 setExportedImage called with:', data);
};

// Giả lập api.uploadExportedImage
const api = {
  uploadExportedImage: async (base64, billId, token) => {
    console.log('☁️  Upload to Cloudinary would happen here');
    return {
      imageData: {
        url: 'https://cloudinary.com/fake-url.png',
        publicId: 'fake-public-id'
      }
    };
  }
};

// Giả lập calculateSplit
const calculateSplit = () => ({
  total: 60000,
  perPerson: 30000,
  breakdown: {}
});

// Giả lập items
const items = [
  { name: 'Cà phê sữa', price: 25000, assignedTo: ['Alice'] },
  { name: 'Bánh mì thịt', price: 35000, assignedTo: ['Bob'] }
];

// Test logic export
async function testExportLogic() {
  console.log('🔍 Testing export logic...\n');

  const results = calculateSplit();
  const sharedItems = items.filter(item => item.assignedTo.length === 0);

  console.log('📊 Results:', results);
  console.log('🔗 Shared items:', sharedItems);

  // Giả lập canvas.toBlob callback
  const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });

  const canvasToBlobCallback = async (blob) => {
    try {
      if (isAuthenticated) {
        console.log('✅ User is authenticated - would upload to Cloudinary');
        // Logic upload lên Cloudinary
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          console.log('📤 Base64 string length:', base64String.length);

          const token = getToken();
          const uploadResult = await api.uploadExportedImage(base64String, currentBillId, token);
          setExportedImage(uploadResult.imageData);

          console.log('✅ Upload successful:', uploadResult.imageData.url);
        };
        reader.readAsDataURL(blob);
      } else {
        console.log('❌ User not authenticated - would download locally');
        // Logic download về máy local
        const url = URL.createObjectURL(blob);
        console.log('📁 Download URL created:', url.substring(0, 50) + '...');

        // Giả lập tạo link download
        console.log('⬇️  Would create download link with filename: hoa-don-' + new Date().toISOString().split('T')[0] + '.png');

        // Giả lập click download
        console.log('🖱️  Would simulate click to download');

        // Giả lập cleanup
        URL.revokeObjectURL(url);
        console.log('🧹 URL object revoked');

        console.log('✅ Local download simulation completed');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
    }
  };

  // Chạy test
  await canvasToBlobCallback(mockBlob);

  console.log('\n🎉 Test completed successfully!');
}

// Chạy test
testExportLogic().catch(console.error);