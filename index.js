// index.js (pokdeng-api)

const express = require('express');
const cors = require('cors');
// สมมติว่า gameRoutes.js ของคุณอยู่ที่ ./routes/gameRoutes.js
// และภายใน gameRoutes.js มีการเรียกใช้ตรรกะคำนวณไพ่ (เช่นจาก cardLogic.js)
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// Render จะกำหนด PORT ให้ผ่าน Environment Variable
// ถ้าทดสอบบน local แล้ว process.env.PORT ไม่มีค่า ก็จะใช้ 4000 (หรือ port อื่นที่คุณต้องการ)
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());       // เปิดใช้งาน CORS สำหรับทุก routes (สำคัญมากสำหรับ API)
app.use(express.json()); // Middleware สำหรับอ่าน JSON request body (มากับ Express 4.16+)

// API Routes
// Endpoint หลักสำหรับ API ป๊อกเด้งของคุณ
// ตัวอย่าง: POST /api/pokdeng/calculate-hand จะถูกจัดการใน gameRoutes
app.use('/api/pokdeng', gameRoutes);

// Test Route / Health Check Route
app.get('/', (req, res) => {
    res.status(200).send('Pok Deng Card Calculation API is running and healthy!');
});

// Error Handling Middleware (ตัวอย่างง่ายๆ - ควรปรับปรุงให้ดีขึ้น)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the API server!');
});

app.listen(PORT, () => {
    // สำคัญมาก: Express ต้อง listen บน 0.0.0.0 (default) เพื่อให้ Render ตรวจจับได้
    // การไม่ระบุ host ใน app.listen() จะทำให้เป็น 0.0.0.0 โดยอัตโนมัติ
    console.log(`Pok Deng API server is running on port ${PORT}`);
});