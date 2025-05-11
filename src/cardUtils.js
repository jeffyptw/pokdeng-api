// src/cardUtils.js
const { SUITS, VALUES, CARD_NUMERIC_VALUE_MAP } = require('./constants');

/**
 * สร้างสำรับไพ่มาตรฐาน 52 ใบ
 * @returns {Array<Object>} อาร์เรย์ของไพ่ (สำรับไพ่)
 */
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

/**
 * สับไพ่ในสำรับโดยใช้ Fisher-Yates shuffle algorithm
 * @param {Array<Object>} deck - สำรับไพ่
 * @returns {Array<Object>} สำรับไพ่ที่สับแล้ว
 */
function shuffleDeck(deck) {
    const shuffledDeck = [...deck]; // สร้างสำเนาเพื่อไม่ให้กระทบ deck เดิม
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
}

/**
 * คำนวณแต้มของไพ่
 * @param {string} value - ค่าหน้าไพ่ (เช่น 'A', 'K', '7')
 * @returns {number} แต้มของไพ่ (A=1, 2-9=ตามเลข, 10,J,Q,K=0)
 */
function getCardPoint(value) {
    if (['K', 'Q', 'J', '10'].includes(value)) {
        return 0;
    }
    if (value === 'A') {
        return 1;
    }
    return parseInt(value, 10);
}

/**
 * แปลงออบเจ็กต์ไพ่เป็นสตริงที่แสดงผลได้ง่าย
 * @param {Object} card - ออบเจ็กต์ไพ่ { suit, value }
 * @returns {string} สตริงแสดงไพ่ (เช่น "A♠️")
 */
function getCardDisplay(card) {
    if (!card || !card.value || !card.suit) return "";
    return `${card.value}${card.suit}`;
}

/**
 * ให้ค่า "ความแข็งแกร่ง" หรือ "ค่าตัวเลข" ของหน้าไพ่เพื่อใช้ในการเปรียบเทียบ
 * @param {string} value - ค่าหน้าไพ่
 * @returns {number} ค่าตัวเลขของหน้าไพ่
 */
function getCardNumericValue(value) {
    return CARD_NUMERIC_VALUE_MAP[value] || 0;
}

module.exports = {
    createDeck,
    shuffleDeck,
    getCardPoint,
    getCardDisplay,
    getCardNumericValue
};