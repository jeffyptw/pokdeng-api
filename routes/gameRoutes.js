// routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const { createDeck, shuffleDeck } = require('../src/cardUtils');
const { getHandRank, determineWinner } = require('../src/gameLogic');

// Endpoint สำหรับทดสอบการคำนวณมือ
router.post('/evaluate-hand', (req, res) => {
    const { cards } = req.body; // รับไพ่มาในรูปแบบ [{suit: '♠️', value: 'A'}, ...]
    if (!cards || !Array.isArray(cards) || (cards.length !== 2 && cards.length !== 3)) {
        return res.status(400).json({ error: 'กรุณาระบุไพ่ 2 หรือ 3 ใบในรูปแบบอาร์เรย์' });
    }
    // เพิ่มการ validate suit และ value ของไพ่ที่รับเข้ามาด้วยจะดีมาก

    try {
        const handDetails = getHandRank(cards);
        res.json(handDetails);
    } catch (error) {
        console.error("Error evaluating hand:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการคำนวณไพ่" });
    }
});

// Endpoint สำหรับจำลองการเล่น 1 รอบระหว่างผู้เล่นกับเจ้ามือ
router.post('/play-round', (req, res) => {
    // ในระบบจริง อาจจะมีการจัดการ state ของเกม การวางเดิมพัน ฯลฯ
    // ตัวอย่างนี้จะสุ่มไพ่ให้ผู้เล่นและเจ้ามือ แล้วตัดสินผล

    try {
        let deck = createDeck();
        deck = shuffleDeck(deck);

        // สมมติแจกไพ่ให้ผู้เล่น 2 ใบ, เจ้ามือ 2 ใบก่อน
        const playerCards = [deck.pop(), deck.pop()];
        const dealerCards = [deck.pop(), deck.pop()];

        let playerHandDetails = getHandRank(playerCards);
        let dealerHandDetails = getHandRank(dealerCards);

        // --- ตรรกะการจั่วไพ่ใบที่ 3 (ตัวอย่าง simplified) ---
        // กฎ: "ถ้าเจ้าป๊อก ผู้เล่นจะไม่มีสิทธิ์จั่วไพ่ใบที่ 3"
        let playerCanDraw = true;
        let dealerCanDraw = true; // เจ้ามืออาจมีกฎการจั่วของตัวเอง

        if (dealerHandDetails.rank <= HAND_RANK_PRIORITY.POK_8) { // เจ้ามือป๊อก
            playerCanDraw = false;
        }
        if (playerHandDetails.rank <= HAND_RANK_PRIORITY.POK_8) { // ผู้เล่นป๊อก
            // ปกติถ้าผู้เล่นป๊อก ก็ไม่ต้องจั่ว และเจ้ามือก็อาจจะไม่ต้องจั่วถ้าแต้มสู้ไม่ได้
            dealerCanDraw = false; // อาจจะไม่เสมอไป ขึ้นกับกฎเจ้ามือ
        }


        // สมมติว่าผู้เล่นต้องการจั่วถ้าไม่ป๊อกและแต้มน้อยกว่า X (เช่น 4 หรือ 5)
        // และเจ้ามือก็มีกฎของตัวเอง (เช่น แต้มต่ำกว่า Y จั่ว)
        // **ส่วนนี้เป็นส่วนที่ซับซ้อนและมีหลายรูปแบบของกฎการจั่ว**
        // เพื่อความง่าย จะยังไม่ implement การจั่วใบที่ 3 อัตโนมัติในตัวอย่างนี้
        // แต่ API ควรจะรองรับการส่งไพ่ 2 หรือ 3 ใบมาได้

        // สมมติว่า client ส่งมาว่าจั่วหรือไม่จั่วแล้ว
        // หรือมี logic การตัดสินใจจั่วที่นี่
        // ตัวอย่าง: ถ้าผู้เล่นส่ง `playerCards` มา 3 ใบ แสดงว่าจั่วแล้ว

        // หากมีการส่งไพ่มา 3 ใบสำหรับผู้เล่นหรือเจ้ามือ ก็ให้ใช้ getHandRank กับไพ่ชุดนั้น
        // if (req.body.playerCards && req.body.playerCards.length === 3) {
        //     playerHandDetails = getHandRank(req.body.playerCards);
        // }
        // if (req.body.dealerCards && req.body.dealerCards.length === 3) {
        //     dealerHandDetails = getHandRank(req.body.dealerCards);
        // }


        const result = determineWinner(playerHandDetails, dealerHandDetails);

        res.json({
            message: "ผลการเล่นรอบนี้",
            playerInitialCards: playerCards.map(c => `${c.value}${c.suit}`).join(', '),
            dealerInitialCards: dealerCards.map(c => `${c.value}${c.suit}`).join(', '),
            playerHandDetails,
            dealerHandDetails,
            roundResult: result
        });

    } catch (error) {
        console.error("Error playing round:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการเล่น" });
    }
});


module.exports = router;