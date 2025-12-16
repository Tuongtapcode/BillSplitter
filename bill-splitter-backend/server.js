// server.js - Backend API cho Bill Splitter App
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1@cluster0.qof21z2.mongodb.net/billsplitter?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ===== SCHEMAS & MODELS =====

// Schema cho Item (sản phẩm)
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    assignedTo: { type: Number, default: null } // null = chia chung
});

// Schema cho Bill (hóa đơn)
const billSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    people: [{
        type: String,
        required: true
    }],
    items: [itemSchema],
    total: {
        type: Number,
        required: true
    },
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

// Index compound cho query hiệu quả hơn
billSchema.index({ userId: 1, createdAt: -1 });

const Bill = mongoose.model('Bill', billSchema);

// ===== API ENDPOINTS =====

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Bill Splitter API is running',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});
// Thêm route GET /api - API Index/Root
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to the Bill Splitter API!',
        endpoints: {
            health: 'GET /api/health',
            extract_bill: 'POST /api/gemini/extract (Image data required)',
            bills: 'GET /api/bills/:userId (Manage stored bills)'
        }
    });
});


// 1. POST /api/bills - Tạo hóa đơn mới
app.post('/api/bills', async (req, res) => {
    try {
        const { userId, name, people, items, total } = req.body;

        if (!userId || !name || !people || !items) {
            return res.status(400).json({
                error: 'Missing required fields: userId, name, people, items'
            });
        }

        const bill = new Bill({
            userId,
            name,
            people,
            items,
            total
        });

        await bill.save();
        res.status(201).json({
            message: 'Bill created successfully',
            bill
        });
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. GET /api/bills/:userId - Lấy tất cả hóa đơn của user
app.get('/api/bills/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, limit = 50, skip = 0 } = req.query;

        const query = { userId };

        // Filter theo tháng/ngày nếu có
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const bills = await Bill.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Bill.countDocuments(query);

        res.json({
            bills,
            total,
            hasMore: total > (parseInt(skip) + bills.length)
        });
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. GET /api/bills/:userId/stats - Thống kê theo tháng
app.get('/api/bills/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;
        const { year, month } = req.query;

        let matchStage = { userId };

        // Filter theo năm/tháng nếu có
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            matchStage.createdAt = { $gte: startDate, $lte: endDate };
        }

        const stats = await Bill.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalBills: { $sum: 1 },
                    totalAmount: { $sum: '$total' },
                    avgAmount: { $avg: '$total' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        res.json({ stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. GET /api/bills/detail/:billId - Lấy chi tiết 1 hóa đơn
app.get('/api/bills/detail/:billId', async (req, res) => {
    try {
        const { billId } = req.params;
        const bill = await Bill.findById(billId);

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json({ bill });
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. PUT /api/bills/:billId - Cập nhật hóa đơn
app.put('/api/bills/:billId', async (req, res) => {
    try {
        const { billId } = req.params;
        const { name, people, items, total } = req.body;

        const bill = await Bill.findByIdAndUpdate(
            billId,
            {
                name,
                people,
                items,
                total,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json({
            message: 'Bill updated successfully',
            bill
        });
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. DELETE /api/bills/:billId - Xóa hóa đơn
app.delete('/api/bills/:billId', async (req, res) => {
    try {
        const { billId } = req.params;
        const bill = await Bill.findByIdAndDelete(billId);

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json({
            message: 'Bill deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({ error: error.message });
    }
});

// 7. POST /api/gemini/extract - Proxy API Gemini để ẩn API key
app.post('/api/gemini/extract', async (req, res) => {
    try {
        const { image, mimeType } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        const PROMPT_TEXT = `Đây là hóa đơn từ siêu thị. Hãy trích xuất thông tin các sản phẩm và trả về ONLY JSON theo format sau (không thêm markdown, không thêm text khác):
{
  "items": [
    {"name": "tên sản phẩm", "price": giá_sau_VAT, "quantity": số_lượng}
  ]
}

Lưu ý:
- Lấy giá ĐÃ BAO GỒM VAT (cột "Giá bán (có VAT)")
- Quantity là số ở cột SL hoặc số lượng
- Bỏ qua các dòng không phải sản phẩm
- Chỉ trả về JSON thuần, không có \`\`\`json hay text thừa`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    inlineData: {
                                        mimeType: mimeType || 'image/jpeg',
                                        data: image
                                    }
                                },
                                {
                                    text: PROMPT_TEXT
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Gemini API error');
        }

        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error('No content returned from Gemini');
        }

        // Parse JSON từ response
        let parsed;
        try {
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : textContent.trim();
            parsed = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            throw new Error('Failed to parse JSON from AI response');
        }

        res.json({
            success: true,
            data: parsed
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            error: error.message,
            success: false
        });
    }
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
});