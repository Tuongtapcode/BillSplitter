// src/models/Debt.js
const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Bill'
    },
    
    // Creditor (người mà nợ/được nợ)
    creditorId: {
        type: String,
        default: null,
        index: true
        // null = unregistered user
        // String = registered user ID
    },
    creditorName: {
        type: String,
        default: null
        // Tên của creditor nếu chưa đăng ký
        // null nếu đã đăng ký (dùng creditorId)
    },
    creditorPhone: {
        type: String,
        default: null
        // Số điện thoại để track user unregistered khi họ đăng ký
    },
    
    // Debt info
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'VND'
    },
    description: {
        type: String,
        default: ''
    },
    
    // Status & Type
    status: {
        type: String,
        enum: ['PENDING', 'PENDING_VERIFICATION', 'SETTLED', 'DISPUTED'],
        default: 'PENDING',
        index: true
    },
    type: {
        type: String,
        enum: ['OWED_TO', 'OWED_FROM'],
        required: true,
        index: true
        // OWED_TO: user nợ người khác
        // OWED_FROM: người khác nợ user
    },
    
    // Verification (chỉ cho registered creditor)
    verifiedBy: {
        type: String,
        default: null
        // User ID của người xác nhận (creditor)
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    
    // Metadata
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ creditorId: 1, status: 1 });
debtSchema.index({ billId: 1 });
debtSchema.index({ userId: 1, type: 1 });
debtSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Debt', debtSchema);
