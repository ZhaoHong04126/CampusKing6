// 渲染學期下拉選單
function renderSemesterOptions() {
    const select = document.getElementById('semester-select');
    if (!select) return; //防止找不到元素
    select.innerHTML = '';
    
    // 排序學期 (例如 114-1, 113-2...)
    semesterList.sort().reverse();
    semesterList.forEach(sem => {
        const option = document.createElement('option');
        option.value = sem;
        option.text = sem;
        if (sem === currentSemester) option.selected = true;
        select.appendChild(option);
    });
}

// 切換學期 (綁定在下拉選單 onChange)
function switchSemester() {
    // 抓取使用者選擇的新學期
    const select = document.getElementById('semester-select'); // 修正：原檔名可能有拼字錯誤 semster
    const newSemester = select.value;
    
    saveData(); // 儲存舊學期資料 (備份當前狀態)
    currentSemester = newSemester; // 更新全域學期變數
    loadSemesterData(currentSemester); // 載入新學期資料
    refreshUI(); // 強制刷新畫面
}

// 新增學期
function addNewSemester() {
    showPrompt("請輸入新學期名稱 (例如: 114-1)", "114-2", "新增學期")
    .then(newSemName => {
        if (newSemName) {
            saveData(); //先存檔目前狀態

            if (semesterList.includes(newSemName)) {
                showAlert("這個學期已經存在囉！", "重複");
                currentSemester = newSemName; // 若已存在則切換過去
            } else {
                semesterList.push(newSemName);
                currentSemester = newSemName;
                // 初始化新學期的空資料結構
                allData[newSemName] = { 
                    schedule: JSON.parse(JSON.stringify(defaultSchedule)),
                    grades: [],// 空的成績陣列
                    regularExams: {},// 空的平常考物件
                    midtermExams: {},// 空的段考物件
                    calendarEvents: [],// 空的行事曆陣列
                    accounting: [],// 空的記帳陣列
                    notes: [],// 空的筆記陣列
                    anniversaries: [],//空的紀念日陣列
                    learning: [],//空的學習進度陣列
                };
            }

            loadSemesterData(currentSemester);
            saveData(); // 存檔新學期
            renderSemesterOptions(); // 刷新全介面
            showAlert(`已切換至 ${newSemName}`, "成功");
        }
    });
}

// 修改學期名稱
function editSemester() {
    showPrompt("請輸入新的學期名稱", currentSemester, "修改名稱")
    .then(newName => {
        if (newName && newName !== currentSemester) {
            if (semesterList.includes(newName)) {
                showAlert("名稱重複！", "錯誤");
                return;
            } 
            // 搬移資料
            allData[newName] = allData[currentSemester];
            delete allData[currentSemester];
            
            // 更新列表
            const index = semesterList.indexOf(currentSemester);
            semesterList[index] = newName;
            currentSemester = newName;

            saveData();//存檔
            renderSemesterOptions();// 刷新全介面
            showAlert("修改成功！", "完成");
        }
    });
}

// 刪除學期
function deleteSemester() {
    if (semesterList.length <= 1) {
        showAlert("至少要保留一個學期，無法刪除！", "無法執行");
        return;
    }
    
    showConfirm(`確定要刪除「${currentSemester}」的所有資料嗎？此動作無法復原！`, "刪除確認")
    .then(isConfirmed => {
        if (isConfirmed) {
            delete allData[currentSemester];
            semesterList = semesterList.filter(s => s !== currentSemester);
            // 刪除後自動切換到列表中的第一個
            currentSemester = semesterList[0];

            saveData();//存檔
            loadSemesterData(currentSemester);
            refreshUI();//刷新 UI
            showAlert("已刪除並切換至上一個學期", "完成");
        }
    });
}

// 儲存學期日期設定 (開學/結束日)
function saveSemesterDates() {
    // 取得輸入值
    const startVal = document.getElementById('setting-sem-start').value;
    const endVal = document.getElementById('setting-sem-end').value;

    // 驗證
    if (!startVal) {
        showAlert("請至少設定「學期開始日」！", "無法儲存");
        return;
    }
    
    // 更新變數
    semesterStartDate = startVal;
    semesterEndDate = endVal;

    saveData();// 存檔
    refreshUI(); //更新介面

    showAlert("學期日期已更新！", "儲存成功");
    
    toggleSemesterEdit();// 關閉編輯模式
}

// 更新學期設定介面顯示
function renderSemesterSettings() {
    const startInput = document.getElementById('setting-sem-start');
    const endInput = document.getElementById('setting-sem-end');
    const startText = document.getElementById('text-sem-start');
    const endText = document.getElementById('text-sem-end');
    
    if (startInput) startInput.value = semesterStartDate;
    if (endInput) endInput.value = semesterEndDate;
    if (startText) startText.innerText = semesterStartDate || "未設定";
    if (endText) endText.innerText = semesterEndDate || "未設定";
    
    updateSemesterStatus(); // 更新週次顯示
}

// 計算並顯示目前週次 (在首頁與設定頁)
function updateSemesterStatus() {
    const statusDiv = document.getElementById('semester-status-text');
    if (!statusDiv) return;

    if (!semesterStartDate) {
        statusDiv.innerText = "尚未設定學期開始日";
        statusDiv.style.color = "#999";
        return;
    }

    const start = new Date(semesterStartDate);
    const now = new Date();
    const end = semesterEndDate ? new Date(semesterEndDate) : null;

    // 計算天數差異
    const diffTime = now - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 如果還沒開始
    if (diffDays < 0) {
        statusDiv.innerText = `距離開學還有 ${Math.abs(diffDays)} 天`;
        statusDiv.style.color = "#f39c12";
    } else {
        // 計算週次 (假設開學日為第1週)
        const weekNum = Math.ceil(diffDays / 7);
        
        // 如果已經結束
        if (end && now > end) {
             statusDiv.innerText = "學期已結束";
             statusDiv.style.color = "#999";
        } else {
             statusDiv.innerText = `🟢 目前是 第 ${weekNum} 週`;
             statusDiv.style.color = "var(--primary)";
        }
    }
}

let isEditingSemester = false;
// 切換學期日期的檢視/編輯模式
function toggleSemesterEdit() {
    isEditingSemester = !isEditingSemester;
    const viewDiv = document.getElementById('semester-date-view-mode');
    const editDiv = document.getElementById('semester-date-edit-mode');
    const btn = document.getElementById('btn-edit-semester-dates');

    if (isEditingSemester) {
        // 進入編輯模式
        viewDiv.style.display = 'none';
        editDiv.style.display = 'block';
        btn.style.display = 'none';
        
        // 確保輸入框裡有值
        const startInput = document.getElementById('setting-sem-start');
        const endInput = document.getElementById('setting-sem-end');
        if(startInput) startInput.value = semesterStartDate;
        if(endInput) endInput.value = semesterEndDate;

    } else {
        // 回到檢視模式
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
        btn.style.display = 'block';
        
        // 刷新文字顯示
        renderSemesterSettings();
    }
}