// --- 自訂全域彈窗元件 (Custom Modals) ---

// 全域函式：顯示自訂 Alert Modal
// message: 提示訊息內容, title: 標題 (預設為 "💡 提示")
window.showAlert = function(message, title = "💡 提示") {
    // 回傳一個 Promise，讓呼叫端可以用 .then() 或 await 等待使用者關閉
    return new Promise((resolve) => {
        // 取得 Modal 元素
        const modal = document.getElementById('custom-modal');
        // 如果 HTML 中找不到 Modal 元素，則退回使用原生的 alert，並結束 Promise
        if(!modal) { alert(message); resolve(); return; }
        
        // 設定標題與訊息內容
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        
        // Alert 不需要輸入框，所以隱藏它
        document.getElementById('custom-modal-input-container').style.display = 'none';
        
        // 設定按鈕區塊：只顯示一個「好，知道了」按鈕
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `<button class="btn" onclick="closeCustomModal(true)" style="flex:1; max-width:120px;">好，知道了</button>`;
        
        // 將 resolve 函式暫存到 window 物件上，以便 closeCustomModal 呼叫時能觸發
        window._customModalResolve = resolve;
        
        // 顯示 Modal (使用 Flex 排版置中)
        modal.style.display = 'flex';
    });
}

// 全域函式：顯示自訂 Confirm Modal (取代原生的 window.confirm)
// 回傳 true (確定) 或 false (取消)
window.showConfirm = function(message, title = "❓ 確認") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        // 若無 Modal 元素，退回原生 confirm
        if(!modal) { resolve(confirm(message)); return; }
        
        // 設定文字
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        // 隱藏輸入框
        document.getElementById('custom-modal-input-container').style.display = 'none';
        
        // 設定按鈕區塊：顯示「取消」與「確定」雙按鈕
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `
            <button class="btn" onclick="closeCustomModal(false)" style="flex:1; background:#eee; color:#666;">取消</button>
            <button class="btn" onclick="closeCustomModal(true)" style="flex:1;">確定</button>
        `;
        
        // 暫存 resolve
        window._customModalResolve = resolve;
        // 顯示 Modal
        modal.style.display = 'flex';
    });
}

// 全域函式：顯示自訂 Prompt Modal (取代原生的 window.prompt)
// 回傳使用者輸入的字串，若取消則回傳 null
window.showPrompt = function(message, defaultValue = "", title = "✏️ 輸入") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        // 若無 Modal 元素，退回原生 prompt
        if(!modal) { resolve(prompt(message, defaultValue)); return; }
        
        // 設定文字
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-message').innerText = message;
        
        // 顯示輸入框容器
        const inputContainer = document.getElementById('custom-modal-input-container');
        const input = document.getElementById('custom-modal-input');
        inputContainer.style.display = 'block';
        
        // 設定預設值並自動聚焦
        input.value = defaultValue;
        input.focus();
        
        // 設定按鈕區塊
        const actions = document.getElementById('custom-modal-actions');
        actions.innerHTML = `
            <button class="btn" onclick="closeCustomModal(null)" style="flex:1; background:#eee; color:#666;">取消</button>
            <button class="btn" onclick="closeCustomModal(document.getElementById('custom-modal-input').value)" style="flex:1;">確定</button>
        `;
        
        // 暫存 resolve
        window._customModalResolve = resolve;
        // 顯示 Modal
        modal.style.display = 'flex';
    });
}

// 關閉自訂 Modal 並回傳 Promise 結果的通用函式
window.closeCustomModal = function(result) {
    const modal = document.getElementById('custom-modal');
    // 隱藏 Modal
    modal.style.display = 'none';
    
    // 如果有暫存的 Promise resolve 函式，則執行它並傳回結果
    if (window._customModalResolve) {
        window._customModalResolve(result);
        // 清除暫存
        window._customModalResolve = null;
    }
}

// --- 路由與導航控制 (Routing) ---

// 監聽瀏覽器上一頁/下一頁事件 (History API popstate)
window.addEventListener('popstate', (event) => {
    // 取得歷史紀錄中的 view 狀態，若無則預設回首頁 ('home')
    const targetView = event.state ? event.state.view : 'home';
    // 切換分頁，但不再次推入歷史紀錄 (false)，避免無限迴圈
    switchTab(targetView, false);
});

// 左上角返回按鈕的功能
function goBack() {
    // 如果有歷史紀錄且不是在首頁，就執行瀏覽器的「上一頁」
    if (window.history.state && window.history.state.view !== 'home') {
        window.history.back();
    } else {
        switchTab('home');// 否則強制回到首頁
    }
}

// 核心頁面切換函式
// tabName: 目標頁面的 ID 後綴 (例如 'schedule')
// addToHistory: 是否要將此次切換加入瀏覽器歷史紀錄 (預設 true)
function switchTab(tabName, addToHistory = true) {
    // 定義所有可能的頁面 ID 列表，用於重置顯示狀態
    const views = [
        'home', 'schedule', 'calendar', 
        'info', 'settings', 'chart', 
        'credits', 'regular', 'midterm', 
        'grades', 'exams-hub', 'grade-manager', 
        'accounting', 'notes', 'anniversary', 
        'learning', 'discussion', 'lottery',
        'notifications',
    ];
    
    // 迴圈：隱藏所有 View，並移除導航列按鈕的 active 樣式
    views.forEach(view => {
        const el = document.getElementById('view-' + view);
        if (el) el.style.display = 'none';
        
        const btn = document.getElementById('btn-' + view);
        if (btn) btn.classList.remove('active');
    });

    // 顯示目標 View
    const targetView = document.getElementById('view-' + tabName);
    if (targetView) targetView.style.display = 'block';
    
    // 啟用目標按鈕的 active 狀態 (高亮顯示)
    const targetBtn = document.getElementById('btn-' + tabName);
    if (targetBtn) targetBtn.classList.add('active');

    // 處理頂部導航列 (Top Bar) 的狀態
    const backBtn = document.getElementById('nav-back-btn');
    const titleEl = document.getElementById('app-title');
    
    // 如果是首頁
    if (tabName === 'home') {
        if (backBtn) backBtn.style.display = 'none'; // 隱藏返回鍵
        if (titleEl) titleEl.innerText = '📅 校園王'; // 設定首頁標題
    } else {
        // 如果是其他內頁
        if (backBtn) backBtn.style.display = 'block'; // 顯示返回鍵
        
        // 根據頁面名稱設定標題
        let pageTitle = "校園王";
        switch(tabName) {
            case 'schedule': pageTitle = "我的課表"; break;
            case 'calendar': pageTitle = "學期行事曆"; break;
            case 'grade-manager': pageTitle = "成績管理"; break;
            case 'accounting': pageTitle = "學期記帳"; break;
            case 'notes': pageTitle = "記事本"; break;
            case 'anniversary': pageTitle = "紀念日"; break;
            case 'info': pageTitle = "系統資訊"; break;
            case 'discussion': pageTitle = "校園討論區"; break;
            case 'settings': pageTitle = "個人設定"; break;
        }
        const titleEl = document.getElementById('app-title');
        if (titleEl) titleEl.innerText = pageTitle;
    }

    // 加入瀏覽器歷史紀錄 (支援上一頁功能)
    if (addToHistory) {
        if (tabName !== 'home') {
            // 推入新狀態，URL 加上 hash (如 #schedule)
            history.pushState({ view: tabName }, null, `#${tabName}`);
        } else {
            // 回首頁狀態
            history.pushState({ view: 'home' }, null, './');
        }
    }

    // --- 針對特定頁面執行初始化邏輯 ---
    
    // 如果切換到課表頁，預設顯示今天的課表，並切換回「本日課程」分頁
    if (tabName === 'schedule') {
        switchDay(currentDay);
        // 新增這一行，確保預設顯示第一個分頁
        if (typeof switchScheduleMode === 'function') switchScheduleMode('daily');
    }
    // 如果切換到行事曆，渲染月曆
    if (tabName === 'calendar') {
        // 檢查函式是否存在 (避免未載入錯誤)
        if (typeof renderCalendar === 'function') renderCalendar();
    }
    // 如果切換到資訊頁，載入公告
    if (tabName === 'info') loadAnnouncements();
    // 如果切換到成績管理，預設顯示總覽分頁
    if (tabName === 'grade-manager' && typeof switchGradeTab === 'function') switchGradeTab('dashboard');
    // 如果切換到記帳頁，預設顯示摘要分頁
    if (tabName === 'accounting') {
        if (typeof switchAccTab === 'function') switchAccTab('summary');
        else if (typeof renderAccounting === 'function') renderAccounting();
    }
    // 如果切換到學習進度頁，渲染列表
    if (tabName === 'learning') {
        if (typeof renderLearning === 'function') renderLearning();
    }
    // 如果切換到討論區，就初始化監聽
    if (tabName === 'discussion') {
        if (typeof initDiscussion === 'function') initDiscussion();
    } else {
        // 如果離開討論區，就停止監聽
        if (typeof stopDiscussionListener === 'function') stopDiscussionListener();
    }
    // 如果切換到籤筒，初始化介面
    if (tabName === 'lottery') {
        if (typeof renderLottery === 'function') renderLottery();
    }
    // 如果切換到通知頁，渲染設定列表
    if (tabName === 'notifications') {
        if (typeof renderNotificationApp === 'function') renderNotificationApp();
    }
}

// 載入公告列表
function loadAnnouncements() {
    const infoContent = document.getElementById('info-content');
    // 注意：這裡假設 HTML 結構中有 info-content，若無則可能是在 view-info 內
    // 原始碼邏輯是動態建立列表容器
    if (!infoContent) return;
    
    // 清除舊的列表
    const oldList = document.getElementById('announcement-list');
    if (oldList) oldList.remove();
    
    // 建立新容器
    const listContainer = document.createElement('div');
    listContainer.id = 'announcement-list';
    listContainer.style.marginTop = '15px';
    listContainer.innerHTML = '<p style="color:#999;">正在載入最新公告...</p>';
    
    // 將列表附加到 infoContent 內
    infoContent.appendChild(listContainer);
    
    // 從 Firebase 讀取公告 (依時間倒序，取前 10 筆)
    db.collection("announcements").orderBy("createdAt", "desc").limit(10).get()
    .then((querySnapshot) => {
        let html = '<h4 style="color: var(--primary); margin-top:20px;">📢 最新公告</h4>';
        
        if (querySnapshot.empty) {
            html += '<p style="color:#666; font-size:0.9rem;">目前沒有新公告。</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const docId = doc.id;
                
                // 格式化時間
                let dateStr = "剛剛";
                if (data.createdAt) {
                    const date = data.createdAt.toDate();
                    // 格式：M/D HH:mm
                    dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}`;
                }
                
                // 如果是管理員，顯示編輯/刪除按鈕
                let adminBtns = '';
                if (currentUser && currentUser.uid === ADMIN_UID) {
                    // 對內容編碼以防 XSS 或引號問題
                    const safeContent = encodeURIComponent(data.content);
                    adminBtns = `
                        <div style="margin-top: 8px; text-align: right; border-top: 1px dashed #ddd; padding-top: 5px;">
                            <button onclick="editAnnouncement('${docId}', '${safeContent}')" style="background:transparent; border:none; color:#f39c12; cursor:pointer; font-size:0.85rem; margin-right:10px;">✏️ 編輯</button>
                            <button onclick="deleteAnnouncement('${docId}')" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; font-size:0.85rem;">🗑️ 刪除</button>
                        </div>
                    `;
                }
                
                // 產生公告卡片 HTML
                html += `
                <div style="background: var(--bg); padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--warning);">
                    <div style="font-size: 0.95rem; color: var(--text-main); white-space: pre-wrap;">${data.content}</div>
                    <div style="text-align: right; font-size: 0.75rem; color: var(--text-sub); margin-top: 5px;">
                        ${dateStr}
                    </div>
                    ${adminBtns}
                </div>`;
            });
        }
        listContainer.innerHTML = html;
    })
    .catch((error) => {
        console.error("Error getting documents: ", error);
        listContainer.innerHTML = '<p style="color:var(--danger);">無法載入公告 (請確認網路)</p>';
    });
}

// --- 介面初始化 ---

// 應用程式初始化 (登入後呼叫)
function initUI() {
    loadTheme(); // 載入深色模式設定
    // 根據使用者類型顯示 badge
    document.getElementById('user-badge').innerText = userType === 'university' ? '大學部' : '高中部';
    
    // 顯示大學專用的欄位 (例如學分計算)
    const uniElements = document.querySelectorAll('.uni-only');
    uniElements.forEach(el => el.style.display = 'table-cell'); 
    
    // 執行各功能初始化
    switchDay(currentDay); // 課表
    loadGrades(); // 成績
    // 安全呼叫其他渲染函式
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable();
    if (typeof renderAnalysis === 'function') renderAnalysis();
}

// --- 學分設定 UI (高中/大學動態切換) ---

let isEditingCredits = false; // 紀錄是否處於編輯學分設定模式

// 渲染學分設定介面 (區分檢視模式與編輯模式)
function renderCreditSettings() {
    // 取得相關 DOM 容器
    const gradInput = document.getElementById('edit-grad-target');
    const textGradTarget = document.getElementById('text-grad-target');
    const viewUni = document.getElementById('view-settings-uni');
    const editUni = document.getElementById('edit-settings-uni');
    const viewHs = document.getElementById('view-settings-hs');
    const editHs = document.getElementById('edit-settings-hs');
    
    // 確保容器存在
    if (!viewUni || !viewHs) return;
    
    // 更新畢業總學分顯示
    if (gradInput) gradInput.value = graduationTarget;
    if (textGradTarget) textGradTarget.innerText = graduationTarget;
    
    let viewHtml = '';
    let editHtml = '';
    
    // --- 高中生模式介面 ---
    if (userType === 'highschool') {
        // 隱藏大學區塊，顯示高中區塊
        viewUni.style.display = 'none';
        editUni.style.display = 'none';
        viewHs.style.display = 'block';
        editHs.style.display = 'block';
        
        // 遍歷必修/選修
        ["必修", "選修"].forEach(type => {
            const target = categoryTargets[type] || 0;
            // 產生檢視 HTML
            viewHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:0.95rem;">
                <span style="color:var(--text-sub);">${type}</span>
                <span>${target}</span>
             </div>`;
            // 產生編輯 HTML (輸入框)
            editHtml += `<div style="margin-bottom: 12px;">
                <div style="font-weight: bold; color: var(--text-main); margin-bottom: 5px; font-size:0.9rem;">${type}學分</div>
                <input type="number" id="input-hs-${type}" value="${target}" 
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>`;
        });
        viewHs.innerHTML = viewHtml;
        editHs.innerHTML = editHtml;
    } 
    // --- 大學生模式介面 ---
    else {
        // 顯示大學區塊，隱藏高中區塊
        viewUni.style.display = 'block';
        editUni.style.display = 'block';
        viewHs.style.display = 'none';
        editHs.style.display = 'none';
        
        // 定義模組順序
        const order = ["通識", "院共同", "基礎", "核心", "專業", "自由"];
        order.forEach(cat => {
            const target = categoryTargets[cat];
            // 判斷該模組是單一數值還是物件 (分必/選修)
            let targetText = typeof target === 'object' ? `必${target['必修']} / 選${target['選修']}` : `${target}`;
            
            // 產生檢視 HTML
            viewHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:0.95rem;">
                    <span style="color:var(--text-sub);">${cat}</span>
                    <span>${targetText}</span>
                </div>`;
            
            // 產生編輯 HTML
            editHtml += `<div style="margin-bottom: 12px;">
                            <div style="font-weight: bold; color: var(--text-main); margin-bottom: 5px; font-size:0.9rem;">${cat}</div>
                            <div style="display: flex; gap: 10px;">`;
            
            if (typeof target === 'object') {
                // 如果是物件，顯示兩個輸入框 (必修/選修)
                editHtml += `
                    <div style="flex: 1;"><span style="font-size: 0.8rem;">必修</span><input type="number" id="input-${cat}-req" value="${target['必修']||0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>
                    <div style="flex: 1;"><span style="font-size: 0.8rem;">選修</span><input type="number" id="input-${cat}-ele" value="${target['選修']||0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>`;
            } else {
                // 如果是單一數值，顯示一個輸入框
                editHtml += `<div style="flex: 1;"><input type="number" id="input-${cat}-total" value="${target||0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>`;
            }
            editHtml += `</div></div>`;
        });
        viewUni.innerHTML = viewHtml;
        editUni.innerHTML = editHtml;
    }
}

// 切換學分設定的 檢視/編輯 模式
function toggleCreditEdit() {
    isEditingCredits = !isEditingCredits;
    const viewDiv = document.getElementById('credits-view-mode');
    const editDiv = document.getElementById('credits-edit-mode');
    const btn = document.getElementById('btn-edit-credits');
    
    if (isEditingCredits) {
        // 進入編輯模式：隱藏檢視、顯示編輯與儲存按鈕
        viewDiv.style.display = 'none';
        editDiv.style.display = 'block';
        btn.style.display = 'none';
    } else {
        // 回到檢視模式
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
        btn.style.display = 'block';
        renderCreditSettings(); // 重新渲染以顯示最新數值
    }
}

// --- 深色模式 (Dark Mode) ---

// 切換主題 (Light <-> Dark)
function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');// 取得目前主題屬性
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';// 切換
    root.setAttribute('data-theme', newTheme);// 設定 HTML 屬性 (讓 CSS 變數生效)
    localStorage.setItem('theme', newTheme);// 儲存到 LocalStorage
    updateThemeUI(newTheme);// 更新 UI 文字
}

// 載入已儲存的主題 (初始化時呼叫)
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

// 更新主題相關的 UI 顯示 (例如開關狀態文字)
function updateThemeUI(theme) {
    const statusEl = document.getElementById('theme-status');
    if (statusEl) {
        statusEl.innerText = theme === 'dark' ? 'ON' : 'OFF';
        statusEl.style.color = theme === 'dark' ? '#2ecc71' : '#ccc';
    }
    // 如果有圖表實例，可能需要重繪 (註解中留空)
    if (window.gradeChartInstance) {}
}

// --- 課表匯出功能 ---

// 使用 html2canvas 將週課表表格轉為圖片下載
function exportSchedule() {
    // 取得表格元素
    const table = document.querySelector('.weekly-table');
    if (!table) return;
    
    // 取得按鈕本身，以改變文字狀態
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ 處理中...";
    
    // 呼叫 html2canvas
    html2canvas(table, {
        scale: 2, // 提高解析度 (2x)
        backgroundColor: "#ffffff", // 設定背景白，避免透明
        useCORS: true // 允許跨域圖片 (若有)
    }).then(canvas => {
        // 建立虛擬下載連結
        const link = document.createElement('a');
        link.download = `我的課表_${currentSemester || 'export'}.png`; // 檔名
        link.href = canvas.toDataURL("image/png"); // 轉為 Base64
        link.click(); // 觸發下載
        
        // 恢復按鈕文字
        btn.innerHTML = originalText;
        showAlert("課表圖片已下載至您的裝置！", "匯出成功");
    }).catch(err => {
        console.error(err);
        btn.innerHTML = originalText;
        showAlert("圖片製作失敗，請稍後再試", "錯誤");
    });
}

// --- 公告管理功能 (管理員) ---

// 編輯公告
function editAnnouncement(docId, encodedContent) {
    // 解碼內容
    const oldContent = decodeURIComponent(encodedContent);
    // 使用 showPrompt 讓管理員輸入新內容
    showPrompt("修改公告內容：", oldContent, "✏️ 編輯公告")
    .then((newContent) => {
        // 若有輸入且不為空
        if (newContent !== null && newContent.trim() !== "") {
            // 更新 Firestore
            db.collection("announcements").doc(docId).update({
                content: newContent,
            })
            .then(() => {
                showAlert("公告已更新！", "成功");
                loadAnnouncements(); // 刷新列表
            })
            .catch((error) => {
                showAlert("更新失敗：" + error.message, "錯誤");
            });
        }
    });
}

// 刪除公告
function deleteAnnouncement(docId) {
    // 顯示確認框
    showConfirm("確定要永久刪除這則公告嗎？", "🗑️ 刪除確認")
    .then((isConfirmed) => {
        if (isConfirmed) {
            // 刪除 Firestore 文件
            db.collection("announcements").doc(docId).delete()
            .then(() => {
                showAlert("公告已刪除。", "完成");
                loadAnnouncements(); // 刷新列表
            })
            .catch((error) => {
                showAlert("刪除失敗：" + error.message, "錯誤");
            });
        }
    });

}

// 儲存學分設定 (按下儲存按鈕時觸發)
function saveCreditSettings() {
    // 取得畢業總學分
    const gradInput = document.getElementById('edit-grad-target');
    if (gradInput) {
        graduationTarget = parseInt(gradInput.value) || 128;
    }
    
    // 依據身分儲存各模組目標
    if (userType === 'highschool') {
        // 儲存高中目標
        ["必修", "選修"].forEach(type => {
            const el = document.getElementById(`input-hs-${type}`);
            if (el) {
                categoryTargets[type] = parseInt(el.value) || 0;
            }
        });
    } else {
        // 儲存大學目標
        const order = ["通識", "院共同", "基礎", "核心", "專業", "自由"];
        order.forEach(cat => {
            const reqInput = document.getElementById(`input-${cat}-req`);
            const eleInput = document.getElementById(`input-${cat}-ele`);
            const totalInput = document.getElementById(`input-${cat}-total`);
            
            // 判斷是雙欄位 (必/選) 還是單欄位
            if (reqInput && eleInput) {
                categoryTargets[cat] = {
                    "必修": parseInt(reqInput.value) || 0,
                    "選修": parseInt(eleInput.value) || 0
                };
            } else if (totalInput) {
                categoryTargets[cat] = parseInt(totalInput.value) || 0;
            }
        });
    }
    
    saveData(); // 呼叫 data.js 的存檔函式
    renderCreditSettings(); // 刷新顯示
    if (typeof renderAnalysis === 'function') renderAnalysis(); // 若有圖表則更新
    showAlert("學分標準設定已儲存！", "成功");
    toggleCreditEdit(); // 關閉編輯模式
}

// 修改顯示名稱的功能
function editUserTitle() {
    showPrompt("請輸入要在 APP 中顯示的名稱或稱號", userTitle, "設定顯示名稱")
    .then(newName => {
        if (newName && newName.trim() !== "") {
            userTitle = newName.trim();
            saveData(); // 存檔
            refreshUI(); // 刷新畫面
            showAlert("名稱已更新！");
        }
    });
}

// --- 通知中心 APP 邏輯 ---

// 渲染通知設定介面
window.renderNotificationApp = function() {
    const list = document.getElementById('notification-settings-list');
    if (!list) return;

    // 輔助函式：產生開關 HTML
    const createToggle = (key, title, desc, icon) => {
        const isOn = notificationSettings[key];
        const statusColor = isOn ? 'var(--primary)' : '#ccc';
        const statusText = isOn ? 'ON' : 'OFF';
        
        return `
        <div class="settings-item" onclick="toggleNotificationSetting('${key}')" style="padding: 20px 10px;">
            <div style="display:flex; align-items:center;">
                <span style="font-size:1.5rem; margin-right:15px; background:#f0f0f0; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:12px;">${icon}</span>
                <div>
                    <div style="font-weight:bold; font-size:1rem; margin-bottom:4px;">${title}</div>
                    <div style="font-size:0.85rem; color:#888;">${desc}</div>
                </div>
            </div>
            <div style="font-size:1.2rem; font-weight:bold; color: ${statusColor};">
                ${statusText}
            </div>
        </div>`;
    };

    list.innerHTML = 
        createToggle('course', '課前提醒', '上課前 10 分鐘自動發送通知', '📚') +
        createToggle('daily', '每日晨報', '每天 07:00 摘要今日行程', '☀️') +
        createToggle('anniversary', '紀念日提醒', '重要日子當天早上發送提醒', '💝');
}

// 切換設定
window.toggleNotificationSetting = function(key) {
    // 切換狀態
    notificationSettings[key] = !notificationSettings[key];
    // 存檔
    saveData();
    // 重新渲染以更新畫面 (ON/OFF)
    renderNotificationApp();
    
    // 給予簡單的回饋
    const status = notificationSettings[key] ? "已開啟" : "已關閉";
    // 如果有 showAlert 可以用，不然用 console
    if(window.showAlert) showAlert(`${status}通知`, "設定更新");
}