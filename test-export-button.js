// Test thực tế trên trình duyệt để kiểm tra nút export
const puppeteer = require('puppeteer');

async function testExportButtonVisibility() {
  console.log('🚀 Bắt đầu test hiển thị nút export...\n');

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

    // Thêm một số item để kích hoạt phần Results
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

    // Đợi một chút để UI cập nhật
    await page.waitForTimeout(1000);

    // Kiểm tra nút export có hiển thị không
    console.log('🔍 Kiểm tra nút export...');

    const exportButton = await page.$('button:has-text("Xuất ảnh PNG")');
    if (exportButton) {
      console.log('✅ Nút "Xuất ảnh PNG" hiển thị thành công!');
      console.log('💡 Người dùng chưa đăng nhập vẫn có thể thấy nút export');

      // Có thể test click nút export
      console.log('🖱️  Test click nút export...');
      await exportButton.click();

      // Đợi loading message
      try {
        await page.waitForSelector('div:has-text("🔄 Đang xuất hóa đơn...")', { timeout: 5000 });
        console.log('✅ Loading message xuất hiện');

        // Đợi export hoàn thành
        await page.waitForFunction(() => {
          return !document.querySelector('div:has-text("🔄 Đang xuất hóa đơn...")');
        }, { timeout: 30000 });

        console.log('✅ Export hoàn thành (download local)');
      } catch (error) {
        console.log('⚠️  Không thấy loading message hoặc export thất bại');
      }

    } else {
      console.log('❌ Nút "Xuất ảnh PNG" không hiển thị!');
      console.log('💥 Có vấn đề với logic hiển thị nút');
    }

    // Đợi một chút
    await page.waitForTimeout(2000);

    console.log('\n🎉 Test hoàn thành thành công!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  } finally {
    await browser.close();
  }
}

// Chạy test
testExportButtonVisibility().catch(console.error);