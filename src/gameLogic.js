// src/gameLogic.js
const { HAND_RANK_PRIORITY, JQK_VALUES, CARD_NUMERIC_VALUE_MAP } = require('./constants');
const { getCardPoint, getCardNumericValue } = require('./cardUtils');

/**
 * วิเคราะห์ไพ่ในมือ (2 หรือ 3 ใบ) และคืนค่าออบเจ็กต์ที่บอกรายละเอียดของไพ่มือนั้นๆ
 * @param {Array<Object>} cardsInput - อาร์เรย์ของไพ่ในมือ (เช่น [{suit: '♠️', value: 'A'}, {suit: '♥️', value: '8'}])
 * @returns {Object} ออบเจ็กต์รายละเอียดของไพ่ในมือ
 * { rank, type, score, subRank, multiplier, cards }
 */
function getHandRank(cardsInput) {
    if (!cardsInput || cardsInput.length === 0) {
        return { rank: HAND_RANK_PRIORITY.NO_HAND, type: "ไม่มีไพ่", score: 0, subRank: 0, multiplier: 0, cards: [] };
    }

    const cards = cardsInput.map(card => ({
        ...card,
        point: getCardPoint(card.value),
        numericValue: getCardNumericValue(card.value)
    })).sort((a, b) => b.numericValue - a.numericValue); // เรียงไพ่ตามค่า numericValue จากมากไปน้อย

    const numCards = cards.length;
    const totalPoints = cards.reduce((sum, card) => sum + card.point, 0);
    const score = totalPoints % 10;

    const isSameSuit = numCards > 0 && cards.every(card => card.suit === cards[0].suit);
    const values = cards.map(c => c.value);
    const numericValues = cards.map(c => c.numericValue).sort((a, b) => a - b); // เรียงจากน้อยไปมากสำหรับเช็คเรียง

    // --- ตรวจสอบ ป๊อก (ไพ่ 2 ใบเท่านั้น) ---
    if (numCards === 2) {
        if (score === 9) {
            return {
                rank: isSameSuit ? HAND_RANK_PRIORITY.POK_9_DENG : HAND_RANK_PRIORITY.POK_9,
                type: `ป๊อก 9${isSameSuit ? ' สองเด้ง' : ''}`,
                score: 9,
                subRank: 0, // ป๊อกไม่ต้องการ subRank ในการเทียบกันเองนอกจากประเภทป๊อก
                multiplier: isSameSuit ? 2 : 1,
                cards: cardsInput
            };
        }
        if (score === 8) {
            return {
                rank: isSameSuit ? HAND_RANK_PRIORITY.POK_8_DENG : HAND_RANK_PRIORITY.POK_8,
                type: `ป๊อก 8${isSameSuit ? ' สองเด้ง' : ''}`,
                score: 8,
                subRank: 0,
                multiplier: isSameSuit ? 2 : 1,
                cards: cardsInput
            };
        }
    }

    // --- ตรวจสอบไพ่พิเศษ (3 ใบ) ---
    if (numCards === 3) {
        // 1. ตอง (Tong)
        const isTong = values[0] === values[1] && values[1] === values[2];
        if (isTong) {
            return {
                rank: HAND_RANK_PRIORITY.TONG,
                type: `ตอง ${values[0]}`,
                score: score, // แต้มตองไม่สำคัญเท่าประเภทตอง แต่เก็บไว้เผื่อกรณีอื่น
                subRank: cards[0].numericValue, // ใช้ค่าของไพ่ตองในการเทียบ
                multiplier: 5,
                cards: cardsInput
            };
        }

        // 2. สเตรทฟลัช (Straight Flush)
        const isStraight = (numericValues[0] + 1 === numericValues[1] && numericValues[1] + 1 === numericValues[2]) ||
                           (numericValues[0] === 2 && numericValues[1] === 3 && numericValues[2] === 14); // A, 2, 3 straight (A สูงสุด)
        const isAceHighStraight = numericValues[0] === 10 && numericValues[1] === 12 && numericValues[2] === 13 && cards.find(c=>c.value === 'A'); // 10, J, Q, K, A handling. Check if Ace exists for QKA or 10JQ
        if (isAceHighStraight && cards.find(c=> c.value === 'A') && cards.find(c=> c.value === 'K') && cards.find(c=> c.value === 'Q')) { // QKA
             if (isSameSuit) {
                return {
                    rank: HAND_RANK_PRIORITY.STRAIGHT_FLUSH,
                    type: "สเตรทฟลัช QKA",
                    score: score,
                    subRank: 14, // A สูงสุด
                    multiplier: 5,
                    cards: cardsInput
                };
            }
        } else if (isStraight && isSameSuit) {
            // For A23 straight flush, subRank should be based on 3.
            // For other straight flushes, subRank is the highest card.
            let straightSubRank = numericValues[2];
            if (numericValues[0] === 2 && numericValues[1] === 3 && numericValues[2] === 14) { // A, 2, 3
                 straightSubRank = 3; // A23 นับ A เป็นต่ำสุดในการเรียงนี้
            }

            return {
                rank: HAND_RANK_PRIORITY.STRAIGHT_FLUSH,
                type: "สเตรทฟลัช",
                score: score,
                subRank: straightSubRank, // ค่าสูงสุดของไพ่ในเรียง (หรือ 3 ถ้าเป็น A23)
                multiplier: 5,
                cards: cardsInput
            };
        }


        // 3. เรียง (Straight)
        // ตรวจสอบ QKA แยกต่างหาก เพราะ A มีค่า numeric 14
        const isQKANumeric = numericValues.includes(CARD_NUMERIC_VALUE_MAP.Q) &&
                             numericValues.includes(CARD_NUMERIC_VALUE_MAP.K) &&
                             numericValues.includes(CARD_NUMERIC_VALUE_MAP.A);

        if (isQKANumeric) {
             return {
                rank: HAND_RANK_PRIORITY.STRAIGHT,
                type: "เรียง QKA",
                score: score,
                subRank: CARD_NUMERIC_VALUE_MAP.A, // A คือไพ่สูงสุด
                multiplier: 3,
                cards: cardsInput
            };
        } else if (isStraight) { // isStraight ถูกคำนวณไว้ด้านบนแล้ว
            let straightSubRank = numericValues[2];
            if (numericValues[0] === 2 && numericValues[1] === 3 && numericValues[2] === 14) { // A, 2, 3
                 straightSubRank = 3;
            }
            return {
                rank: HAND_RANK_PRIORITY.STRAIGHT,
                type: "เรียง",
                score: score,
                subRank: straightSubRank,
                multiplier: 3,
                cards: cardsInput
            };
        }

        // 4. เซียน (Sian)
        const isSian = cards.every(card => JQK_VALUES.includes(card.value));
        if (isSian) {
            // subRank คือผลรวม numeric value ของไพ่เซียน เพื่อเทียบ K-K-Q กับ K-Q-J
            // หรือจะใช้ค่าสูงสุดของไพ่ในกลุ่มก็ได้ ตามกฎที่ระบุ (เทียบหน้าไพ่)
            // เรียงไพ่ตาม numeric value จากมากไปน้อยเพื่อหา subRank ที่ถูกต้อง
            const sortedSianCards = [...cards].sort((a,b) => b.numericValue - a.numericValue);
            const sianSubRank = sortedSianCards[0].numericValue * 10000 + sortedSianCards[1].numericValue * 100 + sortedSianCards[2].numericValue;

            return {
                rank: HAND_RANK_PRIORITY.SIAN,
                type: "เซียน",
                score: score, // แต้มไม่สำคัญเท่าประเภท
                subRank: sianSubRank, // ใช้ค่าสูงสุดของไพ่ในกลุ่ม หรือเรียงค่า
                multiplier: 3,
                cards: cardsInput
            };
        }
    }

    // --- ตรวจสอบไพ่แต้มธรรมดา และ เด้ง ---
    // (กรณีไม่ใช่ป๊อก และไม่ใช่ไพ่พิเศษ 3 ใบ)

    if (numCards === 3 && isSameSuit) { // 3 เด้ง (ดอกเดียวกัน 3 ใบ)
        return {
            rank: HAND_RANK_PRIORITY.THREE_CARD_POINTS_DENG,
            type: `${score} แต้ม สามเด้ง`,
            score: score,
            subRank: Math.max(...numericValues), // ใช้ไพ่สูงสุดในกรณีแต้มเท่ากัน (แม้กฎจะบอกเสมอ แต่เผื่อไว้)
            multiplier: 3,
            cards: cardsInput
        };
    }

    if (numCards === 2 && isSameSuit) { // 2 เด้ง (ดอกเดียวกัน 2 ใบ และไม่ใช่ป๊อก)
        return {
            rank: HAND_RANK_PRIORITY.TWO_CARD_POINTS_DENG,
            type: `${score} แต้ม สองเด้ง`,
            score: score,
            subRank: Math.max(...numericValues),
            multiplier: 2,
            cards: cardsInput
        };
    }
    // หมายเหตุ: กฎของคุณระบุว่าไพ่ 2 ใบตัวเลขเหมือนกัน (คู่) ก็เป็นสองเด้ง
    // แต่ไม่ได้ระบุว่าแรงกว่าสองเด้งดอกเดียวกันหรือไม่ ในที่นี้จะให้สองเด้งดอกเดียวกันแรงกว่า
    // หากต้องการให้คู่เป็นสองเด้งด้วย สามารถเพิ่มเงื่อนไขตรงนี้
    if (numCards === 2 && values[0] === values[1] && !isSameSuit) { // ไพ่คู่ (สองเด้งแบบตัวเลข)
        return {
            rank: HAND_RANK_PRIORITY.TWO_CARD_POINTS_DENG, // อาจจะต้องมี rank priority แยกสำหรับคู่ถ้าต้องการ
            type: `${score} แต้ม สองเด้ง (คู่ ${values[0]})`,
            score: score,
            subRank: cards[0].numericValue, // ค่าของคู่
            multiplier: 2,
            cards: cardsInput
        };
    }


    // --- แต้มธรรมดา (ไม่มีเด้ง) ---
    return {
        rank: HAND_RANK_PRIORITY.NORMAL_POINTS,
        type: `${score} แต้ม`,
        score: score,
        subRank: Math.max(...numericValues), // ใช้ไพ่สูงสุดในกรณีแต้มเท่ากัน
        multiplier: 1,
        cards: cardsInput
    };
}

/**
 * ตัดสินผลระหว่างผู้เล่นสองคน
 * @param {Object} hand1Details - ผลลัพธ์จาก getHandRank ของผู้เล่น 1
 * @param {Object} hand2Details - ผลลัพธ์จาก getHandRank ของผู้เล่น 2
 * @param {boolean} isPlayer1Dealer - ผู้เล่น 1 เป็นเจ้ามือหรือไม่
 * @returns {Object} ผลการตัดสิน { winner: 'player1' | 'player2' | 'draw', reason: string, payoutMultiplier: number }
 * payoutMultiplier จะเป็น + สำหรับ player1 ถ้า player1 ชนะ, - ถ้า player1 แพ้
 */
function determineWinner(playerHandDetails, dealerHandDetails) {
    let result = {
        winner: 'draw', // 'player', 'dealer', 'draw'
        reason: '',
        playerPayoutRate: 0, // + ถ้าผู้เล่นชนะ, - ถ้าผู้เล่นแพ้ (เทียบกับเงินเดิมพัน)
        playerHand: playerHandDetails.type,
        dealerHand: dealerHandDetails.type
    };

    // กรณีเจ้ามือป๊อก ผู้เล่นที่ไม่ได้ป๊อกจะไม่ได้จั่วใบที่ 3 (ตรรกะนี้ต้องจัดการก่อนเรียก determineWinner หากมีการจั่ว)
    // แต่ใน determineWinner จะเน้นที่การเปรียบเทียบมือที่ได้มาแล้ว

    // 1. เจ้ามือป๊อก ผู้เล่นได้ไพ่พิเศษ -> เจ้ามือชนะเสมอ
    const dealerIsPok = dealerHandDetails.rank <= HAND_RANK_PRIORITY.POK_8;
    const playerIsPok = playerHandDetails.rank <= HAND_RANK_PRIORITY.POK_8;

    if (dealerIsPok && !playerIsPok && playerHandDetails.rank <= HAND_RANK_PRIORITY.SIAN) {
        // (ตอง, สเตรทฟลัช, เรียง, เซียน แพ้ ป๊อกของเจ้ามือ)
        result.winner = 'dealer';
        result.reason = `เจ้ามือ ${dealerHandDetails.type} ชนะ ผู้เล่น ${playerHandDetails.type}`;
        result.playerPayoutRate = -dealerHandDetails.multiplier; // ผู้เล่นเสียตาม multiplier ของเจ้ามือ
        return result;
    }
    // 2. ผู้เล่นป๊อก เจ้ามือไม่ได้ป๊อก -> ผู้เล่นชนะ
    if (playerIsPok && !dealerIsPok) {
        result.winner = 'player';
        result.reason = `ผู้เล่น ${playerHandDetails.type} ชนะ เจ้ามือ ${dealerHandDetails.type}`;
        result.playerPayoutRate = playerHandDetails.multiplier;
        return result;
    }

    // 3. เทียบ rank (ประเภทไพ่)
    if (playerHandDetails.rank < dealerHandDetails.rank) { // rank น้อยกว่า = ไพ่ดีกว่า
        result.winner = 'player';
        result.reason = `ผู้เล่น ${playerHandDetails.type} ชนะ เจ้ามือ ${dealerHandDetails.type}`;
        result.playerPayoutRate = playerHandDetails.multiplier;
    } else if (dealerHandDetails.rank < playerHandDetails.rank) {
        result.winner = 'dealer';
        result.reason = `เจ้ามือ ${dealerHandDetails.type} ชนะ ผู้เล่น ${playerHandDetails.type}`;
        // ถ้าผู้เล่นแพ้ไพ่พิเศษของเจ้ามือ ผู้เล่นจะเสียตาม multiplier ของเจ้ามือ
        // แต่ถ้าผู้เล่นแพ้ไพ่แต้มธรรมดาของเจ้ามือ แต่ผู้เล่นมีเด้ง ก็ควรเสียตามเด้งตัวเอง (ต้องพิจารณากฎนี้อีกที)
        // ตามกฎทั่วไป ถ้าแพ้ คือเสียตาม multiplier ของมือที่ชนะ
        result.playerPayoutRate = -dealerHandDetails.multiplier;
    } else { // rank เท่ากัน
        // 3.1 ป๊อกชนป๊อก -> เสมอ (ตามกฎที่ให้มา ป๊อก 9 เด้ง เสมอ ป๊อก 9, ป๊อก 8 เด้ง เสมอ ป๊อก 8)
        // และ ป๊อก 9 (ทุกแบบ) ชนะ ป๊อก 8 (ทุกแบบ) -> กรณีนี้ถูกจัดการโดย rank ที่ต่างกันแล้ว
        if (playerIsPok && dealerIsPok) {
            if (playerHandDetails.score > dealerHandDetails.score) { // ป๊อก 9 vs ป๊อก 8
                result.winner = 'player';
                result.reason = `ผู้เล่น ${playerHandDetails.type} ชนะ เจ้ามือ ${dealerHandDetails.type}`;
                result.playerPayoutRate = playerHandDetails.multiplier;
            } else if (dealerHandDetails.score > playerHandDetails.score) { // ป๊อก 8 vs ป๊อก 9
                result.winner = 'dealer';
                result.reason = `เจ้ามือ ${dealerHandDetails.type} ชนะ ผู้เล่น ${playerHandDetails.type}`;
                result.playerPayoutRate = -dealerHandDetails.multiplier;
            } else { // ป๊อกแต้มเท่ากัน (9 vs 9 หรือ 8 vs 8)
                result.winner = 'draw';
                result.reason = `เสมอ: ${playerHandDetails.type} กับ ${dealerHandDetails.type}`;
                result.playerPayoutRate = 0; // เสมอ ไม่ได้ไม่เสีย
            }
            return result;
        }

        // 3.2 ไพ่พิเศษประเภทเดียวกัน (ตอง, สเตรทฟลัช, เรียง, เซียน) -> เทียบ subRank
        if (playerHandDetails.rank === HAND_RANK_PRIORITY.TONG ||
            playerHandDetails.rank === HAND_RANK_PRIORITY.STRAIGHT_FLUSH ||
            playerHandDetails.rank === HAND_RANK_PRIORITY.STRAIGHT ||
            playerHandDetails.rank === HAND_RANK_PRIORITY.SIAN) {

            if (playerHandDetails.subRank > dealerHandDetails.subRank) {
                result.winner = 'player';
                result.reason = `ผู้เล่น ${playerHandDetails.type} (subRank ${playerHandDetails.subRank}) ชนะ เจ้ามือ ${dealerHandDetails.type} (subRank ${dealerHandDetails.subRank})`;
                result.playerPayoutRate = playerHandDetails.multiplier;
            } else if (dealerHandDetails.subRank > playerHandDetails.subRank) {
                result.winner = 'dealer';
                result.reason = `เจ้ามือ ${dealerHandDetails.type} (subRank ${dealerHandDetails.subRank}) ชนะ ผู้เล่น ${playerHandDetails.type} (subRank ${playerHandDetails.subRank})`;
                result.playerPayoutRate = -dealerHandDetails.multiplier;
            } else {
                result.winner = 'draw';
                result.reason = `เสมอ (ไพ่พิเศษประเภทเดียวกันและ subRank เท่ากัน): ${playerHandDetails.type}`;
                result.playerPayoutRate = 0;
            }
        }
        // 3.3 แต้มธรรมดาเท่ากัน (รวมเด้งต่างๆ ที่มี rank เดียวกัน) -> เสมอ
        // กฎ: "กรณีที่แต้มเท่ากันไม่นับว่าจะเป็นสามเด้ง,สองเด้ง,แต้มธรรมดา จะเสมอ"
        // และ "หลักการของการเทียบการชนะ,แพ้,เสมอ ของไพ่ธรรมดา,สามเด้ง,สองเด้ง การเทียบผลเทียแค่แต้ม"
        else if (playerHandDetails.rank >= HAND_RANK_PRIORITY.THREE_CARD_POINTS_DENG &&
                 dealerHandDetails.rank >= HAND_RANK_PRIORITY.THREE_CARD_POINTS_DENG) {
            if (playerHandDetails.score > dealerHandDetails.score) {
                result.winner = 'player';
                result.reason = `ผู้เล่น ${playerHandDetails.type} ชนะ เจ้ามือ ${dealerHandDetails.type}`;
                result.playerPayoutRate = playerHandDetails.multiplier; // ชนะ ได้ตามเด้งตัวเอง
            } else if (dealerHandDetails.score > playerHandDetails.score) {
                result.winner = 'dealer';
                result.reason = `เจ้ามือ ${dealerHandDetails.type} ชนะ ผู้เล่น ${playerHandDetails.type}`;
                // ผู้เล่นเสียตามเด้งของตัวเองเมื่อแต้มแพ้ (หรือตามเด้งเจ้ามือถ้าเจ้ามือเด้งสูงกว่า?)
                // กฎระบุว่า "ถ้า “แต้มธรรมดา” แล้วดอกเดียวกันจะเท่ากับ เด้ง นำไป คูณตามจำนวนเด้ง"
                // "ผู้เล่น A: 2♦️ 5♦️ K♦️ (7 แต้ม สามเด้ง) แพ้ ผู้เล่น B: 3♦️ 5♦️ K♦️ (8 แต้มสามเด้ง) -> A เสีย 3 เท่า เพราะสามเด้ง"
                // แสดงว่าถ้าแพ้แต้ม แต่ตัวเองมีเด้ง ก็เสียตามเด้งตัวเอง
                // หรือถ้าผู้ชนะมีเด้ง ผู้แพ้ก็เสียตามเด้งผู้ชนะ?
                // ปกติคือ ผู้เล่นชนะได้ตามเด้งตัวเอง, ผู้เล่นแพ้เสียตามเด้งผู้ชนะ
                result.playerPayoutRate = -dealerHandDetails.multiplier;
            } else { // แต้มเท่ากัน
                result.winner = 'draw';
                result.reason = `เสมอ (แต้มเท่ากัน): ผู้เล่น ${playerHandDetails.score} แต้ม, เจ้ามือ ${dealerHandDetails.score} แต้ม`;
                result.playerPayoutRate = 0;
            }
        } else {
            // กรณีอื่นๆ ที่ rank เท่ากันแต่ไม่ได้ถูกจัดการข้างบน (ไม่ควรเกิดขึ้นถ้า HAND_RANK_PRIORITY ถูกต้อง)
             result.winner = 'draw';
             result.reason = `เสมอ (กฎไม่ได้ระบุชัดเจนสำหรับกรณีนี้): ${playerHandDetails.type} vs ${dealerHandDetails.type}`;
             result.playerPayoutRate = 0;
        }
    }
    return result;
}


module.exports = {
    getHandRank,
    determineWinner
};