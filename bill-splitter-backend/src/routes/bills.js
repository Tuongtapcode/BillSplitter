// src/routes/bills.js
const express = require('express');
const Bill = require('../models/Bill');
const { authenticateToken } = require('./auth'); // Import middleware

const router = express.Router();

// Tất cả routes sau đây đều cần xác thực

// 1. POST / - Tạo hóa đơn mới
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // Lấy ID từ token
        const { name, people, items, total } = req.body;

        if (!name || !people || !items) {
             return res.status(400).json({ error: 'Missing required fields: name, people, items' });
        }

        const bill = new Bill({ userId, name, people, items, total });
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

// 3. GET /stats - Thống kê theo tháng
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // Lấy ID từ token
        const { year, month } = req.query;
        
        let matchStage = { userId };
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            matchStage.createdAt = { $gte: startDate, $lte: endDate };
        }

        const stats = await Bill.aggregate([
             { $match: matchStage },
             {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalBills: { $sum: 1 },
                    totalAmount: { $sum: '$total' },
                    avgAmount: { $avg: '$total' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        res.json({ stats });
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

        const { name, people, items, total } = req.body;
        const bill = await Bill.findByIdAndUpdate(
            req.params.billId,
            { name, people, items, total, updatedAt: Date.now() },
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
        const existingBill = await Bill.findById(req.params.billId);
        if (!existingBill || existingBill.userId.toString() !== req.user.id) {
             return res.status(404).json({ error: 'Bill not found or unauthorized' });
        }
        
        await Bill.findByIdAndDelete(req.params.billId);

        res.json({ message: 'Bill deleted successfully' });
    } catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;