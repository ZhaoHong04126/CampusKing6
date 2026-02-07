// Service Worker 只能在 https 和 localhost 下執行
// 生命週期： 包含 Install (安裝)、Activate (激活)、Fetch (攔截) 三個主要事件。
// 用途： 離線體驗、預先快取、動態快取、推播通知等。 

// 定義快取版本名稱，更新版本號可強迫瀏覽器更新快取
const CACHE_NAME = 'campusMate_v6.0_'; 

// 定義需要被預先快取的靜態檔案列表
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/pages.css',
    './js/main.js',
    './js/ui.js',
    './js/data.js',
    './js/state.js',
    './js/auth.js',
    './js/firebase.js',
    './js/course.js',
    './js/grade.js',
    './js/semester.js',
    './js/calendar.js',
    './js/accounting.js',
    './js/notification.js',
    './js/notes.js',
    './js/anniversary.js',
    './js/learning.js'
];

// 監聽 'install' 事件：當 Service Worker 第一次安裝時觸發
self.addEventListener('install', (e) => {
    e.waitUntil(
        // 開啟指定名稱的快取空間
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);// 將所有檔案加入快取
        })
    );
});

// 監聽 'fetch' 事件：當網頁發出網路請求時觸發 (攔截請求)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        // 檢查快取中是否有對應的資源
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);// 如果有快取就直接回傳 (離線可用)，否則發出真實網路請求
        })
    );

});
