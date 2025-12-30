// src/models/Bill.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    assignedTo: { type: Number, default: null }
}, { _id: false }); // Không cần ID cho Sub-document Item

// THÊM MỚI: Schema cho thông tin ảnh
const imageSchema = new mongoose.Schema({
    url: { type: String },           // URL ảnh từ Cloudinary
    publicId: { type: String },      // Public ID để xóa ảnh trên Cloudinary
    originalName: { type: String }   // Tên file gốc
}, { _id: false });

const billSchema = new mongoose.Schema({
    userId: {
        type: String, // Thay đổi từ ObjectId sang String
        required: true,
        index: true
    },
    name: { type: String, required: true },
    people: [{ type: String, required: true }],
    items: [itemSchema],
    total: { type: Number, required: true },
    
    // THÊM MỚI: Trường lưu thông tin ảnh hóa đơn
    image: {
        type: imageSchema,
        default: null  // Mặc định là null nếu không có ảnh
    },
    
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

billSchema.index({ userId: 1, createdAt: -1 });

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;