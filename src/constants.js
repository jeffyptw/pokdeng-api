// src/constants.js

const SUITS = ['♠️', '♥️', '♦️', '♣️']; // โพธิ์ดำ, โพธิ์แดง, ข้าวหลามตัด, ดอกจิก
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// ลำดับความแข็งแกร่งของประเภทไพ่ (ตัวเลขน้อยคือแข็งแกร่งกว่า)
const HAND_RANK_PRIORITY = {
    POK_9_DENG: 1,
    POK_8_DENG: 2,
    POK_9: 3,
    POK_8: 4,
    TONG: 5,          // ตอง
    STRAIGHT_FLUSH: 6, // สเตรทฟลัช
    STRAIGHT: 7,      // เรียง
    SIAN: 8,          // เซียน
    THREE_CARD_POINTS_DENG: 9, // 3 ใบ สีเดียวกัน (สามเด้ง)
    TWO_CARD_POINTS_DENG: 10, // 2 ใบ สีเดียวกัน (สองเด้ง)
    NORMAL_POINTS: 11, // แต้มธรรมดา
    NO_HAND: 12,       // กรณีไม่มีไพ่ หรือไพ่ไม่ถูกต้อง
};

const CARD_NUMERIC_VALUE_MAP = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
};

const JQK_VALUES = ['J', 'Q', 'K'];

module.exports = {
    SUITS,
    VALUES,
    HAND_RANK_PRIORITY,
    CARD_NUMERIC_VALUE_MAP,
    JQK_VALUES
};