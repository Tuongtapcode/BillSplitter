// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Middleware (Hàm băm) - SỬA LẠI Ở ĐÂY
userSchema.pre('save', async function() {
    // Không cần tham số 'next' khi dùng async
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    // Không gọi next() ở đây, Mongoose sẽ tự hiểu khi kết thúc hàm async
});

const User = mongoose.model('User', userSchema);
module.exports = User;