// 渲染筆記列表
function renderNotes() {
    const listDiv = document.getElementById('notes-list');
    if (!listDiv) return;

    // 按時間倒序排列 (新的在上面)
    quickNotes.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    if (quickNotes.length === 0) {
        html = '<p style="color:#999; text-align:center; padding: 20px;">📝 這裡還沒有筆記，記點什麼吧！</p>';
    } else {
        quickNotes.forEach((note, index) => {
            // 處理換行顯示 (將 \n 轉為 <br>)
            const contentHtml = note.content.replace(/\n/g, '<br>');
            
            html += `
            <div style="background: white; border-bottom: 1px solid #eee; padding: 15px 0;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                    <span style="font-size: 0.85rem; color: #888;">${note.date}</span>
                    <button onclick="deleteNote(${index})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer;">🗑️ 刪除</button>
                </div>
                <div style="font-size: 1rem; line-height: 1.5; color: var(--text-main); white-space: pre-wrap;">${note.content}</div>
            </div>`;
        });
    }
    listDiv.innerHTML = html;
}

// 開啟新增筆記視窗
function openNoteModal() {
    document.getElementById('note-modal').style.display = 'flex';
    document.getElementById('input-note-content').value = '';
    // 自動聚焦
    document.getElementById('input-note-content').focus();
}

// 關閉視窗
function closeNoteModal() {
    document.getElementById('note-modal').style.display = 'none';
}

// 新增筆記
function addNote() {
    const content = document.getElementById('input-note-content').value;
    
    // 防空
    if (!content.trim()) {
        showAlert("請輸入內容", "無法新增");
        return;
    }

    // 取得現在時間並格式化 (YYYY/MM/DD HH:MM)
    const now = new Date();
    const timeStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${(now.getMinutes()<10?'0':'')+now.getMinutes()}`;

    quickNotes.push({
        content: content,
        date: timeStr
    });

    saveData();
    closeNoteModal();
    renderNotes();
    showAlert("筆記已儲存！", "完成");
}

// 刪除筆記
function deleteNote(index) {
    showConfirm("確定要刪除這條筆記嗎？", "刪除確認").then(ok => {
        if (ok) {
            quickNotes.splice(index, 1);
            saveData();
            renderNotes();
        }
    });
}