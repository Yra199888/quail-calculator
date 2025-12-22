// firebase/firebase.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

let app = null;
let db = null;
let ready = false;

// ===============================
// 🔧 UI STATUS
// ===============================
function setFirebaseStatus(state) {
  const el = document.getElementById("firebase-status");
  if (!el) return;

  el.className = `firebase-status ${state}`;

  if (state === "online") el.textContent = "🟢 Online";
  if (state === "syncing") el.textContent = "🟡 Syncing…";
  if (state === "offline") el.textContent = "🔴 Offline";
}

// ===============================
// 🔥 INIT FIREBASE
// ===============================
export function initFirebase() {
  if (ready) return;

  const config = {
    apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
    authDomain: "quail-farm-tracke.firebaseapp.com",
    projectId: "quail-farm-tracke",
    storageBucket: "quail-farm-tracke.appspot.com",
    messagingSenderId: "914329630014",
    appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
  };

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app);
    ready = true;
    setFirebaseStatus("online");
  } catch (e) {
    console.error("Firebase init error", e);
    setFirebaseStatus("offline");
  }
}

export function isFirebaseReady() {
  return ready;
}

// ===============================
// ☁ SAVE STATE
// ===============================
export async function saveStateToCloud(state) {
  if (!ready) return;

  setFirebaseStatus("syncing");

  try {
    await setDoc(
      doc(db, "app", "state"),
      state,
      { merge: true } // 🔴 КЛЮЧОВЕ: НЕ ПЕРЕЗАПИСУЄ ВСЕ
    );

    setFirebaseStatus("online");
  } catch (e) {
    console.error("Firebase save error", e);
    setFirebaseStatus("offline");
  }
}

// ===============================
// 📥 LOAD STATE
// ===============================
export async function loadStateFromCloud() {
  if (!ready) return null;

  try {
    const snap = await getDoc(doc(db, "app", "state"));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Firebase load error", e);
    setFirebaseStatus("offline");
    return null;
  }
}

// ===============================
// 🔄 REALTIME SYNC
// ===============================
export function subscribeToCloudState(cb) {
  if (!ready) return;

  onSnapshot(doc(db, "app", "state"), (snap) => {
    if (snap.exists()) {
      setFirebaseStatus("syncing");
      cb(snap.data());
      setFirebaseStatus("online");
    }
  });
}