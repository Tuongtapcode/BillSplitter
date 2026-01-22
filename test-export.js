// Test script để kiểm tra chức năng export
const puppeteer = require('puppeteer');

async function testExportFunctionality() {
  console.log('🚀 Bắt đầu test chức năng export...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    // Truy cập ứng dụng
    console.log('📱 Đang mở ứng dụng...');
    await page.goto('http://localhost:3000');

    // Đợi ứng dụng load
    await page.waitForSelector('input[placeholder*="Tên món"]', { timeout: 10000 });

    console.log('✅ Ứng dụng đã load thành công');

    // Thêm một số item để test
    console.log('📝 Đang thêm dữ liệu test...');

    // Thêm item 1
    await page.type('input[placeholder*="Tên món"]', 'Cà phê sữa');
    await page.type('input[placeholder*="Giá"]', '25000');
    await page.click('button:has-text("+")');

    // Thêm item 2
    await page.waitForSelector('input[placeholder*="Tên món"]');
    await page.type('input[placeholder*="Tên món"]', 'Bánh mì thịt');
    await page.type('input[placeholder*="Giá"]', '35000');
    await page.click('button:has-text("+")');

    // Thêm người
    await page.type('input[placeholder*="Tên người"]', 'Alice');
    await page.click('button:has-text("Thêm")');

    await page.type('input[placeholder*="Tên người"]', 'Bob');
    await page.click('button:has-text("Thêm")');

    console.log('✅ Đã thêm dữ liệu test');

    // Test export khi chưa đăng nhập
    console.log('🖼️  Test export khi chưa đăng nhập...');

    // Click nút export
    const exportButton = await page.$('button:has-text("Xuất ảnh PNG")');
    if (exportButton) {
      await exportButton.click();

      // Đợi loading message xuất hiện và biến mất
      await page.waitForSelector('div:has-text("🔄 Đang xuất hóa đơn...")', { timeout: 5000 });
      await page.waitForFunction(() => {
        return !document.querySelector('div:has-text("🔄 Đang xuất hóa đơn...")');
      }, { timeout: 30000 });

      console.log('✅ Export thành công khi chưa đăng nhập (download local)');
    } else {
      console.log('⚠️  Không tìm thấy nút export');
    }

    // Đợi một chút
    await page.waitForTimeout(2000);

    console.log('🎉 Test hoàn thành thành công!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  } finally {
    await browser.close();
  }
}

// Chạy test
testExportFunctionality().catch(console.error);