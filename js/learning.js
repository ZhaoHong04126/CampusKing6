// 渲染學習進度列表
function renderLearning() {
    const listDiv = document.getElementById('learning-list');
    if (!listDiv) return;

    // 若無目標顯示預設提示
    if (learningList.length === 0) {
        listDiv.innerHTML = `
            <div style="text-align:center; padding:30px; color:#999;">
                <div style="font-size:3rem; margin-bottom:10px;">📚</div>
                <p>還沒有設定學習目標<br>點擊下方按鈕新增一個吧！</p>
            </div>`;
        return;
    }

    let html = '';
    learningList.forEach((item, index) => {
        const current = parseFloat(item.current) || 0;
        const total = parseFloat(item.total) || 1;
        // 計算百分比
        let percent = Math.min(Math.round((current / total) * 100), 100);
        
        // 進度顏色：完成=綠, 落後=紅, 進行中=橘 (這裡簡單邏輯：<30紅, >=100綠)
        let color = '#f39c12';
        if (percent >= 100) color = '#2ecc71';
        else if (percent < 30) color = '#e74c3c';

        html += `
        <div class="card" style="margin-bottom: 15px; padding: 15px; border-left: 5px solid ${color};">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 8px;">
                <div>
                    <div style="font-weight:bold; font-size:1.1rem; color:var(--text-main);">${item.subject}</div>
                    <div style="font-size:0.9rem; color:#666;">${item.content}</div>
                </div>
                <button onclick="deleteLearningTask(${index})" style="background:transparent; border:none; color:#ccc; cursor:pointer;">✖</button>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <div style="font-size:0.9rem; color:var(--primary); font-weight:bold;">
                    ${current} / ${total} <span style="font-size:0.8rem; color:#888;">${item.unit}</span>
                    <span style="font-size:0.8rem; margin-left:5px; color:${color}">(${percent}%)</span>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="btn" onclick="updateLearningProgress(${index}, -1)" style="padding:4px 12px; background:#eee; color:#555; width:auto;">-</button>
                    <button class="btn" onclick="updateLearningProgress(${index}, 1)" style="padding:4px 12px; background:#eee; color:#555; width:auto;">+</button>
                </div>
            </div>
            <div style="background: #eee; border-radius: 6px; height: 8px; width: 100%; overflow: hidden;">
                <div style="background: ${color}; width: ${percent}%; height: 100%; transition: width 0.3s;"></div>
            </div>
        </div>`;
    });
    listDiv.innerHTML = html;
}

// 更新進度 (增加或減少)
function updateLearningProgress(index, delta) {
    const item = learningList[index];
    let newVal = (parseFloat(item.current) || 0) + delta;
    if (newVal < 0) newVal = 0; // 防止負數
    item.current = newVal;
    saveData();//存檔
    renderLearning();//渲染畫面
}

// 新增任務
function addLearningTask() {
    const subject = document.getElementById('input-learn-subject').value;
    const content = document.getElementById('input-learn-content').value;
    const total = document.getElementById('input-learn-total').value;
    const unit = document.getElementById('input-learn-unit').value;
    const current = document.getElementById('input-learn-current').value;

    if (!subject || !total) { showAlert("請輸入科目與目標"); return; }

    learningList.push({
        subject,
        content: content || "進度追蹤",
        total: parseFloat(total),
        current: parseFloat(current) || 0,
        unit: unit || "頁"
    });
    saveData();
    closeLearningModal();
    renderLearning();
    showAlert("目標已建立！");
}

// 刪除任務
function deleteLearningTask(index) {
    if(confirm("確定刪除？")) {
        learningList.splice(index, 1);
        saveData();
        renderLearning();
    }
}

// Modal 控制
function openLearningModal() {
    document.getElementById('learning-modal').style.display = 'flex';
    document.getElementById('input-learn-subject').value = '';
    document.getElementById('input-learn-total').value = '';
}
function closeLearningModal() {
    document.getElementById('learning-modal').style.display = 'none';
}