// src/routes/bills.js
const express = require('express');
const Bill = require('../models/Bill');
const { authenticateToken } = require('./auth'); // Import middleware
const cloudinary = require('../config/cloudinary'); // THÊM MỚI

const router = express.Router();

// THÊM MỚI: Helper function để xóa ảnh trên Cloudinary
async function deleteCloudinaryImage(publicId) {
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId);
        console.log('✅ Deleted image from Cloudinary:', publicId);
    } catch (error) {
        console.error('❌ Error deleting image from Cloudinary:', error);
        // Không throw error để không làm gián đoạn flow chính
    }
}

// Tất cả routes sau đây đều cần xác thực

// THÊM MỚI: POST /upload-exported-image - Upload ảnh hóa đơn đã xuất
router.post('/upload-exported-image', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { imageBase64, billId } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Missing imageBase64' });
        }

        // Upload lên Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
            folder: `bill-splitter/exports/${userId}`,
            public_id: `exported-bill-${billId || 'temp'}-${Date.now()}`,
            resource_type: 'image'
        });

        const imageData = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            originalName: `exported-bill-${billId || 'temp'}.png`
        };

        // Nếu có billId, cập nhật bill với exportedImage
        if (billId) {
            const bill = await Bill.findById(billId);
            if (!bill || bill.userId.toString() !== userId) {
                return res.status(404).json({ error: 'Bill not found or unauthorized' });
            }

            // Xóa ảnh cũ nếu có
            if (bill.exportedImage && bill.exportedImage.publicId) {
                await deleteCloudinaryImage(bill.exportedImage.publicId);
            }

            bill.exportedImage = imageData;
            await bill.save();

            res.json({ 
                message: 'Exported image uploaded and bill updated successfully', 
                imageData,
                billId 
            });
        } else {
            // Chỉ trả về imageData để frontend lưu vào state
            res.json({ 
                message: 'Exported image uploaded successfully', 
                imageData 
            });
        }
    } catch (error) {
        console.error('Error uploading exported image:', error);
        res.status(500).json({ error: error.message });
    }
});

// 1. POST / - Tạo hóa đơn mới
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // Lấy ID từ token
        const { name, people, items, total, images, image, exportedImage } = req.body; // Nhận cả images (mảng) và image (1 ảnh) để backward compatible

        if (!name || !people || !items) {
             return res.status(400).json({ error: 'Missing required fields: name, people, items' });
        }

        const bill = new Bill({
            userId,
            name,
            people,
            items,
            total,
            images: images && Array.isArray(images) ? images : (image ? [image] : []), // Nếu có images (mảng), lưu luôn. Không thì chuyển image thành mảng
            image: image || (images && images.length > 0 ? images[0] : null), // Giữ image field cho backward compatible
            exportedImage: exportedImage || null
        });

        await bill.save();
        res.status(201).json({ message: 'Bill created successfully', bill });
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. GET / - Lấy tất cả hóa đơn của user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // Lấy ID từ token
        const { startDate, endDate, limit = 50, skip = 0 } = req.query;

        const query = { userId };
        // Filter theo tháng/ngày nếu có
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const bills = await Bill.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Bill.countDocuments(query);
        res.json({ bills, total, hasMore: total > (parseInt(skip) + bills.length) });
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. GET /stats - Thống kê chi tiêu
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { year, month } = req.query;

        // Nếu có year và month cụ thể
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);

            const bills = await Bill.find({
                userId,
                createdAt: { $gte: startDate, $lt: endDate }
            }).sort({ createdAt: -1 });

            const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0);
            const billCount = bills.length;

            // Thống kê theo ngày trong tháng
            const dailyStats = {};
            bills.forEach(bill => {
                const day = bill.createdAt.getDate();
                if (!dailyStats[day]) {
                    dailyStats[day] = { amount: 0, count: 0 };
                }
                dailyStats[day].amount += bill.total;
                dailyStats[day].count += 1;
            });

            return res.json({
                year: parseInt(year),
                month: parseInt(month),
                totalAmount,
                billCount,
                dailyStats,
                bills: bills.map(bill => ({
                    id: bill._id,
                    name: bill.name,
                    total: bill.total,
                    date: bill.createdAt
                }))
            });
        }

        // Thống kê theo tháng trong năm hiện tại
        const currentYear = new Date().getFullYear();
        const monthlyStats = {};

        for (let m = 1; m <= 12; m++) {
            const startDate = new Date(currentYear, m - 1, 1);
            const endDate = new Date(currentYear, m, 1);

            const bills = await Bill.find({
                userId,
                createdAt: { $gte: startDate, $lt: endDate }
            });

            monthlyStats[m] = {
                amount: bills.reduce((sum, bill) => sum + bill.total, 0),
                count: bills.length
            };
        }

        // Thống kê tháng hiện tại vs tháng trước
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYearForCompare = now.getFullYear();

        const currentMonthStart = new Date(currentYearForCompare, currentMonth - 1, 1);
        const currentMonthEnd = new Date(currentYearForCompare, currentMonth, 1);

        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYearForCompare - 1 : currentYearForCompare;
        const prevMonthStart = new Date(prevYear, prevMonth - 1, 1);
        const prevMonthEnd = new Date(prevYear, prevMonth, 1);

        const currentMonthBills = await Bill.find({
            userId,
            createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd }
        });

        const prevMonthBills = await Bill.find({
            userId,
            createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd }
        });

        const currentMonthTotal = currentMonthBills.reduce((sum, bill) => sum + bill.total, 0);
        const prevMonthTotal = prevMonthBills.reduce((sum, bill) => sum + bill.total, 0);

        const changePercent = prevMonthTotal > 0 ?
            ((currentMonthTotal - prevMonthTotal) / prevMonthTotal * 100) : 0;

        res.json({
            currentMonth: {
                year: currentYearForCompare,
                month: currentMonth,
                totalAmount: currentMonthTotal,
                billCount: currentMonthBills.length
            },
            previousMonth: {
                year: prevYear,
                month: prevMonth,
                totalAmount: prevMonthTotal,
                billCount: prevMonthBills.length
            },
            changePercent: isNaN(changePercent) ? 0 : changePercent,
            monthlyStats: monthlyStats || {}
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. GET /:billId - Lấy chi tiết 1 hóa đơn
router.get('/:billId', authenticateToken, async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.billId);
        if (!bill || bill.userId.toString() !== req.user.id) { // Kiểm tra quyền sở hữu
            return res.status(404).json({ error: 'Bill not found or unauthorized' });
        }
        res.json({ bill });
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. PUT /:billId - Cập nhật hóa đơn
router.put('/:billId', authenticateToken, async (req, res) => {
    try {
        // Tìm và xác thực quyền sở hữu trước khi update
        const existingBill = await Bill.findById(req.params.billId);
        if (!existingBill || existingBill.userId.toString() !== req.user.id) {
             return res.status(404).json({ error: 'Bill not found or unauthorized' });
        }

        const { name, people, items, total, images, image, exportedImage } = req.body; // Nhận cả images (mảng) và image (1 ảnh)

        // Xử lý cập nhật ảnh - xóa ảnh cũ nếu không còn trong images mới
        if (existingBill.images && existingBill.images.length > 0) {
            const newImagePublicIds = images && Array.isArray(images) ? images.map(img => img.publicId) : (image ? [image.publicId] : []);
            existingBill.images.forEach(oldImg => {
                if (!newImagePublicIds.includes(oldImg.publicId)) {
                    deleteCloudinaryImage(oldImg.publicId);
                }
            });
        }

        // Xử lý backward compatible - nếu chỉ có image field cũ
        if (image && image.publicId &&
            existingBill.image &&
            existingBill.image.publicId !== image.publicId) {
            await deleteCloudinaryImage(existingBill.image.publicId);
        }

        // Xử lý exportedImage - xóa ảnh cũ nếu có exportedImage mới
        if (exportedImage && exportedImage.publicId &&
            existingBill.exportedImage &&
            existingBill.exportedImage.publicId !== exportedImage.publicId) {
            await deleteCloudinaryImage(existingBill.exportedImage.publicId);
        }

        const bill = await Bill.findByIdAndUpdate(
            req.params.billId,
            {
                name,
                people,
                items,
                total,
                images: images && Array.isArray(images) ? images : (image ? [image] : []), // Lưu images (mảng)
                image: image || (images && images.length > 0 ? images[0] : null), // Lưu image (1 ảnh) cho backward compatible
                exportedImage: exportedImage || null
            },
            { new: true }
        );

        res.json({ message: 'Bill updated successfully', bill });
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. DELETE /:billId - Xóa hóa đơn
router.delete('/:billId', authenticateToken, async (req, res) => {
    try {
        // Tìm và xác thực quyền sở hữu trước khi xóa
        const bill = await Bill.findById(req.params.billId);
        if (!bill || bill.userId.toString() !== req.user.id) {
            return res.status(404).json({ error: 'Bill not found or unauthorized' });
        }

        // THÊM MỚI: Xóa ảnh trên Cloudinary trước khi xóa bill
        if (bill.image && bill.image.publicId) {
            await deleteCloudinaryImage(bill.image.publicId);
        }

        // THÊM MỚI: Xóa exportedImage trên Cloudinary
        if (bill.exportedImage && bill.exportedImage.publicId) {
            await deleteCloudinaryImage(bill.exportedImage.publicId);
        }

        await Bill.findByIdAndDelete(req.params.billId);
        res.json({ message: 'Bill deleted successfully' });
    } catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;