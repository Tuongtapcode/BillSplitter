// server.js - File khởi động chính (Backend API)
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import các modules đã tách
const connectDB = require('./src/config/db');
const { authRouter } = require('./src/routes/auth'); // Router Auth
const billsRouter = require('./src/routes/bills'); // Router Bills
const geminiRouter = require('./src/routes/gemini'); // Router Gemini

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
(async () => {
    await connectDB();
    
    // Middleware
    app.use(cors());
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