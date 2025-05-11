// src/index.js
const express = require('express');
const cors = require('cors'); // ★ เพิ่ม cors
const gameRoutes = require('../routes/gameRoutes'); // ★ แก้ไข path ถ้า gameRoutes อยู่ใน ../routes/

const app = express();
const PORT = process.env.PORT || 3000; // Render จะกำหนด PORT ให้เอง

// Middleware
app.use(cors());             // ★ เปิดใช้งาน CORS สำหรับทุก routes
app.use(express.json());     // ★ ใช้ express.json() ที่ built-in มากับ Express (แทน bodyParser.json())

// Routes
app.use('/api/pokdeng', gameRoutes); // Endpoint หลักสำหรับเกม

// Test Route
app.get('/', (req, res) => {
    res.send('Pok Deng API is running!');
});

app.listen(PORT, () => {
    console.log(`Pok Deng API server is running on port ${PORT}`);
});