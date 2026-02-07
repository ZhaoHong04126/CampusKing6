// 目前登入的 Firebase 使用者物件
let currentUser = null;
// 使用者身分 (highschool / university)，從 localStorage 讀取
let userType = localStorage.getItem('userType');
// 是否為註冊模式 (控制登入頁面狀態)
let isRegisterMode = false
// 目前選擇的星期 (預設為今天，若週日0則轉為1)
let currentDay = new Date().getDay();
if (currentDay === 0 || currentDay === 6) currentDay = 1;

let currentSemester = "114-1";// 目前選擇的學期

let semesterList = ["114-1"];// 學期列表

let userTitle = "同學"; // 預設顯示名稱
let allData = {};// 儲存所有學期的完整資料結構
let weeklySchedule = {};// 當前學期的週課表資料
let gradeList = [];// 當前學期的成績資料
let regularExams = {};// 當前學期的平常考資料
let midtermExams = {};// 當前學期的段考資料
let calendarEvents = [];// 當前學期的行事曆資料
let accountingList = [];// 當前學期的記帳資料
let accChartInstance = null;// 記帳圖表實例 (Chart.js)
let quickNotes = [];// 筆記資料
let anniversaryList = [];// 紀念日資料
let semesterStartDate = "";// 學期開始日
let semesterEndDate = "";// 學期結束日
let learningList = [];// 學習計畫資料
let lotteryList = [];//籤筒資料
let graduationTarget = 128; // 畢業學分目標 (預設 128)
// 預設的支付方式列表
let paymentMethods = [
    "現金", "一卡通", "悠遊卡", 
    "信用卡", "行動支付", "轉帳"
];

// 各類別學分目標預設值 (大學模式)
let categoryTargets = {
    "通識": 28,
    "院共同": 9,
    "基礎": {
        "必修": 15,
        "選修": 9
    },
    "核心": {
        "必修": 15,
        "選修": 9
    },
    "專業": {
        "必修": 0,
        "選修": 23
    },
    "自由": 20,
    "其他": 0
};

// 課堂時間設定預設值
let periodConfig = {
    classDur: 50, // 上課時間 (分)
    breakDur: 10, // 下課時間 (分)
    startHash: "08:10" // 第一節開始時間
};

// 通知設定預設值
let notificationSettings = {
    course: true,       // 課前提醒
    daily: true,        // 每日晨報 (行程)
    anniversary: true   // 紀念日提醒
};

// 預設的課表結構 (週一到週五)
const defaultSchedule = { 1: [], 2: [], 3: [], 4: [], 5: [] };