// src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Import User Model

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_strong_secret_key';

// Middleware Xác thực
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// POST /register - Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

        // User Model có middleware băm mật khẩu (pre('save'))
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully', username: user.username });

    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: 'Username already exists' });
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /login - Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

        const token = jwt.sign(
            { id: user._id.toString(), username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, userId: user._id.toString(), username: user.username });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = { authRouter: router, authenticateToken };