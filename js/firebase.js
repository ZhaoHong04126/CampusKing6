const firebaseConfig = {
    apiKey: "AIzaSyBvWcCroeNSe4O1H_-hXgOJysO-Fyez0Qg",
    authDomain: "campusking6.firebaseapp.com",
    projectId: "campusking6",
    storageBucket: "campusking6.firebasestorage.app",
    messagingSenderId: "904334224237",
    appId: "1:904334224237:web:21e9c3717bd05896af0864",
    measurementId: "G-ER6B64XEBJ"
  };

firebase.initializeApp(firebaseConfig);// 初始化 Firebase 應用程式
const auth = firebase.auth();// 取得 Auth 實例
const provider = new firebase.auth.GoogleAuthProvider();// 建立 Google 登入提供者
const db = firebase.firestore();// 取得 Firestore 資料庫實例

const ADMIN_UID = "zxMKZHLkk1NvCKfAKEEWppXHCH73";
