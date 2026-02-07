// --- 帳號驗證與管理 ---

// 切換登入/註冊模式的函式
function toggleLoginMode() {
    isRegisterMode = !isRegisterMode;// 反轉目前的模式旗標
    const btn = document.getElementById('btn-submit');// 取得提交按鈕
    const toggleBtn = document.getElementById('toggle-btn');// 取得切換按鈕
    const toggleText = document.getElementById('toggle-text');// 取得切換提示文字
    
    // 如果是註冊模式，更新 UI 文字
    if (isRegisterMode) { 
        btn.innerText = "註冊並登入"; 
        toggleText.innerText = "已經有帳號？"; 
        toggleBtn.innerText = "直接登入"; 
    }
    // 如果是登入模式，更新 UI 文字
    else { 
        btn.innerText = "登入"; 
        toggleText.innerText = "還沒有帳號？"; 
        toggleBtn.innerText = "建立新帳號"; 
    }
}

// 處理 Email 登入/註冊的函式
function handleEmailAuth() {
    const email = document.getElementById('email').value;// 取得 Email 輸入值
    const password = document.getElementById('password').value;// 取得密碼輸入值
    if (!email || !password) { showAlert("請輸入 Email 和密碼", "資料不全"); return; }// 驗證輸入
    
    // 根據模式呼叫 Firebase 對應的 API
    if (isRegisterMode) {
        // 註冊新帳號
        auth.createUserWithEmailAndPassword(email, password)
            .catch(e => showAlert(e.message, "註冊失敗"));
    } else {
        // 登入現有帳號
        auth.signInWithEmailAndPassword(email, password)
            .catch(e => showAlert(e.message, "登入失敗"));
    }
}

// Google 登入函式
function loginWithGoogle() {
    // 使用彈出視窗進行 Google 登入
    auth.signInWithPopup(provider).catch(e => showAlert(e.message, "登入錯誤"));
}

// 匿名登入函式
function loginAnonymously() {
    auth.signInAnonymously().catch(e => showAlert(e.message, "登入錯誤"));// 呼叫 Firebase 匿名登入 API
}

// 登出函式
function logout() {
    // 如果目前是匿名使用者，登出後資料會遺失，所以需警告
    if (currentUser && currentUser.isAnonymous) {
        showConfirm("⚠️ 匿名帳號登出後資料會消失，確定嗎？", "警告").then(ok => {
            if (ok) performLogout(); // 確認後執行登出
        });
    } else {
        performLogout();// 一般使用者直接登出
    }
}

// 執行實際的登出動作
function performLogout() {
    // Firebase 登出，成功後重新整理頁面
    auth.signOut().then(() => window.location.reload());
}

// 註銷 (刪除) 帳號函式
function deleteAccount() {
    if (!currentUser) return;

    // 第一層確認對話框
    showConfirm("⚠️ 警告：此動作將「永久刪除」您的所有資料（包含課表、成績、記帳...等），且無法復原！\n\n確定要註銷帳號嗎？", "危險操作")
    .then(isConfirmed => {
        if (isConfirmed) {
            // 第二層確認：要求輸入關鍵字 "DELETE" 以防誤觸
            return showPrompt("為了確認您的意願，請輸入「DELETE」", "", "最終確認");
        }
        return null; // 如果第一層取消
    })
    .then(inputStr => {
        // 如果輸入正確
        if (inputStr === "DELETE") {
            const uid = currentUser.uid;
            
            // 顯示處理中狀態
            if(window.showAlert) showAlert("正在刪除資料，請稍候...", "處理中");

            // 刪除雲端資料 (Firestore)
            db.collection("users").doc(uid).delete()
            .then(() => {
                // 刪除本地資料 (LocalStorage)
                const dbKey = 'campusMate_v6.0_' + uid;
                localStorage.removeItem(dbKey);
                // 刪除身分偏好設定，讓一切重來
                localStorage.removeItem('userType'); 

                // 刪除 Firebase Auth 帳號 (最關鍵的一步，需重新登入驗證)
                return currentUser.delete();
            })
            .then(() => {
                // 成功後顯示原生 alert 並重新整理
                alert("帳號已成功註銷，感謝您的使用。"); 
                window.location.reload();
            })
            .catch((error) => {
                // 錯誤處理
                console.error("Delete error:", error);
                // 處理 Firebase 安全機制：若登入太久，需重新登入才能刪除
                if (error.code === 'auth/requires-recent-login') {
                    showAlert("🔒 為了確保帳號安全，系統要求您必須「重新登入」後才能執行刪除操作。\n\n請登出後再登入一次試試。", "驗證過期");
                } else {
                    showAlert("註銷失敗：" + error.message, "錯誤");
                }
            });
        } else if (inputStr !== null) {
            // 如果使用者輸入錯誤字串
            showAlert("輸入內容不正確，已取消操作。", "取消");
        }
    });
}

// 檢查使用者身分設定 (高中/大學)
function checkUserType() {
    // 如果尚未設定 userType，顯示歡迎 Modal 詢問
    if (!userType) document.getElementById('welcome-modal').style.display = 'flex';
    else initUI();// 否則初始化 UI
}

// 設定使用者身分
function setUserType(type) {
    localStorage.setItem('userType', type);// 儲存到 LocalStorage
    userType = type;// 更新全域變數
    document.getElementById('welcome-modal').style.display = 'none';// 隱藏歡迎 Modal
    initUI();// 初始化 UI
}

// 重設身分 (切換高中/大學)
function resetIdentity() {
    // 顯示警告，因為學分結構會改變
    showConfirm("確定要重新選擇身分嗎？\n\n切換後將改變「學分模組結構」：\n• 高中生：必修 / 選修\n• 大學生：通識 / 核心 / 專業...\n\n(更換身分資料不會被刪除)", "切換身分")
    .then(isConfirmed => {
        if (isConfirmed) {
            // 清除設定
            localStorage.removeItem('userType');
            userType = null;
            // 顯示選擇 Modal
            document.getElementById('welcome-modal').style.display = 'flex';
            // 回到桌面
            switchTab('home');
        }
    });
}

// 更新登入 UI 狀態
function updateLoginUI(isLoggedIn) {
    const loginOverlay = document.getElementById('login-overlay');
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');
    
    if (loginOverlay) loginOverlay.style.display = isLoggedIn ? 'none' : 'flex';// 根據登入狀態顯示或隱藏遮罩
    if (userInfo) userInfo.style.display = isLoggedIn ? 'flex' : 'none';// 顯示或隱藏右上角使用者資訊
    if (userPhoto && currentUser) userPhoto.src = currentUser.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png";// 如果已登入，更新使用者大頭貼
}

// 忘記密碼功能
function forgotPassword() {
    const email = document.getElementById('email').value;

    // 檢查是否已輸入 Email
    if (!email) {
        showAlert("請先在上方輸入您的 Email，系統才能寄送重設信給您！", "缺少 Email");
        return;
    }

    // 確認寄送
    showConfirm(`確定要寄送重設密碼信件至 ${email} 嗎？`, "重設密碼").then(isConfirmed => {
        if (isConfirmed) {
            // 呼叫 Firebase 重設密碼 API
            auth.sendPasswordResetEmail(email)
            .then(() => {
                showAlert("📧 重設信已寄出！\n\n請檢查您的信箱 (若沒收到請查看垃圾郵件)。", "寄送成功");
            })
            .catch((error) => {
                // 錯誤處理
                let msg = "發送失敗：" + error.message;
                if (error.code === 'auth/user-not-found') msg = "找不到此 Email 的使用者。";
                showAlert(msg, "錯誤");
            });
        }
    });
}

// 檢查是否為管理員並顯示管理面板
function checkAdminStatus() {
    // 檢查是否有登入，且 UID 是否符合 ADMIN_UID (定義在 firebase.js)
    if (currentUser && typeof ADMIN_UID !== 'undefined' && currentUser.uid === ADMIN_UID) {
        console.log("👨‍💻 管理員已登入");
        
        // 嘗試顯示管理員面板 (如果有這個 HTML 元素的話)
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
        }
    }
}