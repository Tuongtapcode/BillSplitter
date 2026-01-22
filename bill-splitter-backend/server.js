// server.js - File khởi động chính (Backend API)
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// Import các modules đã tách
const connectDB = require('./src/config/db');
const { router: authRouter } = require('./src/routes/auth'); // Router Auth
const billsRouter = require('./src/routes/bills'); // Router Bills
const geminiRouter = require('./src/routes/gemini'); // Router Gemini

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'https://bill-splitter-pi-rose.vercel.app',
    'http://localhost:3000',

  ],
  credentials: true,
  optionsSuccessStatus: 200 // Một số trình duyệt cũ/proxy cần cái này
};

// Connect to Database
(async () => {
    await connectDB();
    
    // Middleware
    app.use(cors(corsOptions));
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your_session_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false } // Set to true in production with HTTPS
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Health Check & Root
    app.get('/api/health', (req, res) => {
        res.json({ status: 'OK', message: 'API is running' });
    });
    app.get('/api', (req, res) => {
        res.json({ message: 'Welcome to the Bill Splitter API!' });
    });

    // Setup Routes
    app.use('/api', authRouter); // Routes: /api/login, /api/register
    app.use('/api/bills', billsRouter); // Routes: /api/bills, /api/bills/:billId, /api/bills/stats
    app.use('/api/gemini', geminiRouter); // Route: /api/gemini/extract

    // Start Server
    console.log('Starting server...');
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 API: http://localhost:${PORT}/api`);
        console.log('Server address:', server.address());
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
})();