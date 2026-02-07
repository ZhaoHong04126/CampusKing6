let discussionUnsubscribe = null;
let editingPostId = null;
let replyingToPostId = null; // [新增] 目前正在回覆哪一篇貼文
let replyListeners = []; // [新增] 用來儲存回覆的監聽器，以便離開時取消

// 定義常用的表情符號列表
const EMOJI_LIST = ['😀', '😂', '🥰', '😎', '😭', '😡', '👍', '👎', '🙏', '💪', '🎉', '❤️', '💔', '👀', '🔥', '✨', '💩', '🤔', '😴', '👻', '💯', '🎓', '📚'];

// 1. 渲染討論區
function initDiscussion() {
    const listDiv = document.getElementById('discussion-list');
    if (!listDiv) return;

    if (!currentUser) {
        console.log("訪客模式：僅供瀏覽");
    }

    listDiv.innerHTML = '<p style="text-align:center; color:#999;">正在載入討論...</p>';

    // 清除舊的回覆監聽器
    clearReplyListeners();

    // 監聽資料庫
    discussionUnsubscribe = db.collection("discussions")
        .orderBy("createdAt", "desc")
        .limit(20)
        .onSnapshot((snapshot) => {
            let html = '';
            if (snapshot.empty) {
                listDiv.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">📭 目前還沒有討論，來搶頭香吧！</div>';
                return;
            }

            // 先產生所有貼文的 HTML 結構
            snapshot.forEach((doc) => {
                const data = doc.data();
                const isAuthor = currentUser && data.authorUid === currentUser.uid;
                const isAdmin = currentUser && (typeof ADMIN_UID !== 'undefined') && currentUser.uid === ADMIN_UID;
                const canEdit = isAuthor || isAdmin;

                let timeStr = "剛剛";
                if (data.createdAt) {
                    const d = data.createdAt.toDate();
                    timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                }

                let actionBtns = '';
                if (canEdit) {
                    const safeContent = encodeURIComponent(data.content);
                    actionBtns = `
                        <button onclick="confirmEditPost('${doc.id}', '${safeContent}')" style="color:#f39c12; background:none; border:none; cursor:pointer; font-size:0.85rem; padding:0; margin-right:8px;">✎ 編輯</button>
                        <button onclick="deletePost('${doc.id}')" style="color:#e74c3c; background:none; border:none; cursor:pointer; font-size:0.85rem; padding:0;">🗑️ 刪除</button>
                    `;
                }

                const avatar = data.authorPhoto || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                
                // [新增] 回覆區塊的容器 ID
                const replyContainerId = `replies-${doc.id}`;
                const safeContentForReply = encodeURIComponent(data.content); // 傳給回覆 Modal 用

                html += `
                <div class="card" style="padding: 15px; margin-bottom: 15px;">
                    <div style="display:flex; gap:12px;">
                        <img src="${avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div>
                                    <span style="font-weight:bold; color:var(--text-main); font-size:0.95rem;">${escapeHtml(data.authorName)}</span>
                                    <span style="font-size:0.75rem; color:#999; margin-left:5px;">${timeStr}</span>
                                </div>
                                <div style="display:flex;">${actionBtns}</div>
                            </div>
                            <div style="margin-top:6px; color:var(--text-main); line-height:1.5; white-space: pre-wrap;">${escapeHtml(data.content)}</div>
                        </div>
                    </div>
                    
                    <div class="post-actions">
                        <button onclick="openReplyModal('${doc.id}', '${safeContentForReply}')" style="background:transparent; border:none; color:var(--primary); cursor:pointer; font-size:0.9rem; display:flex; align-items:center;">
                            💬 回覆
                        </button>
                    </div>

                    <div id="${replyContainerId}" class="reply-list"></div>
                </div>`;
            });

            listDiv.innerHTML = html;

            // HTML 渲染完畢後，針對每一篇貼文載入回覆
            snapshot.forEach((doc) => {
                loadReplies(doc.id);
            });
        });
}

// [新增] 載入特定貼文的回覆
function loadReplies(postId) {
    const container = document.getElementById(`replies-${postId}`);
    if (!container) return;

    // 監聽該貼文底下的 replies 子集合
    const unsubscribe = db.collection("discussions").doc(postId).collection("replies")
        .orderBy("createdAt", "asc") // 舊的回覆在上面
        .onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const isMyReply = currentUser && data.authorUid === currentUser.uid;
                const isAdmin = currentUser && (typeof ADMIN_UID !== 'undefined') && currentUser.uid === ADMIN_UID;
                
                let timeStr = "";
                if (data.createdAt) {
                    const d = data.createdAt.toDate();
                    timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                }

                let deleteBtn = '';
                if (isMyReply || isAdmin) {
                    deleteBtn = `<button onclick="deleteReply('${postId}', '${doc.id}')" style="float:right; background:transparent; border:none; color:#ccc; cursor:pointer; font-size:0.8rem;">✖</button>`;
                }

                html += `
                <div class="reply-item">
                    ${deleteBtn}
                    <div style="font-size:0.85rem; font-weight:bold; color:#555; margin-bottom:2px;">
                        ${escapeHtml(data.authorName)} <span style="font-weight:normal; color:#aaa; font-size:0.75rem;">${timeStr}</span>
                    </div>
                    <div style="color:#333; white-space: pre-wrap;">${escapeHtml(data.content)}</div>
                </div>`;
            });
            container.innerHTML = html;
            // 如果有回覆，顯示一點上邊距
            container.style.display = snapshot.empty ? 'none' : 'block';
        });

    replyListeners.push(unsubscribe);
}

// [新增] 清除所有回覆監聽器 (避免記憶體洩漏或重複監聽)
function clearReplyListeners() {
    replyListeners.forEach(unsub => unsub());
    replyListeners = [];
}

function stopDiscussionListener() {
    if (discussionUnsubscribe) {
        discussionUnsubscribe();
        discussionUnsubscribe = null;
    }
    clearReplyListeners();
}

// --- 發文相關 ---

function addPost() {
    const content = document.getElementById('input-post-content').value;
    
    if (!content.trim()) { showAlert("請輸入內容"); return; }
    if (!currentUser) { showAlert("請先登入才能發文！"); return; }

    const btn = document.getElementById('btn-send-post');
    btn.disabled = true;
    
    if (editingPostId) {
        // 編輯模式
        btn.innerText = "儲存中...";
        db.collection("discussions").doc(editingPostId).update({
            content: content
        }).then(() => {
            closePostModal();
            showAlert("修改成功！");
            editingPostId = null;
        }).catch((err) => showAlert("修改失敗：" + err.message))
          .finally(() => btn.disabled = false);
    } else {
        // 新增模式
        const anonCheck = document.getElementById('check-post-anonymous');
        const isAnonymousPost = (anonCheck && anonCheck.checked) || currentUser.isAnonymous;
        let postName = isAnonymousPost ? "匿名同學" : (currentUser.displayName || "匿名同學");
        let postPhoto = isAnonymousPost ? "https://cdn-icons-png.flaticon.com/512/847/847969.png" : currentUser.photoURL;

        btn.innerText = "發送中...";
        db.collection("discussions").add({
            content: content,
            authorUid: currentUser.uid,
            authorName: postName,
            authorPhoto: postPhoto,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            closePostModal();
            showAlert("發布成功！");
        }).catch((err) => showAlert("發布失敗：" + err.message))
          .finally(() => {
            btn.disabled = false;
            btn.innerText = "🚀 發送";
        });
    }
}

function deletePost(docId) {
    showConfirm("確定要刪除這則貼文嗎？").then(ok => {
        if(ok) {
            db.collection("discussions").doc(docId).delete()
                .then(() => showAlert("貼文已刪除"))
                .catch((err) => showAlert("刪除失敗：" + err.message));
        }
    });
}

// --- 回覆相關 ---

// 開啟回覆視窗
function openReplyModal(postId, encodedContent) {
    if(!currentUser) { showAlert("請先登入帳號"); return; }
    
    replyingToPostId = postId;
    const content = decodeURIComponent(encodedContent);
    
    document.getElementById('reply-target-text').innerText = `回覆：${content.substring(0, 20)}...`;
    document.getElementById('reply-modal').style.display = 'flex';
    document.getElementById('input-reply-content').value = '';
    document.getElementById('input-reply-content').focus();
    
    // 初始化表情選單
    initEmojiPicker('reply');
}

function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
    replyingToPostId = null;
    hideEmojiPicker('reply');
}

// 送出回覆
function submitReply() {
    const content = document.getElementById('input-reply-content').value;
    if (!content.trim()) { showAlert("請輸入回覆內容"); return; }
    if (!replyingToPostId) return;

    const btn = document.getElementById('btn-send-reply');
    btn.disabled = true;
    btn.innerText = "發送中...";

    // 判斷是否匿名 (回覆預設跟隨使用者的登入狀態，這裡簡化為不提供匿名回覆勾選，若需匿名可自行擴充)
    let replyName = currentUser.isAnonymous ? "匿名同學" : (currentUser.displayName || "同學");

    // 將回覆寫入子集合 discussions/{postId}/replies
    db.collection("discussions").doc(replyingToPostId).collection("replies").add({
        content: content,
        authorUid: currentUser.uid,
        authorName: replyName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        closeReplyModal();
        // 不需手動重整，onSnapshot 會自動更新
    }).catch(err => {
        showAlert("回覆失敗：" + err.message);
    }).finally(() => {
        btn.disabled = false;
        btn.innerText = "🚀 發送回覆";
    });
}

// 刪除回覆
function deleteReply(postId, replyId) {
    showConfirm("確定刪除此回覆？").then(ok => {
        if(ok) {
            db.collection("discussions").doc(postId).collection("replies").doc(replyId).delete()
            .catch(err => showAlert("刪除失敗"));
        }
    });
}

// --- 表情符號 (Emoji) 相關 ---

// 初始化選單 (產生按鈕)
function initEmojiPicker(type) {
    const container = document.getElementById(`emoji-picker-${type}`);
    if (!container || container.innerHTML !== "") return; // 避免重複產生

    EMOJI_LIST.forEach(emoji => {
        const btn = document.createElement('button');
        btn.innerText = emoji;
        btn.className = 'emoji-btn';
        // 點擊後插入表情並關閉選單
        btn.onclick = (e) => {
            e.stopPropagation(); // 防止觸發關閉
            insertEmoji(emoji, type);
        };
        container.appendChild(btn);
    });
}

// 切換顯示/隱藏
function toggleEmojiPicker(type) {
    const picker = document.getElementById(`emoji-picker-${type}`);
    if (!picker) return;
    
    // 如果內容是空的，先初始化
    if (picker.innerHTML === "") initEmojiPicker(type);

    if (picker.classList.contains('show')) {
        picker.classList.remove('show');
    } else {
        // 先關閉其他的
        hideEmojiPicker('post');
        hideEmojiPicker('reply');
        picker.classList.add('show');
    }
}

function hideEmojiPicker(type) {
    const picker = document.getElementById(`emoji-picker-${type}`);
    if (picker) picker.classList.remove('show');
}

// 插入表情符號到游標位置
function insertEmoji(char, type) {
    const inputId = type === 'post' ? 'input-post-content' : 'input-reply-content';
    const input = document.getElementById(inputId);
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    // 在游標處插入
    input.value = text.substring(0, start) + char + text.substring(end);
    
    // 重新定位游標
    input.selectionStart = input.selectionEnd = start + char.length;
    input.focus();
    
    // 插入後自動隱藏選單 (可選)
    // hideEmojiPicker(type);
}

// --- 其他輔助函式 ---

function openPostModal() {
    if(!currentUser) { showAlert("請先登入帳號"); return; }
    editingPostId = null;
    document.getElementById('post-modal').style.display = 'flex';
    document.getElementById('input-post-content').value = '';
    document.getElementById('btn-send-post').innerText = "🚀 發送";
    
    // 匿名選項邏輯
    const anonContainer = document.getElementById('post-anon-container');
    const anonCheck = document.getElementById('check-post-anonymous');
    if(anonCheck) anonCheck.checked = false;

    if (currentUser && !currentUser.isAnonymous) {
        if(anonContainer) anonContainer.style.display = 'block';
    } else {
        if(anonContainer) anonContainer.style.display = 'none';
    }
    
    // 初始化 Post 的表情選單
    initEmojiPicker('post');
    document.getElementById('input-post-content').focus();
}

function closePostModal() {
    document.getElementById('post-modal').style.display = 'none';
    hideEmojiPicker('post');
}

function confirmEditPost(docId, encodedContent) {
    showConfirm("確定要修改這則留言嗎？", "編輯確認").then(isConfirmed => {
        if (isConfirmed) {
            const content = decodeURIComponent(encodedContent);
            editingPostId = docId;
            const anonContainer = document.getElementById('post-anon-container');
            if(anonContainer) anonContainer.style.display = 'none';
            
            document.getElementById('post-modal').style.display = 'flex';
            document.getElementById('input-post-content').value = content;
            document.getElementById('btn-send-post').innerText = "💾 儲存修改";
            
            initEmojiPicker('post');
            document.getElementById('input-post-content').focus();
        }
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}