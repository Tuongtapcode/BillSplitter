// src/config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // <-- Dòng này tải các biến từ .env

const connectDB = async () => {
    // Dòng này đọc giá trị từ biến môi trường
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://...'; 
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;