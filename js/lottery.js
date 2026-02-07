// --- 幸運籤筒功能 ---

let currentCategoryIndex = 0;
let isDrawing = false;
let drawInterval = null;

// 預設資料 (如果使用者完全沒資料時使用)
const defaultLotteryData = [
    {
        title: "午餐吃什麼",
        items: ["麥當勞", "學餐", "便利商店", "便當", "不吃"]
    },
    {
        title: "飲料喝什麼",
        items: ["紅茶", "綠茶", "奶茶", "開水", "咖啡"]
    }
];

// 渲染籤筒介面
function renderLottery() {
    const listDiv = document.getElementById('lottery-list');
    const select = document.getElementById('lottery-category-select');
    
    if (!listDiv || !select) return;

    // 1. 渲染分類下拉選單
    select.innerHTML = '';
    lotteryList.forEach((cat, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = cat.title;
        if (index === currentCategoryIndex) option.selected = true;
        select.appendChild(option);
    });

    // 2. 渲染目前分類的選項列表
    const currentData = lotteryList[currentCategoryIndex];
    let html = '';
    
    if (currentData && currentData.items.length > 0) {
        currentData.items.forEach((item, index) => {
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px; border-bottom: 1px solid #eee;">
                <span style="font-size: 1rem;">${item}</span>
                <button onclick="deleteLotteryItem(${index})" style="background:transparent; border:none; color:#ccc; cursor:pointer;">✖</button>
            </div>`;
        });
    } else {
        html = '<p style="color:#999; text-align:center; padding:10px;">這裡空空的，加點選項吧！</p>';
    }
    listDiv.innerHTML = html;
}

// 切換分類
function switchLotteryCategory() {
    const select = document.getElementById('lottery-category-select');
    currentCategoryIndex = parseInt(select.value);
    renderLottery();
}

// 新增選項
function addLotteryItem() {
    const input = document.getElementById('input-lottery-item');
    const val = input.value.trim();
    
    if (!val) return;

    // 加入目前分類
    lotteryList[currentCategoryIndex].items.push(val);
    input.value = ''; // 清空輸入框
    
    saveData();
    renderLottery();
}

// 刪除選項
function deleteLotteryItem(index) {
    lotteryList[currentCategoryIndex].items.splice(index, 1);
    saveData();
    renderLottery();
}

// 新增分類 (例如：晚餐、消夜)
function addNewLotteryCategory() {
    showPrompt("請輸入新分類名稱 (例如: 晚餐)", "", "新增籤筒")
    .then(title => {
        if (title) {
            lotteryList.push({
                title: title,
                items: []
            });
            currentCategoryIndex = lotteryList.length - 1; // 切換到新的
            saveData();
            renderLottery();
        }
    });
}

// 刪除目前的分類
function deleteLotteryCategory() {
    if (lotteryList.length <= 1) {
        showAlert("至少要保留一個分類！");
        return;
    }
    const currentTitle = lotteryList[currentCategoryIndex].title;
    
    showConfirm(`確定要刪除「${currentTitle}」嗎？`, "刪除確認").then(ok => {
        if (ok) {
            lotteryList.splice(currentCategoryIndex, 1);
            currentCategoryIndex = 0; // 回到第一個
            saveData();
            renderLottery();
        }
    });
}

// --- 抽籤核心邏輯 (動畫) ---
function startLottery() {
    if (isDrawing) return; // 防止重複點擊

    const currentItems = lotteryList[currentCategoryIndex].items;
    
    if (currentItems.length < 2) {
        showAlert("至少要有兩個選項才能抽喔！");
        return;
    }

    const resultBox = document.getElementById('lottery-result-text');
    const btn = document.getElementById('btn-draw');
    
    isDrawing = true;
    btn.disabled = true;
    btn.innerText = "👀 命運轉動中...";
    resultBox.style.color = "var(--primary)";

    let count = 0;
    const totalTime = 30; // 跑幾次跳動 (決定動畫時間長度)
    
    // 開始快速跳動
    drawInterval = setInterval(() => {
        // 隨機顯示一個
        const randIndex = Math.floor(Math.random() * currentItems.length);
        resultBox.innerText = currentItems[randIndex];
        
        count++;
        // 停止條件
        if (count > totalTime) {
            clearInterval(drawInterval);
            finishDraw(resultBox, btn);
        }
    }, 50 + (count * 2)); // 這裡其實是固定的 50ms，若要變速需用遞迴 setTimeout，這裡用 setInterval 簡單處理
}

function finishDraw(resultBox, btn) {
    // 最終決定 (再隨機一次確保公平)
    const currentItems = lotteryList[currentCategoryIndex].items;
    const finalIndex = Math.floor(Math.random() * currentItems.length);
    const winner = currentItems[finalIndex];

    resultBox.innerText = `🎉 ${winner} 🎉`;
    resultBox.style.color = "#e74c3c"; // 結果變紅色
    resultBox.style.transform = "scale(1.2)";
    resultBox.style.transition = "transform 0.2s";
    
    // 稍微復原特效
    setTimeout(() => {
        resultBox.style.transform = "scale(1)";
    }, 200);

    isDrawing = false;
    btn.disabled = false;
    btn.innerText = "🎲 再抽一次";
}