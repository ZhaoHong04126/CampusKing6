// 渲染紀念日列表的主函式
function renderAnniversaries() {
    // 取得顯示列表的容器元素
    const listDiv = document.getElementById('anniversary-list');
    
    if (!listDiv) return;// 若找不到容器則結束

    // 排序：依照日期先後排序列表
    anniversaryList.sort((a, b) => new Date(a.date) - new Date(b.date));

    let html = '';// 初始化 HTML 字串
    const now = new Date();// 取得現在時間
    // 將現在時間設為當天的 00:00:00，避免計算誤差（只比較日期）
    now.setHours(0,0,0,0);

    // 如果列表為空
    if (anniversaryList.length === 0) {
        // 顯示預設的引導文字
        html = '<p style="color:#999; text-align:center; padding: 20px;">💝 新增第一個到數日吧！<br>(例如：交往紀念、生日倒數)</p>';
    } else {
        // 遍歷所有紀念日
        anniversaryList.forEach((item, index) => {
            const targetDate = new Date(item.date);// 建立目標日期的 Date 物件
            targetDate.setHours(0,0,0,0);// 同樣將時間設為 00:00:00
            
            // 計算現在與目標的時間差 (毫秒)
            const diffTime = now - targetDate;
            // 換算成天數 (毫秒 -> 秒 -> 分 -> 時 -> 天)
            // Math.floor 取整數
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // 初始化顯示變數
            let statusText = "";
            let daysText = "";
            let colorClass = "";

            // 如果天數差為 0，代表是今天
            if (diffDays === 0) {
                statusText = "就是今天！";
                daysText = "TODAY";
                colorClass = "color: #e74c3c; font-weight:bold;"; // 紅色
            } else if (diffDays > 0) {
                // 如果大於 0，代表日期已過去
                statusText = "已過去";
                daysText = `${diffDays} 天`;
                colorClass = "color: #7f8c8d;"; // 灰色
            } else {
                // 如果小於 0，代表是未來的日期 (還有幾天)
                statusText = "還有";
                daysText = `${Math.abs(diffDays)} 天`; // 取絕對值
                colorClass = "color: #27ae60; font-weight:bold;"; // 綠色
            }

            // 組合該紀念日的 HTML 區塊
            html += `
            <div style="background: white; border-bottom: 1px solid #eee; padding: 15px 0; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-main); margin-bottom: 4px;">${item.title}</div>
                    <div style="font-size: 0.85rem; color: #888;">${item.date} (${statusText})</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size: 1.4rem; ${colorClass}">${daysText}</div>
                    <button onclick="deleteAnniversary(${index})" style="background:transparent; border:none; color:#e74c3c; font-size:0.8rem; cursor:pointer; margin-top:5px; opacity: 0.7;">🗑️ 刪除</button>
                </div>
            </div>`;
        });
    }
    
    listDiv.innerHTML = html;// 將 HTML 寫入容器
}

// 開啟新增紀念日視窗
function openAnniversaryModal() {
    document.getElementById('anniversary-modal').style.display = 'flex';// 顯示 Modal
    document.getElementById('input-anniv-title').value = '';// 清空標題輸入框
    document.getElementById('input-anniv-date').value = '';// 清空日期輸入框
}

// 關閉新增紀念日視窗
function closeAnniversaryModal() {
    // 隱藏 Modal
    document.getElementById('anniversary-modal').style.display = 'none';
}

// 新增紀念日邏輯
function addAnniversary() {
    const title = document.getElementById('input-anniv-title').value;// 取得使用者輸入的標題
    const date = document.getElementById('input-anniv-date').value;// 取得使用者輸入的日期

    // 驗證輸入
    if (!title || !date) {
        showAlert("請輸入標題與日期", "資料不全");
        return;
    }

    anniversaryList.push({ title, date });// 將新資料加入全域列表
    saveData();// 存檔
    closeAnniversaryModal();// 關閉視窗
    renderAnniversaries();// 重新渲染列表
    showAlert("紀念日已新增！", "成功");// 顯示成功訊息
}

// 刪除紀念日邏輯
function deleteAnniversary(index) {
    // 顯示確認對話框
    showConfirm("確定要刪除這個紀念日嗎？", "刪除確認").then(ok => {
        // 如果確認
        if (ok) {
            anniversaryList.splice(index, 1);// 從列表中移除
            saveData();// 存檔
            renderAnniversaries();// 重新渲染
        }
    });
}