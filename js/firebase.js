const firebaseConfig = {
  apiKey: "AIzaSyB9H2RRxs_7ERb2ZYztuCQu6zScMkOPW_Q",
  authDomain: "campusmate-4.firebaseapp.com",
  projectId: "campusmate-4",
  storageBucket: "campusmate-4.firebasestorage.app",
  messagingSenderId: "508067016216",
  appId: "1:508067016216:web:eec789f59fadd8a13d9d6d",
  measurementId: "G-LMQRW33ML0"
};

firebase.initializeApp(firebaseConfig);// 初始化 Firebase 應用程式
const auth = firebase.auth();// 取得 Auth 實例
const provider = new firebase.auth.GoogleAuthProvider();// 建立 Google 登入提供者
const db = firebase.firestore();// 取得 Firestore 資料庫實例

const ADMIN_UID = "puqNkSNmpUaqK5Sw1srPH5cd6Jp2";
