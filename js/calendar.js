// js/calendar.js

// 用來記錄目前月曆顯示的日期
let calCurrentDate = new Date();
// [新增] 記錄目前正在編輯的活動索引 (-1 代表新增模式)
let editingCalendarIndex = -1;

// 主要渲染函式
function renderCalendar() {
    renderCalendarList();
    renderMonthGrid();
}

// 1. 列表渲染 (保持不變)
function renderCalendarList() {
    const listDiv = document.getElementById('calendar-list');
    if (!listDiv) return;

    // 排序
    calendarEvents.sort((a, b) => {
        const dateA = new Date(a.date + (a.startTime ? 'T' + a.startTime : 'T00:00'));
        const dateB = new Date(b.date + (b.startTime ? 'T' + b.startTime : 'T00:00'));
        return dateA - dateB;
    });

    let html = '';
    if (calendarEvents.length === 0) {
        html = '<p style="color:#999; text-align:center;">😴 目前無活動</p>';
    } else {
        calendarEvents.forEach((event, index) => {
            const endDateCheck = event.endDate ? new Date(event.endDate) : new Date(event.date);
            const isPast = endDateCheck < new Date().setHours(0,0,0,0);
            const style = isPast ? 'opacity: 0.5;' : '';
            
            let timeBadge = '';
            if (!event.isAllDay && event.startTime) {
                timeBadge = `<span style="background:#e3f2fd; color:#1565c0; padding:2px 6px; border-radius:4px; font-size:0.8rem; margin-right:6px;">${event.startTime}${event.endTime ? '~'+event.endTime : ''}</span>`;
            } else {
                timeBadge = `<span style="background:#eee; color:#666; padding:2px 6px; border-radius:4px; font-size:0.8rem; margin-right:6px;">全天</span>`;
            }

            let dateDisplay = event.date;
            if (event.endDate && event.endDate !== event.date) {
                const s = event.date.split('-').slice(1).join('/');
                const e = event.endDate.split('-').slice(1).join('/');
                dateDisplay = `${s} ~ ${e}`;
            }

            // [新增] 點擊列表項目也可以編輯
            html += `
            <div onclick="editCalendarEvent(event, ${index})" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0; ${style}; cursor:pointer;">
                <div style="text-align:left;">
                    <div style="font-weight:bold; color:var(--primary); font-size:0.9rem; margin-bottom:2px;">
                        ${dateDisplay}
                    </div>
                    <div style="font-size:1rem; display:flex; align-items:center; flex-wrap:wrap;">
                        ${timeBadge}
                        <span>${event.title}</span>
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteCalendarEvent(${index}); event.stopPropagation();" style="padding:4px 8px;">🗑️</button>
            </div>`;
        });
    }
    listDiv.innerHTML = html;
}

// 2. 月曆網格渲染 (加入互動事件)
function renderMonthGrid() {
    const gridDiv = document.getElementById('calendar-grid');
    const titleDiv = document.getElementById('calendar-month-year');
    if (!gridDiv || !titleDiv) return;

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); 

    // 週次計算
    let weekInfoText = "";
    if (typeof semesterStartDate !== 'undefined' && semesterStartDate) {
        const start = new Date(semesterStartDate);
        const currentMonthEnd = new Date(year, month + 1, 0);
        if (currentMonthEnd >= start) {
            const currentMonthStart = new Date(year, month, 1);
            const diffTime = currentMonthStart - start;
            const startWeek = Math.max(1, Math.ceil(Math.ceil(diffTime / (86400000)) / 7));
            if (startWeek < 30) weekInfoText = `<span style="font-size:0.8rem; color:var(--primary); margin-left:10px;">(約 第${startWeek}週起)</span>`;
        }
    }
    titleDiv.innerHTML = `${year}年 ${month + 1}月 ${weekInfoText}`;

    let html = `
        <div class="cal-day-header" style="color:#e74c3c">日</div>
        <div class="cal-day-header">一</div>
        <div class="cal-day-header">二</div>
        <div class="cal-day-header">三</div>
        <div class="cal-day-header">四</div>
        <div class="cal-day-header">五</div>
        <div class="cal-day-header" style="color:#e74c3c">六</div>
    `;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="cal-day cal-other-month"></div>`;
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // [關鍵] 為了讓編輯功能正常，我們需要追蹤每個活動在原始陣列中的索引
    // 先建立一個帶有索引的暫存陣列
    const eventsWithIndex = calendarEvents.map((e, i) => ({ ...e, _originalIndex: i }));

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = isCurrentMonth && today.getDate() === d;
        const className = isToday ? 'cal-day cal-today' : 'cal-day';
        
        const mStr = (month + 1).toString().padStart(2, '0');
        const dStr = d.toString().padStart(2, '0');
        const currentDateStr = `${year}-${mStr}-${dStr}`;

        // 篩選當日活動
        const dayEvents = eventsWithIndex.filter(e => {
            const start = e.date; 
            const end = e.endDate || e.date;
            return currentDateStr >= start && currentDateStr <= end;
        });

        dayEvents.sort((a, b) => (b.isAllDay ? 1 : 0) - (a.isAllDay ? 1 : 0));

        let eventsHtml = '';
        dayEvents.forEach(e => {
            let prefix = '';
            if (!e.isAllDay && e.startTime && e.date === currentDateStr) {
                prefix = `<span style="font-size:0.7em; opacity:0.8;">${e.startTime.replace(':','')}</span> `;
            }
            
            let style = "";
            if (e.date !== currentDateStr && e.endDate && e.endDate !== currentDateStr) {
                style = "opacity: 0.7;"; 
            }
            
            // [新增] 點擊活動標籤 -> 編輯 (stopPropagation 防止觸發格子的點擊)
            eventsHtml += `<div class="cal-event-text" style="${style}" onclick="editCalendarEvent(event, ${e._originalIndex})">${prefix}${e.title}</div>`;
        });

        // [新增] 點擊格子 -> 新增活動 (傳入日期)
        html += `<div class="${className}" onclick="openCalendarModal('${currentDateStr}')">
                    <div class="cal-date-num">${d}</div>
                    <div class="cal-events-wrapper">${eventsHtml}</div>
                 </div>`;
    }
    gridDiv.innerHTML = html;
}

// 3. 互動邏輯 (新增、編輯、刪除)

function changeMonth(offset) {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + offset);
    renderMonthGrid();
}

// 開啟 Modal (新增模式或由日期點擊觸發)
function openCalendarModal(dateStr = '') {
    // 重置為新增模式
    editingCalendarIndex = -1;
    document.getElementById('cal-modal-title').innerText = "📅 新增活動";
    
    // 更新按鈕狀態
    document.getElementById('btn-save-cal').innerText = "+ 加入";
    document.getElementById('btn-save-cal').style.background = "#333";
    document.getElementById('btn-del-cal').style.display = 'none'; // 隱藏刪除鈕

    // 重置欄位
    document.getElementById('calendar-modal').style.display = 'flex';
    document.getElementById('input-cal-date').value = dateStr; // 自動填入點擊的日期
    document.getElementById('input-cal-end-date').value = ''; 
    document.getElementById('input-cal-title').value = '';
    
    document.getElementById('input-cal-allday').checked = true;
    document.getElementById('input-cal-start').value = '';
    document.getElementById('input-cal-end').value = '';
    toggleCalTimeInput();
}

// 點擊活動 -> 進入編輯模式
function editCalendarEvent(event, index) {
    // 防止觸發底下的日期格子點擊事件
    if (event) event.stopPropagation();

    const item = calendarEvents[index];
    if (!item) return;

    editingCalendarIndex = index;
    
    // 更新介面文字
    document.getElementById('cal-modal-title').innerText = "✏️ 編輯活動";
    document.getElementById('btn-save-cal').innerText = "💾 儲存修改";
    document.getElementById('btn-save-cal').style.background = "#f39c12"; // 橘色
    document.getElementById('btn-del-cal').style.display = 'block'; // 顯示刪除鈕

    // 回填資料
    document.getElementById('calendar-modal').style.display = 'flex';
    document.getElementById('input-cal-date').value = item.date;
    document.getElementById('input-cal-end-date').value = item.endDate || '';
    document.getElementById('input-cal-title').value = item.title;
    
    document.getElementById('input-cal-allday').checked = item.isAllDay;
    document.getElementById('input-cal-start').value = item.startTime || '';
    document.getElementById('input-cal-end').value = item.endTime || '';
    
    toggleCalTimeInput();
}

function closeCalendarModal() {
    document.getElementById('calendar-modal').style.display = 'none';
}

function toggleCalTimeInput() {
    const isAllDay = document.getElementById('input-cal-allday').checked;
    const timeDiv = document.getElementById('cal-time-inputs');
    timeDiv.style.display = isAllDay ? 'none' : 'flex';
}

// 新增或儲存活動
function addCalendarEvent() {
    const date = document.getElementById('input-cal-date').value;
    const endDate = document.getElementById('input-cal-end-date').value; 
    const title = document.getElementById('input-cal-title').value;
    const isAllDay = document.getElementById('input-cal-allday').checked;
    const startTime = document.getElementById('input-cal-start').value;
    const endTime = document.getElementById('input-cal-end').value;

    if (date && title) {
        if (endDate && endDate < date) {
            showAlert("結束日期不能早於起始日期！");
            return;
        }
        if (!isAllDay && !startTime) {
            showAlert("請輸入開始時間");
            return;
        }

        const eventData = { 
            date, 
            endDate: endDate || null,
            title,
            isAllDay,
            startTime: isAllDay ? null : startTime,
            endTime: isAllDay ? null : endTime
        };

        if (editingCalendarIndex > -1) {
            // 編輯模式
            calendarEvents[editingCalendarIndex] = eventData;
            showAlert("活動已更新！", "完成");
        } else {
            // 新增模式
            calendarEvents.push(eventData);
            showAlert("活動已新增！", "成功");
        }

        saveData();
        closeCalendarModal();
        renderCalendar(); 
    } else {
        showAlert("請至少輸入起始日期與名稱");
    }
}

// 從 Modal 中刪除
function deleteCalendarEventFromModal() {
    if (editingCalendarIndex > -1) {
        showConfirm("確定要刪除此活動嗎？").then(ok => {
            if (ok) {
                calendarEvents.splice(editingCalendarIndex, 1);
                saveData();
                closeCalendarModal();
                renderCalendar();
                showAlert("已刪除");
            }
        });
    }
}

// 從列表中刪除 (保持舊有功能)
function deleteCalendarEvent(index) {
    const doDelete = () => {
        calendarEvents.splice(index, 1);
        saveData();
        renderCalendar();
    };

    if(window.showConfirm) {
        showConfirm("確定刪除此活動？").then(ok => { if(ok) doDelete(); });
    } else {
        if(confirm("確定刪除此活動？")) doDelete();
    }
}