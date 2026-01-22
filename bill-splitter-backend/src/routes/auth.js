// src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Import User Model

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_strong_secret_key';

// Passport Google OAuth2 Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:5000'}/api/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // Check if email already exists
        const existingUser = await User.findOne({ email: profile.emails[0].value });
        if (existingUser) {
          return done(null, false, { message: 'Email already registered with different method' });
        }
        // Create new user
        user = new User({
          username: profile.displayName || profile.emails[0].value.split('@')[0],
          googleId: profile.id,
          email: profile.emails[0].value
        });
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

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

// GET /profile - Lấy thông tin profile (bao gồm danh sách people)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: { id: user._id, username: user.username, people: user.people } });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /profile/people - Cập nhật danh sách people
router.put('/profile/people', authenticateToken, async (req, res) => {
    try {
        const { people } = req.body;
        if (!Array.isArray(people)) return res.status(400).json({ error: 'People must be an array' });
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { people },
            { new: true, select: '-password' }
        );
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'People updated successfully', people: user.people });
    } catch (error) {
        console.error('Update people error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend with token
    const token = jwt.sign(
      { id: req.user._id.toString(), username: req.user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${token}&userId=${req.user._id}&username=${req.user.username}`);
  }
);

module.exports = { router, authenticateToken };