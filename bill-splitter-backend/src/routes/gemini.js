// src/routes/gemini.js
const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary'); // THÊM MỚI

// THÊM MỚI: Helper function để upload ảnh lên Cloudinary
async function uploadToCloudinary(base64Data, mimeType) {
  try {
    // Tạo data URI từ base64
    const base64Image = `data:${mimeType};base64,${base64Data}`;
    
    // Upload lên Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'bill-splitter',           // Lưu trong folder riêng
      resource_type: 'image',
      transformation: [
        { width: 1200, crop: 'limit' },  // Giới hạn chiều rộng tối đa 1200px
        { quality: 'auto' }              // Tự động tối ưu chất lượng
      ]
    });

    return {
      url: result.secure_url,      // URL HTTPS của ảnh
      publicId: result.public_id   // ID để xóa ảnh sau này
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud storage');
  }
}

// POST /extract - Trích xuất hóa đơn từ ảnh
router.post('/extract', async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // THÊM MỚI: Upload ảnh lên Cloudinary ngay sau khi nhận
    console.log('📤 Uploading image to Cloudinary...');
    const uploadResult = await uploadToCloudinary(image, mimeType || 'image/jpeg');
    console.log('✅ Image uploaded:', uploadResult.url);

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

    console.log('🤖 Calling Gemini AI...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    console.log('✅ Gemini AI extracted:', parsed.items?.length || 0, 'items');

    // THÊM MỚI: Trả về kèm thông tin ảnh đã upload
    res.json({ 
      success: true, 
      data: parsed,
      image: {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      }
    });

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

module.exports = router;