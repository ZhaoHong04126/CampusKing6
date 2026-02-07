// 紀錄目前正在編輯的成績在 gradeList 陣列中的索引位置
let editingGradeIndex = -1;

// 載入並渲染學期成績列表 (計算 GPA 與總學分)
function loadGrades() {
    const tb = document.getElementById('grade-body');// 取得表格的 tbody 元素 (用來放成績列)
    if (!tb) return;// 如果找不到元素 (可能不在成績頁面)，則直接結束函式
    tb.innerHTML = '';// 清空目前的表格內容，避免重複堆疊
    
    // 初始化統計變數
    //  加權    總學分   實得學分
    let ts = 0, tc = 0, ec = 0;
    
    // 遍歷所有成績資料 (gradeList 是全域變數，存放在 data.js/state.js)
    gradeList.forEach(g => {
        // 取得學分，預設為 1
        const cr = parseFloat(g.credit) || 1,
            sc = parseFloat(g.score) || 0,// 取得分數，預設為 0
            pass = sc >= 60;// 判斷是否及格 (大於等於 60 分)
        
        if (pass) ec += cr;// 如果及格，累加到實得學分
        ts += sc * cr;// 累加加權總分 (分數 * 學分)
        tc += cr;// 累加總學分 (無論是否及格都要算在分母)
        
        // 產生表格的一列 (Row) HTML
        // 根據是否及格，分數顯示綠色或紅色
        tb.innerHTML += `<tr>
            <td>${g.subject}</td>
            <td>${cr}</td>
            <td>${pass ? cr : 0}</td>
            <td style="font-weight:bold; color:${pass ? '#2ecc71' : '#e74c3c'}">${sc}</td>
        </tr>`;
    }); 
    
    let avg = 0; // 計算加權平均
    if (tc > 0) avg = ts / tc; // 避免除以 0 的錯誤
    // 更新介面上顯示的平均分數 (保留一位小數) 與實得學分
    document.getElementById('average-score').innerHTML = `加權平均: ${avg.toFixed(1)} <span style="font-size:0.8rem; color:#666;">(實得${ec}學分)</span>`;
}

// 渲染編輯 Modal (彈出視窗) 中的成績列表
// 讓使用者可以在新增/修改視窗中看到目前已有的成績
function renderGradeEditList() {
    // 取得列表容器
    const listDiv = document.getElementById('current-grade-list');
    let html = ''; 
    // 遍歷成績列表產生卡片式介面
    gradeList.forEach((item, i) => {
        const info = `${item.credit}學分 | ${item.score}分`;
        html += `
        <div class="course-list-item">
            <div class="course-info">
                <div class="course-name">${item.subject}</div>
                <div class="course-time">${info}</div>
            </div>
            <div>
                <button class="btn-edit" onclick="editGrade(${i})">修改</button>
                <button class="btn-delete" onclick="deleteGrade(${i})">刪除</button>
            </div>
        </div>`;
    });
    // 如果沒有成績，顯示提示文字
    listDiv.innerHTML = html || '<p style="color:#999; text-align:center">無成績</p>';
}

// 準備編輯某筆成績 (將資料回填到輸入框)
function editGrade(index) {
    // 根據索引取得該筆成績資料
    const item = gradeList[index];
    if (!item) return;

    // 確保下拉選單是最新的 (包含課表中的科目)
    updateExamSubjectOptions(); 

    // 取得相關輸入框元素
    const sel = document.getElementById('input-grade-subject-select'); // 下拉選單
    const txt = document.getElementById('input-grade-subject-text');// 手動輸入框
    const btn = document.getElementById('btn-toggle-input');// 切換模式按鈕
    
    // 檢查該科目是否存在於下拉選單中
    const optionExists = sel.querySelector(`option[value="${item.subject}"]`);

    // 如果選單中有該科目，則切換到「選單模式」並選中它
    if (optionExists) {
        sel.style.display = 'block';
        txt.style.display = 'none';
        btn.innerText = "✏️";
        sel.value = item.subject;
    } else {
        // 如果選單中沒有，則切換到「手動輸入模式」並填入文字
        sel.style.display = 'none';
        txt.style.display = 'block';
        btn.innerText = "📜";
        txt.value = item.subject;
    }

    // 回填分類、修別、學分、分數
    document.getElementById('input-grade-category').value = item.category || '通識';
    document.getElementById('input-grade-nature').value = item.nature || '必修';
    document.getElementById('input-grade-credit').value = item.credit || '';
    document.getElementById('input-grade-score').value = item.score || '';

    // 設定全域變數，標記目前正在編輯哪一筆資料
    editingGradeIndex = index;
    
    // 改變按鈕文字與顏色，提示使用者目前是「保存修改」而非「新增」
    const saveBtn = document.getElementById('btn-add-grade');
    if (saveBtn) {
        saveBtn.innerText = "💾 保存修改";
        saveBtn.style.background = "#f39c12";
    }
}

// 新增或儲存成績到列表
function addGrade() {
    const sel = document.getElementById('input-grade-subject-select');
    const txt = document.getElementById('input-grade-subject-text');
    
    // 判斷目前是使用選單還是手動輸入，來決定科目名稱來源
    let s = (sel.style.display !== 'none') ? sel.value : txt.value;

    // 取得其他欄位值
    const category = document.getElementById('input-grade-category').value;
    const nature = document.getElementById('input-grade-nature').value;
    const c = document.getElementById('input-grade-credit').value;
    const sc = document.getElementById('input-grade-score').value;

    // 簡單驗證：科目與分數必須存在
    if (s && sc) {
        // 建立成績物件
        const gradeData = {
            subject: s, 
            category: category, 
            nature: nature,
            credit: parseInt(c) || 0, // 轉為整數
            score: parseInt(sc) || 0  // 轉為整數
        };

        // 如果 editingGradeIndex > -1，代表是編輯舊資料
        if (editingGradeIndex > -1) {
            gradeList[editingGradeIndex] = gradeData;
            showAlert("成績修改成功！");
        } else {
            // 否則為新增資料，推入陣列
            gradeList.push(gradeData);
        }

        resetGradeInput(); // 重置輸入框狀態
        saveData();// 儲存資料到本地/雲端 (data.js)
        renderGradeEditList();// 重新渲染列表
    } else showAlert('資料不完整，請檢查科目與分數', '錯誤');
}

// 重置成績輸入框與狀態 (恢復成新增模式)
function resetGradeInput() {
    // 恢復顯示下拉選單，隱藏手動輸入框
    document.getElementById('input-grade-subject-select').style.display = 'block';
    document.getElementById('input-grade-subject-text').style.display = 'none';
    document.getElementById('btn-toggle-input').innerText = "✏️";
    
    // 清空值
    document.getElementById('input-grade-subject-select').value = '';
    document.getElementById('input-grade-subject-text').value = '';
    // 預設分類與修別
    document.getElementById('input-grade-category').value = '通識'; 
    document.getElementById('input-grade-nature').value = '必修';
    // 根據使用者身分預設學分 (大學預設3，高中預設1)
    document.getElementById('input-grade-credit').value = userType === 'university' ? '3' : '1';
    document.getElementById('input-grade-score').value = '';
    
    // 重置編輯索引為 -1
    editingGradeIndex = -1;
    
    // 恢復按鈕樣式
    const btn = document.getElementById('btn-add-grade');
    if (btn) {
        btn.innerText = "+ 加入成績單";
        btn.style.background = "#333";
    }
}

// 刪除成績
function deleteGrade(i) {
    // 顯示確認對話框
    showConfirm('確定刪除此成績？', '刪除確認').then(ok => {
        if (ok) {
            if (editingGradeIndex === i) resetGradeInput();// 如果正在編輯這筆資料，先重置輸入框以免出錯
            gradeList.splice(i, 1);// 從陣列移除
            saveData();// 存檔
            renderGradeEditList();//刷新介面
        }
    });
}

// 開啟成績管理 Modal
function openGradeModal() {
    updateExamSubjectOptions();// 開啟前先更新科目選單
    document.getElementById('grade-modal').style.display = 'flex';// 顯示 Modal
    // 確保學分輸入框顯示 (因為有些情境可能被隱藏)
    const g = document.getElementById('input-credit-group');
    if (g) g.style.display = 'block'; 
    resetGradeInput(); // 重置輸入狀態
    renderGradeEditList();// 渲染現有列表
}

// 關閉成績管理 Modal
function closeGradeModal() {
    document.getElementById('grade-modal').style.display = 'none';
    resetGradeInput();
}

// 更新所有成績相關 Modal 中的「科目下拉選單」
// 這會自動抓取「課表」中的科目名稱，讓使用者不用手打
function updateExamSubjectOptions() {
    // 取得三個主要選單：平常考、段考、學期成績
    const regSelect = document.getElementById('regular-subject-select');
    const midSelect = document.getElementById('midterm-subject-select');
    const gradeSelect = document.getElementById('input-grade-subject-select'); 
    
    // 如果找不到元素則結束
    if (!regSelect || !midSelect || !gradeSelect) return;

    // 暫存目前使用者選中的值，以免刷新後被洗掉
    const regVal = regSelect.value;
    const midVal = midSelect.value;
    const gradeVal = gradeSelect.value;

    // 清空選項並加入預設值
    const placeholder = '<option value="" disabled selected>選擇科目</option>';
    regSelect.innerHTML = placeholder
    midSelect.innerHTML = placeholder;
    gradeSelect.innerHTML = placeholder;

    // 使用 Set 來儲存科目名稱，自動過濾重複的
    let allSubjects = new Set(); 
    // 遍歷每週課表，收集所有科目
    Object.values(weeklySchedule).forEach(dayCourses => {
        dayCourses.forEach(course => {
            if (course.subject) allSubjects.add(course.subject);
        });
    });

    // 將科目排序後建立 option 元素並加入到三個選單中
    Array.from(allSubjects).sort().forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.innerText = sub;
        // cloneNode(true) 是因為一個 DOM 元素只能存在一個地方，要複製三份
        regSelect.appendChild(opt.cloneNode(true));
        midSelect.appendChild(opt.cloneNode(true));
        gradeSelect.appendChild(opt.cloneNode(true));
    });

    // 如果之前有選中值，嘗試選回去
    if (regVal) regSelect.value = regVal;
    if (midVal) midSelect.value = midVal;
    if (gradeVal) gradeSelect.value = gradeVal;
}

// 監聽下拉選單變更事件，當使用者切換科目時，自動載入該科目的考試成績
document.addEventListener('change', (e) => {
    if (e.target.id === 'regular-subject-select') renderRegularExams();
    else if (e.target.id === 'midterm-subject-select') renderMidtermExams();
});

// 渲染平常考 (小考) 列表
function renderRegularExams() {
    const subject = document.getElementById('regular-subject-select').value;
    const tbody = document.getElementById('regular-exam-body');
    if (!tbody) return;

    // 如果沒選科目
    if (!subject) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">👈 請先選擇科目</td></tr>';
        return;
    }

    // 從 regularExams 物件中取得該科目的成績陣列
    const scores = regularExams[subject] || [];
    // 如果沒資料
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">📭 目前無紀錄</td></tr>';
    } else {
        // 產生列表 HTML
        tbody.innerHTML = scores.map((item, index) => `
            <tr>
                <td style="text-align:left; padding-left:10px;">
                    ${item.title}
                    <span onclick="deleteRegularExam(${index})" style="cursor:pointer; color:#e74c3c; margin-left:5px; font-size:0.8rem;">🗑️</span>
                </td>
                <td style="font-weight:bold; color: var(--primary);">${item.score}</td>
            </tr>
        `).join('');
    }
}

// 渲染段考列表 (邏輯同上)
function renderMidtermExams() {
    const subject = document.getElementById('midterm-subject-select').value;
    const tbody = document.getElementById('midterm-exam-body');
    if (!tbody) return;

    if (!subject) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">👈 請先選擇科目</td></tr>';
        return;
    }

    const scores = midtermExams[subject] || [];
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">📭 目前無紀錄</td></tr>';
    } else {
        tbody.innerHTML = scores.map((item, index) => `
            <tr>
                <td style="text-align:left; padding-left:10px;">
                    ${item.title}
                    <span onclick="deleteMidtermExam(${index})" style="cursor:pointer; color:#e74c3c; margin-left:5px; font-size:0.8rem;">🗑️</span>
                </td>
                <td style="font-weight:bold; color: var(--primary);">${item.score}</td>
            </tr>
        `).join('');
    }
}
// 開啟平常考新增視窗
function openRegularModal() {
    const subject = document.getElementById('regular-subject-select').value;
    if (!subject) { showAlert("請先在上方選單選擇一個科目！"); return; }// 必須先選科目才能新增
    // 在 Modal 標題顯示目前科目
    document.getElementById('modal-regular-subject-name').innerText = subject;
    // 清空輸入框
    document.getElementById('input-regular-name').value = '';
    document.getElementById('input-regular-score').value = '';
    // 顯示 Modal
    document.getElementById('regular-exam-modal').style.display = 'flex';
}
// 關閉平常考 Modal
function closeRegularModal() {
    document.getElementById('regular-exam-modal').style.display = 'none';
}
// 新增平常考成績
function addRegularExam() {
    const subject = document.getElementById('regular-subject-select').value;
    const name = document.getElementById('input-regular-name').value;
    const score = document.getElementById('input-regular-score').value;

    if (!name || !score) { showAlert("請輸入名稱和分數"); return; }

    // 如果該科目還沒有成績陣列，先初始化
    if (!regularExams[subject]) regularExams[subject] = [];
    // 推入新成績
    regularExams[subject].push({ title: name, score: parseInt(score) || 0 });

    saveData(); 
    closeRegularModal();
    renderRegularExams(); 
}
// 刪除平常考成績
function deleteRegularExam(index) {
    const subject = document.getElementById('regular-subject-select').value;
    showConfirm("確定要刪除這筆成績嗎？").then(ok => {
        if(ok) {
            regularExams[subject].splice(index, 1);
            saveData();
            renderRegularExams();
        }
    });
}

// 開啟段考新增視窗 (邏輯同上)
function openMidtermModal() {
    const subject = document.getElementById('midterm-subject-select').value;
    if (!subject) { showAlert("請先在上方選單選擇一個科目！"); return; }
    document.getElementById('modal-midterm-subject-name').innerText = subject;
    document.getElementById('input-midterm-name').value = '';
    document.getElementById('input-midterm-score').value = '';
    document.getElementById('midterm-exam-modal').style.display = 'flex';
}
function closeMidtermModal() {
    document.getElementById('midterm-exam-modal').style.display = 'none';
}
// 新增段考成績
function addMidtermExam() {
    const subject = document.getElementById('midterm-subject-select').value;
    const name = document.getElementById('input-midterm-name').value;
    const score = document.getElementById('input-midterm-score').value;

    if (!name || !score) { showAlert("請輸入名稱和分數"); return; }

    if (!midtermExams[subject]) midtermExams[subject] = [];
    midtermExams[subject].push({ title: name, score: parseInt(score) || 0 });

    saveData();
    closeMidtermModal();
    renderMidtermExams();
}
// 刪除段考成績
function deleteMidtermExam(index) {
    const subject = document.getElementById('midterm-subject-select').value;
    showConfirm("確定要刪除這筆成績嗎？").then(ok => {
        if(ok) {
            midtermExams[subject].splice(index, 1);
            saveData();
            renderMidtermExams();
        }
    });
}

// 切換「下拉選單」與「手動輸入」科目的模式
function toggleGradeInputMode() {
    const sel = document.getElementById('input-grade-subject-select');
    const txt = document.getElementById('input-grade-subject-text');
    const btn = document.getElementById('btn-toggle-input');
    
    // 如果選單目前顯示，則隱藏選單，顯示文字框
    if (sel.style.display !== 'none') {
        sel.style.display = 'none';
        txt.style.display = 'block';
        btn.innerText = "📜"; // 按鈕變成切換回清單的圖示
        txt.focus();
    } else {
        // 反之亦然
        sel.style.display = 'block';
        txt.style.display = 'none';
        btn.innerText = "✏️";
    }
}

// Chart.js 圖表實例變數，用來銷毀舊圖表以重繪
let gradeChartInstance = null;

// 計算某學期所有成績的平均分
function calculateSemesterAverage(grades) {
    let ts = 0, tc = 0;
    if (!grades || grades.length === 0) return 0;
    grades.forEach(g => {
        const cr = parseFloat(g.credit) || 1;
        const sc = parseFloat(g.score) || 0;
        ts += sc * cr;
        tc += cr;
    });
    return tc > 0 ? (ts / tc).toFixed(1) : 0;
}

// 渲染圖表分析 (GPA 趨勢圖 + 學分詳細統計)
function renderAnalysis() {
    const labels = [];// X 軸標籤 (學期)
    const dataPoints = [];// Y 軸數據 (平均分)
    let totalCreditsEarned = 0;// 總實得學分
    
    // 分類統計物件，用來計算各模組學分 (如通識、專業)
    let categoryEarned = {};
    const categories = ["通識", "院共同", "基礎", "核心", "專業", "自由", "其他"];
    
    // 初始化統計物件
    categories.forEach(cat => {
        categoryEarned[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 };
    });

    // 複製並排序學期列表
    const sortedSemesters = semesterList.slice().sort(); 

    // 遍歷每個學期進行統計
    sortedSemesters.forEach(sem => {
        let semData = allData[sem];
        // 如果是當前學期，取全域變數 gradeList，否則取存檔中的 grades
        let grades = (sem === currentSemester) ? gradeList : (semData ? semData.grades : []);

        if (grades) {
            // 計算該學期平均並放入圖表數據
            const avg = calculateSemesterAverage(grades);
            if (grades.length > 0) {
                labels.push(sem);
                dataPoints.push(avg);
            }
            
            // 累加學分詳細統計
            grades.forEach(g => {
                const sc = parseFloat(g.score) || 0;
                const cr = parseFloat(g.credit) || 1;
                const cat = g.category || '其他';
                const nature = g.nature || '必修';

                // 只有及格才算學分
                if (sc >= 60) {
                    totalCreditsEarned += cr;
                    
                    if (!categoryEarned[cat]) {
                        categoryEarned[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 };
                    }
                    // 累加該分類總分
                    categoryEarned[cat].total += cr;
                    
                    // 累加該分類下的性質 (必修/選修)
                    if (categoryEarned[cat][nature] !== undefined) {
                        categoryEarned[cat][nature] += cr;
                    } else {
                         // 未知性質歸類到選修
                         categoryEarned[cat]["選修"] += cr;
                    }
                }
            });
        }
    });

    // 取得 Canvas 元素開始繪圖
    const ctx = document.getElementById('gradeChart');
    if (ctx) {
        // 如果有舊圖表先銷毀
        if (gradeChartInstance) gradeChartInstance.destroy();
        
        // 根據深色模式調整文字與網格顏色
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e0e0e0' : '#666666'; 
        const gridColor = isDark ? '#444444' : '#dddddd';

        // 定義自訂插件：繪製 60 分與 80 分的參考線
        const thresholdLinesPlugin = {
            id: 'thresholdLines',
            beforeDatasetsDraw(chart) {
                const { ctx, scales: { y }, chartArea: { left, right } } = chart;
                
                ctx.save();
                ctx.lineWidth = 3; 
                ctx.strokeStyle = '#f1c40f'; // 黃色
                ctx.setLineDash([5, 5]);     // 虛線

                // 畫 60 分線
                const y60 = y.getPixelForValue(60);
                if (y60 >= chart.chartArea.top && y60 <= chart.chartArea.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(left, y60);
                    ctx.lineTo(right, y60);
                    ctx.stroke();
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = '12px Arial';
                    ctx.fillText('', left + 5, y60 - 5);
                }

                // 畫 80 分線
                const y80 = y.getPixelForValue(80);
                if (y80 >= chart.chartArea.top && y80 <= chart.chartArea.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(left, y80);
                    ctx.lineTo(right, y80);
                    ctx.stroke();
                    ctx.fillText('', left + 5, y80 - 5);
                }
                
                ctx.restore();
            }
        };

        // 建立新的 Chart 實例
        gradeChartInstance = new Chart(ctx, {
            type: 'line', // 折線圖
            data: {
                labels: labels,
                datasets: [{
                    label: '學期平均',
                    data: dataPoints,
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    fill: true, // 填滿下方區域
                    tension: 0.3 // 線條平滑度
                }]
            },
            plugins: [thresholdLinesPlugin], // 掛載自訂插件
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        title: {
                            display: true,
                            text: '學期',
                            color: textColor,
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    y: {
                        beginAtZero: false,
                        suggestedMin: 40, // Y 軸建議最小值
                        suggestedMax: 100, // Y 軸建議最大值
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        title: {
                            display: true,
                            text: '平\n均\n分\n數',
                            color: textColor,
                            font: { size: 14, weight: 'bold' },
                            rotation: 0,
                            align: 'center'
                        }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
    // 更新「畢業學分進度條」
    updateTotalProgressBar(totalCreditsEarned);
    // 更新「各模組詳細統計」
    renderCategoryBreakdown(categoryEarned);
}

// 更新畢業總學分進度條
function updateTotalProgressBar(earned) {
    const progressEl = document.getElementById('credit-progress-bar');
    const totalEl = document.getElementById('total-credits');
    const container = document.getElementById('credit-progress-container');

    // 高中生模式不顯示此區塊 (或隱藏)
    if (userType === 'highschool') {
        if(container) container.style.display = 'none';
        return;
    }
    if(container) container.style.display = 'block';

    if (progressEl && totalEl) {
        // 計算百分比，最大 100%
        const percentage = Math.min((earned / graduationTarget) * 100, 100);
        progressEl.style.width = percentage + '%';
        
        // 根據進度變換顏色 (紅 -> 黃 -> 綠)
        if(percentage < 30) progressEl.style.background = '#e74c3c';
        else if(percentage < 70) progressEl.style.background = '#f39c12';
        else progressEl.style.background = '#2ecc71';

        totalEl.innerText = earned;// 更新文字數值
    }
}

// 渲染各學分模組 (通識、專業...) 的詳細進度
function renderCategoryBreakdown(earnedMap) {
    const panelUni = document.getElementById('panel-credits-uni');// 大學面板
    const panelHs = document.getElementById('panel-credits-hs');// 高中面板
    const listUni = document.getElementById('list-credits-uni');
    const listHs = document.getElementById('list-credits-hs');

    if (!panelUni || !panelHs) return;

    let html = '';

    // --- 高中生模式 (只分必修/選修) ---
    if (userType === 'highschool') {
        panelUni.style.display = 'none';
        panelHs.style.display = 'block';

        const types = ["必修", "選修"];
        types.forEach(type => {
            const earned = earnedMap[type] || 0;
            const target = categoryTargets[type] || 0; // 從設定中讀取目標
            // 計算百分比
            const percent = target > 0 ? Math.min(Math.round((earned / target) * 100), 100) : (earned > 0 ? 100 : 0);
            
            // 決定顏色
            let color = "#4a90e2";
            if (percent >= 100) color = "#2ecc71";
            else if (percent < 30) color = "#e74c3c";

            html += `
            <div style="margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; font-size:1rem; margin-bottom:6px;">
                    <span style="font-weight:bold; color:#555;">${type}學分</span>
                    <span style="color:#666;">
                        <span style="font-weight:bold; color:${color}">${earned}</span> / ${target}
                    </span>
                </div>
                <div style="background: #eee; border-radius: 8px; height: 12px; width: 100%; overflow: hidden;">
                    <div style="background: ${color}; width: ${percent}%; height: 100%; transition: width 0.5s;"></div>
                </div>
            </div>`;
        });
        listHs.innerHTML = html;

    } 
    // --- 大學生模式 (分通識、核心、專業等) ---
    else {
        panelUni.style.display = 'block';
        panelHs.style.display = 'none';

        const order = ["通識", "院共同", "基礎", "核心", "專業", "自由", "其他"];
        order.forEach(cat => {
            const data = earnedMap[cat] || { total: 0, "必修": 0, "選修": 0 };
            const targetConfig = categoryTargets[cat];
            // 判斷該類別目標是否細分為必修/選修物件
            const isComplex = (typeof targetConfig === 'object');

            // 簡單模式 (只看總學分，不分必選修)
            if (!isComplex) {
                const target = targetConfig || 0;
                const earned = data.total;
                // 若無目標且無實得學分，則隱藏不顯示
                if (target === 0 && earned === 0 && cat !== "其他") return;
                let percent = 0; if (target > 0) percent = Math.min(Math.round((earned / target) * 100), 100);
                let barColor = percent >= 100 ? "#2ecc71" : "#4a90e2";
                
                html += `
                <div style="margin-bottom: 12px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
                        <span style="font-weight:bold; color:#555;">${cat}</span>
                        <span><span style="font-weight:bold; color:${barColor}">${earned > 0 ? earned + ' / ' + target : earned}</span></span>
                    </div>
                    <div style="background: #eee; border-radius: 6px; height: 10px; width: 100%; overflow: hidden;">
                        <div style="background: ${barColor}; width: ${percent}%; height: 100%;"></div>
                    </div>
                </div>`;
            } 
            // 複雜模式 (顯示必修與選修雙進度條)
            else {
                const reqTarget = targetConfig["必修"] || 0;
                const eleTarget = targetConfig["選修"] || 0;
                const reqEarned = data["必修"] || 0;
                const eleEarned = (data["選修"] || 0) + (data["必選修"] || 0);

                const reqPercent = reqTarget > 0 ? Math.min(Math.round((reqEarned / reqTarget) * 100), 100) : (reqEarned > 0 ? 100 : 0);
                const elePercent = eleTarget > 0 ? Math.min(Math.round((eleEarned / eleTarget) * 100), 100) : (eleEarned > 0 ? 100 : 0);
                const reqColor = reqPercent >= 100 ? "#2ecc71" : "#e74c3c";
                const eleColor = elePercent >= 100 ? "#2ecc71" : "#f39c12";

                html += `
                <div style="margin-bottom: 15px; background: #fafafa; padding: 10px; border-radius: 8px; border: 1px solid #eee;">
                    <div style="font-weight:bold; color:#333; margin-bottom: 8px; font-size: 0.95rem;">${cat}模組</div>
                    <div style="margin-bottom: 6px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                            <span>必修</span><span>${reqEarned} / ${reqTarget}</span>
                        </div>
                        <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                            <div style="background: ${reqColor}; width: ${reqPercent}%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                            <span>選修</span><span>${eleEarned} / ${eleTarget}</span>
                        </div>
                        <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                            <div style="background: ${eleColor}; width: ${elePercent}%; height: 100%;"></div>
                        </div>
                    </div>
                </div>`;
            }
        });
        listUni.innerHTML = html;
    }
}

// 更新畢業學分目標數值 (綁定設定頁輸入框)
function updateGraduationTarget(val) {
    const newVal = parseInt(val);
    if (newVal && newVal > 0) {
        graduationTarget = newVal;
        saveData(); // 存檔
    } else {
        showAlert("請輸入有效的正整數");
        // 回復原值
        document.getElementById('setting-grad-target').value = graduationTarget;
    }
}

// 切換成績頁面中的子分頁 (總覽、小考、段考、成績單、趨勢、學分)
function switchGradeTab(tabName) {
    const tabs = ['dashboard', 'regular', 'midterm', 'list', 'chart', 'credits'];

    // 隱藏所有分頁
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-grade-${t}`);
        const view = document.getElementById(`subview-grade-${t}`);
        if (btn) btn.classList.remove('active');
        if (view) view.style.display = 'none';
    });

    // 顯示目標分頁
    const activeBtn = document.getElementById(`tab-grade-${tabName}`);
    const activeView = document.getElementById(`subview-grade-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.style.display = 'block';

    // 根據不同分頁執行對應的初始化/渲染函式
    if (tabName === 'dashboard') {
        renderGradeDashboard();
    } else if (tabName === 'regular') {
        updateExamSubjectOptions();
        renderRegularExams();
    } else if (tabName === 'midterm') {
        updateExamSubjectOptions();
        renderMidtermExams();
    } else if (tabName === 'list') {
        loadGrades();
    } else if (tabName === 'chart') {
        // 延遲渲染以確保 Canvas 尺寸正確
        setTimeout(() => {
            if (typeof renderAnalysis === 'function') renderAnalysis();
        }, 50);
    } else if (tabName === 'credits') {
        if (typeof renderAnalysis === 'function') renderAnalysis();
    }
}

// 渲染「總覽」分頁的統計儀表板
function renderGradeDashboard() {
    let totalScore = 0;
    let totalCredits = 0;
    let earnedCredits = 0;
    let failedCount = 0;

    // 計算總體數據
    gradeList.forEach(g => {
        const score = parseFloat(g.score) || 0;
        const credit = parseFloat(g.credit) || 1;
        const isPass = score >= 60;

        totalScore += score * credit;
        totalCredits += credit;
        
        if (isPass) earnedCredits += credit;
        else failedCount++;
    });

    // 計算 GPA
    const avg = totalCredits > 0 ? (totalScore / totalCredits).toFixed(1) : "0.0";

    // 更新介面數字
    const elGpa = document.getElementById('dash-gpa');
    const elCredits = document.getElementById('dash-credits');
    const elFailed = document.getElementById('dash-failed');

    if (elGpa) elGpa.innerText = avg;
    if (elCredits) elCredits.innerText = earnedCredits;
    if (elFailed) elFailed.innerText = failedCount;
}