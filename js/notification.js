// 請求瀏覽器通知權限
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showAlert("您的瀏覽器不支援通知功能", "無法使用");
        return;
    }

    // 瀏覽器 API
    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            showAlert("✅ 已開啟課程提醒！\n系統將在課前 10 分鐘通知您。", "設定成功");
            // 立即啟動檢查
            startCourseChecker();
        } else {
            showAlert("❌ 您拒絕了通知權限，無法收到提醒。", "設定失敗");
        }
    });
}

// 檢查是否該發送通知
function checkUpcomingCourses() {
    if (Notification.permission !== "granted") return;// 如果沒有權限，就不檢查
    const now = new Date();
    const day = now.getDay() === 0 ? 0 : now.getDay(); // 取得今天的星期 (0-6)
    const todayCourses = weeklySchedule[day] || []; // 讀取全域變數 weeklySchedule
    
    todayCourses.forEach(course => {
        if (!course.time) return;

        const [cHour, cMinute] = course.time.split(':').map(Number);// 解析課程時間 (例如 "08:10")
        
        // 建立課程的 Date 物件 (設為今天的該時間)
        const courseTime = new Date();
        courseTime.setHours(cHour, cMinute, 0, 0);

        const diffMs = courseTime - now;// 計算時間差 (毫秒)
        const diffMins = Math.floor(diffMs / 1000 / 60);// 轉為分鐘

        // 判斷條件：剛好在 "9 ~ 10 分鐘" 之間
        // 為了避免重複發送，我們可以加一個簡單的檢查 (或是依賴 setInterval 的間隔)
        if (diffMins === 10) {
            // 為了防止這 60秒內重複觸發，可以使用 sessionStorage 擋一下
            const storageKey = `notif_course_${day}_${course.subject}_${course.time}`;
            if (!sessionStorage.getItem(storageKey)) {
                sendNotification(`🔔 上課提醒：${course.subject}`, `時間：${course.time}\n地點：${course.room || '未定'}`);
                sessionStorage.setItem(storageKey, 'true');
                
                // 1小時後清除這個 key，避免下週同一堂課不響
                setTimeout(() => sessionStorage.removeItem(storageKey), 3600 * 1000);
            }
        }
    });
}

// 實際發送通知的函式
function sendNotification(course) {
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/2921/2921222.png"; 

    const title = `🔔 上課提醒：${course.subject}`;
    const options = {
        body: `時間：${course.time}\n地點：${course.room || '未定'}\n老師：${course.teacher || '未定'}`,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200] // 手機震動模式
    };

    // 優先使用 Service Worker 發送 (支援 PWA 背景運作)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    } else {
        new Notification(title, options);// 否則使用一般網頁 Notification
    }
}

// 每日晨間快報 (活動 + 紀念日)
function checkDailyBriefing() {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    // 設定晨報時間：早上 7 點 ~ 8 點之間觸發
    const currentHour = now.getHours();
    
    // 如果不是早上 7 點，就離開 (你可以改自己喜歡的時間)
    if (currentHour !== 7) return;

    // 檢查今天是否已經發送過晨報 (用 LocalStorage 紀錄日期)
    const todayStr = now.toISOString().split('T')[0];
    const sentKey = `daily_briefing_sent_${todayStr}`;

    if (localStorage.getItem(sentKey)) return; // 今天已經發送過，跳出

    // ---蒐集今天的資訊---
    let messages = [];

    // A. 檢查行事曆 (Calendar) 使用全域變數 calendarEvents
    if (typeof calendarEvents !== 'undefined') {
        const todayEvents = calendarEvents.filter(e => e.date === todayStr);
        todayEvents.forEach(e => {
            messages.push(`📅 行事曆：${e.title}`);
        });
    }

    // B. 檢查紀念日 (Anniversary) 使用全域變數 anniversaryList
    if (typeof anniversaryList !== 'undefined') {
        anniversaryList.forEach(a => {
            // 這裡簡單比對月/日是否相同
            const tDate = new Date(a.date);
            if (tDate.getMonth() === now.getMonth() && tDate.getDate() === now.getDate()) {
                messages.push(`💝 紀念日：${a.title} (就是今天！)`);
            }
        });
    }

    // C. 檢查今天第一堂課
    const day = now.getDay() === 0 ? 0 : now.getDay();
    const todayCourses = typeof weeklySchedule !== 'undefined' ? (weeklySchedule[day] || []) : [];
    if (todayCourses.length > 0) {
        // 排序找到第一堂
        todayCourses.sort((a, b) => (a.time || "23:59").localeCompare(b.time || "23:59"));
        const firstCourse = todayCourses[0];
        messages.push(`📚 第一堂課：${firstCourse.time} ${firstCourse.subject}`);
    }

    // ---發送通知---
    if (messages.length > 0) {
        sendNotification(
            `☀️ 早安！今日校園快報`, 
            messages.join('\n') // 將所有訊息換行顯示
        );
        console.log("已發送晨間快報");
    }

    // 標記今天已發送
    localStorage.setItem(sentKey, 'true');
}

// 通用發送函式
function sendNotification(title, body) {
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/2921/2921222.png"; 

    const options = {
        body: body,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200]
    };

    // 優先使用 Service Worker 發送 (支援 PWA 背景運作)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    } else {
        new Notification(title, options); // 一般網頁 Notification
    }
}
// 啟動計時器 (每 60 秒檢查一次)
let notificationInterval = null;
function startCourseChecker() {
    if (notificationInterval) clearInterval(notificationInterval);
    
    // 立即檢查一次
    checkUpcomingCourses();
    checkDailyBriefing(); // 檢查晨報
    
    // 每 60 秒檢查一次
    notificationInterval = setInterval(() => {
        checkUpcomingCourses();
        checkDailyBriefing(); // 檢查晨報
    }, 60000); 
    
    console.log("⏰ 通知服務已啟動 (課前提醒 + 每日晨報)");
}