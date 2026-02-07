// 程式啟動，監聽 Firebase Auth 狀態變更

auth.onAuthStateChanged((user) => {
    // 如果有使用者登入
    if (user) {
        currentUser = user;
        updateLoginUI(true);// 更新 UI 為登入狀態 (隱藏登入頁)
        loadData();// 載入資料
        checkUserType();// 檢查使用者類型 (高中/大學)

        checkAdminStatus();// 檢查是否為管理員
    } else {
        currentUser = null;// 如果未登入
        updateLoginUI(false);// 更新 UI 為登出狀態 (顯示登入頁)

        document.getElementById('admin-panel').style.display = 'none';// 隱藏管理員面板
    }
});