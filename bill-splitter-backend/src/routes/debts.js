// src/routes/debts.js
const express = require('express');
const Debt = require('../models/Debt');
const { authenticateToken } = require('./auth');

const router = express.Router();

// POST /api/debts - Tạo khoản nợ mới
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            billId,
            creditorId,
            creditorName,
            creditorPhone,
            amount,
            type,
            description,
            currency = 'VND'
        } = req.body;

        // ========== VALIDATION ==========
        // Required fields
        if (!billId) return res.status(400).json({ error: 'billId is required' });
        if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be > 0' });
        if (!type || !['OWED_TO', 'OWED_FROM'].includes(type)) {
            return res.status(400).json({ error: 'type must be OWED_TO or OWED_FROM' });
        }

        // Registered user (creditorId provided)
        if (creditorId) {
            // Chỉ cần creditorId
            const debt = new Debt({
                userId,
                billId,
                creditorId,
                creditorName: null,
                creditorPhone: null,
                amount,
                type,
                currency,
                description,
                status: 'PENDING_VERIFICATION'
            });
            await debt.save();
            return res.status(201).json(debt);
        }

        // Unregistered user (creditorId is null)
        if (!creditorName || !creditorPhone) {
            return res.status(400).json({
                error: 'creditorName and creditorPhone are required for unregistered users'
            });
        }

        const debt = new Debt({
            userId,
            billId,
            creditorId: null,
            creditorName,
            creditorPhone,
            amount,
            type,
            currency,
            description,
            status: 'PENDING'
        });

        await debt.save();
        res.status(201).json(debt);

    } catch (error) {
        console.error('Error creating debt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/debts/user/:userId - Lấy danh sách debts
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, type } = req.query;

        // Verify user is requesting their own debts
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Build query
        const query = { userId };
        if (status) query.status = status;
        if (type) query.type = type;

        const debts = await Debt.find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.json(debts);

    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/debts/summary/:userId - Lấy summary (tổng nợ, được nợ)
router.get('/summary/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user is requesting their own summary
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Tính tổng "Bạn cần trả" (OWED_TO)
        const payableResult = await Debt.aggregate([
            {
                $match: {
                    userId,
                    type: 'OWED_TO',
                    status: { $ne: 'SETTLED' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Tính tổng "Bạn cần thu" (OWED_FROM)
        const receivableResult = await Debt.aggregate([
            {
                $match: {
                    userId,
                    type: 'OWED_FROM',
                    status: { $ne: 'SETTLED' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Count unsettled debts
        const unsettledCount = await Debt.countDocuments({
            userId,
            status: { $ne: 'SETTLED' }
        });

        const disputedCount = await Debt.countDocuments({
            userId,
            status: 'DISPUTED'
        });

        const summary = {
            totalPayable: payableResult[0]?.total || 0,
            payableCount: payableResult[0]?.count || 0,
            totalReceivable: receivableResult[0]?.total || 0,
            receivableCount: receivableResult[0]?.count || 0,
            unsettledCount,
            disputedCount
        };

        res.json(summary);

    } catch (error) {
        console.error('Error fetching debt summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/debts/:id - Cập nhật status
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const { status } = req.body;

        // ========== VALIDATION ==========
        if (!status || !['PENDING', 'PENDING_VERIFICATION', 'SETTLED', 'DISPUTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const debt = await Debt.findById(id);
        if (!debt) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        // ========== AUTHORIZATION ==========
        // Chỉ userId (người sở hữu debt) hoặc creditorId (người được nợ) mới được update
        const isOwner = debt.userId === currentUserId;
        const isCreditor = debt.creditorId === currentUserId;

        if (!isOwner && !isCreditor) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // ========== UNREGISTERED USER (creditorId = null) ==========
        if (debt.creditorId === null) {
            // Status chỉ có thể là PENDING hoặc SETTLED
            if (!['PENDING', 'SETTLED', 'DISPUTED'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status for unregistered creditor' });
            }

            debt.status = status;
            if (status === 'SETTLED') {
                debt.verifiedAt = new Date();
            }
            await debt.save();
            return res.json(debt);
        }

        // ========== REGISTERED USER (creditorId != null) ==========
        // Logic: Cần xác minh từ 2 bên
        if (status === 'SETTLED') {
            // Nếu chỉ một bên xác nhận → PENDING_VERIFICATION
            if (!debt.verifiedBy) {
                // Bên thứ 1 báo trả → chờ bên thứ 2 xác minh
                debt.status = 'PENDING_VERIFICATION';
                debt.verifiedBy = currentUserId;
                debt.verifiedAt = new Date();
                await debt.save();
                return res.json({
                    ...debt.toObject(),
                    message: 'Waiting for other party to verify'
                });
            }

            // Nếu bên thứ 2 cũng xác nhận (verifiedBy khác currentUserId) → SETTLED
            if (debt.verifiedBy !== currentUserId) {
                debt.status = 'SETTLED';
                await debt.save();
                return res.json(debt);
            }

            // Nếu cùng người update 2 lần → không làm gì (đã update rồi)
            return res.json({
                ...debt.toObject(),
                message: 'Already verified by you, waiting for other party'
            });
        }

        // Status khác: cập nhật bình thường
        debt.status = status;
        if (status === 'DISPUTED') {
            // Reset verification khi dispute
            debt.verifiedBy = null;
            debt.verifiedAt = null;
        }
        await debt.save();
        res.json(debt);

    } catch (error) {
        console.error('Error updating debt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
