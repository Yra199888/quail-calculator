// firebase/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 🔐 ТВОЯ Firebase-конфігурація
const firebaseConfig = {
  apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
  authDomain: "quail-farm-tracke.firebaseapp.com",
  projectId: "quail-farm-tracke",
  storageBucket: "quail-farm-tracke.firebasestorage.app",
  messagingSenderId: "914329630014",
  appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
};

// 🚀 Init Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

// 📄 Один документ = весь стан додатку
export const STATE_DOC = doc(db, "app", "state");

// ⬇️ ЗАВАНТАЖИТИ СТАН З ХМАРИ
export async function loadStateFromCloud() {
  const snap = await getDoc(STATE_DOC);
  return snap.exists() ? snap.data() : null;
}

// ⬆️ ЗБЕРЕГТИ СТАН В ХМАРУ
export async function saveStateToCloud(state) {
  await setDoc(STATE_DOC, state);
}

// 🔄 REALTIME СИНХРОНІЗАЦІЯ (інший телефон / ПК)
export function subscribeToState(callback) {
  return onSnapshot(STATE_DOC, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  });
}