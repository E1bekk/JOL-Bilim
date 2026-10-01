// Подключение к базе Firebase (одно на все страницы).
// Перед этим файлом должны быть подключены firebase-app-compat.js и firebase-firestore-compat.js
firebase.initializeApp({
  apiKey: "AIzaSyAmru1-7SS3dwAMEborymtJJudtcflQYzU",
  authDomain: "jol-bilim.firebaseapp.com",
  projectId: "jol-bilim",
  storageBucket: "jol-bilim.firebasestorage.app",
  messagingSenderId: "1059233182996",
  appId: "1:1059233182996:web:40ad78360b42dd49d37e01",
  measurementId: "G-P7RR3W3ZF7"
});
var db = firebase.firestore();
