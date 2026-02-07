// 紀錄正在編輯的課程索引，-1 代表新增模式
let editingCourseIndex = -1;

// 預設的節次時間對照表 (如果沒有自訂設定時使用)
const defaultPeriodTimes = {
    '0': '07:10',
    '1': '08:10',
    '2': '09:10',
    '3': '10:10',
    '4': '11:10',
    'N': '12:10', // 午休或中午課程
    '5': '13:10',
    '6': '14:10',
    '7': '15:10',
    '8': '16:10',
    '9': '17:10',
    'A': '18:20',
    'B': '19:15',
    'C': '20:10',
    'D': '21:05'
};

// 切換顯示「星期幾」的單日課表
function switchDay(day) {
    currentDay = day;// 更新全域變數
    // 移除所有 Tab 的 active 樣式
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    // 為當前選擇的 Tab 加上 active 樣式
    const activeBtn = document.getElementById(`tab-${day}`);
    if (activeBtn) activeBtn.classList.add('active');

    const todayData = weeklySchedule[day] || [];// 取得當天的課程列表，若無則為空陣列
    todayData.sort((a, b) => (a.period || a.time || "").localeCompare(b.period || b.time || ""));// 依照節次排序課程

    // 取得表格 tbody
    const tbody = document.getElementById('schedule-body');
    if (tbody) {
        tbody.innerHTML = '';
        // 若無課程
        if (todayData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-class">😴 無課程</td></tr>';
        } else {
            // 遍歷課程並產生 HTML
            todayData.forEach(item => {
                const period = item.period || "-";
                const teacher = item.teacher || "";
                const room = item.room || "";
                // 取得課程性質 (必修/選修)
                const nature = item.nature || item.type || '必修';
                const category = item.category || '';

                // 設定不同性質的標籤顏色
                let typeColor = "#999";
                if (nature === '必修') typeColor = "#e74c3c";
                else if (nature === '選修') typeColor = "#27ae60";
                else if (nature === '必選修') typeColor = "#f39c12";

                // 產生標籤 HTML
                let badges = `<span style="font-size:0.7rem; color:white; background:${typeColor}; padding:2px 5px; border-radius:4px; margin-left:5px; vertical-align: middle;">${nature}</span>`;
                // 如果有分類且不是"其他"，加上分類標籤
                if (category && category !== '其他') {
                    badges += `<span style="font-size:0.7rem; color:#888; margin-left:3px;">(${category})</span>`;
                }

                // 組合表格列 HTML
                const row = `
                    <tr>
                        <td style="color:var(--primary); font-weight:bold;">${period}</td>
                        <td style="color:var(--text-sub);">${item.time}</td>
                        <td style="font-weight:bold;">${item.subject}</td>
                        <td><span style="background:var(--border); color:var(--text-main); padding:2px 4px; border-radius:4px; font-size:0.8rem;">${room}</span></td>
                        <td style="font-size:0.85rem;">${teacher}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }
    }
}

// 渲染編輯 Modal 中的課程清單
function renderEditList() {
    const listDiv = document.getElementById('current-course-list');
    const todayData = weeklySchedule[currentDay] || [];
    let html = '';
    todayData.forEach((item, index) => {
        // 組合時間與地點資訊
        const info = `${item.time} ${item.room ? '@' + item.room : ''}`;
        html += `
        <div class="course-list-item">
            <div class="course-info">
                <div class="course-name">${item.subject}</div>
                <div class="course-time">${info}</div>
            </div>
            <div>
                <button class="btn-edit" onclick="editCourse(${index})">修改</button>
                <button class="btn-delete" onclick="deleteCourse(${index})">刪除</button>
            </div>
        </div>`;
    });
    // 若無課程顯示提示
    listDiv.innerHTML = html || '<p style="color:#999; text-align:center;">無課程</p>';
}

// 準備編輯某堂課程
function editCourse(index) {
    const todayData = weeklySchedule[currentDay] || [];
    const item = todayData[index];
    if (!item) return;

    // 回填資料到輸入框
    document.getElementById('input-period-start').value = item.period || '';
    document.getElementById('input-period-end').value = item.period || ''; // 預設結束=起始
    // 若有自訂時間則用自訂，否則嘗試從節次推算
    document.getElementById('input-time').value = item.time || getPeriodTimes()[item.period] || '';
    document.getElementById('input-subject').value = item.subject || '';
    document.getElementById('input-course-category').value = item.category || '通識';
    document.getElementById('input-course-nature').value = item.nature || item.type || '必修';
    document.getElementById('input-room').value = item.room || '';
    document.getElementById('input-teacher').value = item.teacher || '';

    // 設定編輯模式索引
    editingCourseIndex = index;
    // 更改按鈕樣式與文字
    const btn = document.getElementById('btn-add-course');
    if (btn) {
        btn.innerText = "💾 保存修改";
        btn.style.background = "#f39c12";
    }
}

// 定義節次順序 (用於計算連堂區間)
const PERIOD_ORDER = ['0', '1', '2', '3', '4', 'N', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];

// 計算所有節次的時間 (基於使用者設定的起始時間與時長)
function getPeriodTimes() {
    const times = {};
    const { classDur, breakDur, startHash } = periodConfig;

    // 解析設定的起始時間 (如 08:10)
    let [h, m] = startHash.split(':').map(Number);
    let currentMin = h * 60 + m; // 轉成總分鐘數

    // 第 0 節通常比第 1 節早 (往前推算)
    let zeroStart = currentMin - (classDur + breakDur);
    times['0'] = formatTime(zeroStart);

    // 從第 1 節開始往後算
    PERIOD_ORDER.forEach(p => {
        if (p === '0') return; // 跳過 0，因為上面算過了

        times[p] = formatTime(currentMin);// 記錄當前節次的時間

        // 往後推算下一節的時間
        let duration = classDur;
        let breakTime = breakDur;

        if (p === '4') breakTime = 60;// 特殊規則：第 4 節下課 (中午) 通常休息久一點 (固定 60分)
        if (p === 'N') { duration = 30; breakTime = 20; }// 特殊規則：午休 N (固定 30 分鐘，休息 20 分)

        currentMin += duration + breakTime;// 累加時間
    });
    return times;
}

// 輔助函式：將分鐘轉為 HH:MM 字串
function formatTime(totalMinutes) {
    let h = Math.floor(totalMinutes / 60);
    let m = totalMinutes % 60;
    // 處理跨日
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// 編輯時間設定 (綁定到設定頁按鈕)
function editTimeSettings() {
    // 顯示確認框
    showConfirm("⚠️ 修改後，新增課程時的預設時間將會改變。\n\n確定要編輯課堂時間設定嗎？", "編輯確認")
        .then(isConfirmed => {
            if (!isConfirmed) return;

            // 提示輸入上課時間長度
            showPrompt("請輸入「每堂課」的分鐘數：", periodConfig.classDur, "上課時間")
                .then(cVal => {
                    if (cVal === null) return;
                    const newClass = parseInt(cVal) || 50;

                    // 提示輸入下課時間長度
                    showPrompt("請輸入「下課休息」的分鐘數：", periodConfig.breakDur, "下課時間")
                        .then(bVal => {
                            if (bVal === null) return;
                            const newBreak = parseInt(bVal) || 10;

                            // 儲存設定
                            periodConfig.classDur = newClass;
                            periodConfig.breakDur = newBreak;
                            saveData();

                            // 預覽第 1 節與第 8 節時間給使用者看
                            const preview = getPeriodTimes();
                            showAlert(`設定已更新！\n\n第 1 節：${preview['1']}\n第 8 節：${preview['8']}`, "修改成功");
                        });
                });
        });
}

// 新增或更新課程函式
function addCourse() {
    // 取得輸入欄位值
    const pStartRaw = document.getElementById('input-period-start').value.trim().toUpperCase();
    const pEndRaw = document.getElementById('input-period-end').value.trim().toUpperCase();
    const time = document.getElementById('input-time').value;
    const sub = document.getElementById('input-subject').value;
    const category = document.getElementById('input-course-category').value;
    const nature = document.getElementById('input-course-nature').value;
    const room = document.getElementById('input-room').value;
    const teacher = document.getElementById('input-teacher').value;

    // 基本驗證
    if (!sub || !pStartRaw) {
        showAlert('請至少輸入「科目」與「起始節次」', '資料不全');
        return;
    }

    const idxStart = PERIOD_ORDER.indexOf(pStartRaw);// 解析節次區間在陣列中的索引
    let idxEnd = pEndRaw ? PERIOD_ORDER.indexOf(pEndRaw) : idxStart;// 若未填結束節次，預設等於起始節次 (單節)

    // 節次合法性檢查
    if (idxStart === -1) { showAlert(`起始節次 "${pStartRaw}" 無效\n(請輸入 0-9 或 A-D)`, '格式錯誤'); return; }
    if (idxEnd === -1) { showAlert(`結束節次 "${pEndRaw}" 無效`, '格式錯誤'); return; }
    if (idxEnd < idxStart) { showAlert('結束節次不能早於起始節次！', '邏輯錯誤'); return; }

    // 初始化當日課表陣列 (如果不存在)
    if (!weeklySchedule[currentDay]) weeklySchedule[currentDay] = [];

    // 修改模式邏輯
    if (editingCourseIndex > -1) {
        // 更新當前這堂課
        const currentP = PERIOD_ORDER[idxStart];
        // 如果使用者有手動填時間優先使用，否則自動計算
        const finalTime = time || getPeriodTimes()[currentP] || "";
        weeklySchedule[currentDay][editingCourseIndex] = {
            period: currentP,
            time: finalTime,
            subject: sub, category, nature, room, teacher
        };

        // 如果區間變大 (例如原本 1 改成 1-3)，這裡簡單地追加後面的課程
        for (let i = idxStart + 1; i <= idxEnd; i++) {
            const p = PERIOD_ORDER[i];
            weeklySchedule[currentDay].push({
                period: p,
                time: getPeriodTimes()[p] || time, // 自動抓對應時間
                subject: sub, category, nature, room, teacher
            });
        }
        showAlert("修改成功！(若有延長節次已自動配對時間)", "成功");
    }
    // 新增模式邏輯
    else {
        let count = 0;
        // 迴圈建立連堂的多筆資料
        for (let i = idxStart; i <= idxEnd; i++) {
            const p = PERIOD_ORDER[i];

            // 取得該節次的時間
            const autoTime = getPeriodTimes()[p] || time;

            // 推入陣列
            weeklySchedule[currentDay].push({
                period: p,
                time: autoTime,
                subject: sub, category, nature, room, teacher
            });
            count++;
        }
        showAlert(`成功加入 ${count} 堂課！`, "完成");
    }

    resetCourseInput();// 重置輸入框
    saveData();// 存檔
    renderEditList();// 重新渲染清單
    updateExamSubjectOptions();// 更新全站的科目選單 (給成績用)
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable();// 即時更新週課表
}

// 重置輸入框與按鈕狀態
function resetCourseInput() {
    document.getElementById('input-period-start').value = '';
    document.getElementById('input-period-end').value = '';
    document.getElementById('input-time').value = '';
    document.getElementById('input-subject').value = '';
    document.getElementById('input-course-category').value = '通識';
    document.getElementById('input-course-nature').value = '必修';
    document.getElementById('input-room').value = '';
    document.getElementById('input-teacher').value = '';

    editingCourseIndex = -1;
    const btn = document.getElementById('btn-add-course');
    if (btn) {
        btn.innerText = "+ 加入清單";
        btn.style.background = "#333";
    }
}

// 刪除課程
function deleteCourse(index) {
    showConfirm('確定刪除這堂課嗎？', '刪除確認').then(isConfirmed => {
        if (isConfirmed) {
            // 如果正在編輯這堂課，先重置輸入框
            if (editingCourseIndex === index) resetCourseInput();

            // 移除資料
            weeklySchedule[currentDay].splice(index, 1);
            saveData();// 存檔
            renderEditList();// 重新渲染清單
            updateExamSubjectOptions();// 更新全站的科目選單 (給成績用)
        }
    });
}

// 開啟編輯 Modal
function openEditModal() {
    document.getElementById('course-modal').style.display = 'flex';
    resetCourseInput();
    renderEditList();// 重新渲染清單
}

// 關閉編輯 Modal
function closeEditModal() {
    document.getElementById('course-modal').style.display = 'none';
    resetCourseInput();
}

// 渲染週課表網格 (包含 rowspan 合併邏輯)
function renderWeeklyTable() {
    const tbody = document.getElementById('weekly-schedule-body');
    if (!tbody) return;

    // 定義要顯示的節次清單
    const periods = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];

    // 定義星期的順序 (週一 ~ 週日)
    const dayKeys = [1, 2, 3, 4, 5, 6, 0];

    // 用來記錄哪些格子因為被合併過，需要跳過不畫
    // 格式範例: "1-3" 代表 星期一的第3節 已經被合併了
    let skipMap = new Set();

    let html = '';

    // 遍歷每一個節次 (產生每一列 tr)
    periods.forEach((p, pIndex) => {
        html += `<tr>`;

        // --- 左側：節次欄 ---
        html += `<td style="font-weight:bold; background:#f4f7f6; color:#555; text-align:center; vertical-align: middle;">${p}</td>`;

        // --- 右側：週一至週日 (產生 td) ---
        dayKeys.forEach(day => {
            // 1. 如果這一格已經被標記為「跳過」，就直接結束這次迴圈，不畫 td
            if (skipMap.has(`${day}-${p}`)) return;

            const dayCourses = weeklySchedule[day] || [];

            // 尋找當前節次的課程
            const course = dayCourses.find(c => c.period == p);

            if (course) {
                // --- 2. 發現有課，開始「往後檢查」是否有連堂 ---
                let spanCount = 1;

                // 從下一個節次開始檢查
                for (let nextI = pIndex + 1; nextI < periods.length; nextI++) {
                    const nextP = periods[nextI];
                    const nextCourse = dayCourses.find(c => c.period == nextP);

                    // 判斷條件：必須有課，且「科目名稱」與「地點」完全相同
                    if (nextCourse &&
                        nextCourse.subject === course.subject &&
                        nextCourse.room === course.room) {

                        spanCount++; // 合併數 +1
                        skipMap.add(`${day}-${nextP}`); // 標記下一節課為「已處理/跳過」
                    } else {
                        break; // 只要中間斷掉或不同課，就停止合併
                    }
                }

                // --- 3. 決定背景色 ---
                let bgColor = '#fff3e0'; // 預設(橘淡色)
                if (course.nature === '必修') bgColor = '#ffebee'; // 紅淡色
                else if (course.nature === '選修') bgColor = '#e8f5e9'; // 綠淡色

                // --- 4. 繪製帶有 rowspan 的儲存格 ---
                html += `
                <td rowspan="${spanCount}" style="background:${bgColor}; padding:4px; text-align:center; vertical-align:middle; border:1px solid #eee;">
                    <div style="font-weight:bold; font-size:0.85rem; color:#333; line-height:1.2;">${course.subject}</div>
                    <div style="font-size:0.75rem; color:#666; margin-top:2px;">${course.room || ''}</div>
                </td>`;
            } else {
                html += `<td style="border:1px solid #f9f9f9;"></td>`;// 空堂，繪製空白格子
            }
        });
        html += `</tr>`;
    });
    tbody.innerHTML = html;
}

// 切換課表檢視模式 (本日課程 / 週課表)
function switchScheduleMode(mode) {
    // 定義所有分頁 ID
    const tabs = ['daily', 'weekly'];

    // 隱藏所有內容並移除按鈕 active 樣式
    tabs.forEach(tab => {
        const view = document.getElementById(`subview-sch-${tab}`);
        const btn = document.getElementById(`btn-sch-${tab}`);
        
        if (view) view.style.display = 'none';
        if (btn) btn.classList.remove('active');
    });

    // 顯示目標內容並加上 active 樣式
    const targetView = document.getElementById(`subview-sch-${mode}`);
    const targetBtn = document.getElementById(`btn-sch-${mode}`);
    
    if (targetView) targetView.style.display = 'block';
    if (targetBtn) targetBtn.classList.add('active');

    // 如果切換到週課表，確保表格有重新渲染 (避免畫面空白)
    if (mode === 'weekly') {
        renderWeeklyTable();
    }
}