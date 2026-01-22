// src/models/Bill.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    // ✅ SỬA: Cho phép nhiều người cùng chia 1 món
    assignedTo: [{ type: Number }] // Array of person indices
}, { _id: false });

// Schema cho thông tin ảnh
const imageSchema = new mongoose.Schema({
    url: { type: String },
    publicId: { type: String },
    originalName: { type: String }
}, { _id: false });

const billSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: { type: String, required: true },
    people: [{ type: String, required: true }],
    items: [itemSchema],
    total: { type: Number, required: true },
    
    // ✅ THÊM: Hỗ trợ nhiều ảnh
    images: [imageSchema], // Nhiều ảnh
    
    // Giữ lại để backward compatibility
    image: {
        type: imageSchema,
        default: null
    },
    
    // ✅ THÊM: Ảnh hóa đơn đã xuất (exported bill image)
    exportedImage: {
        type: imageSchema,
        default: null
    },
    
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

billSchema.index({ userId: 1, createdAt: -1 });

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;