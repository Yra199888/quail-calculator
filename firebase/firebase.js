// firebase/firebase.js
import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  doc,
  runTransaction,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===============================
   INIT
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
  authDomain: "quail-farm-tracke.firebaseapp.com",
  projectId: "quail-farm-tracke",
  storageBucket: "quail-farm-tracke.appspot.com",
  messagingSenderId: "914329630014",
  appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const db = getFirestore(app);
const DOC_REF = doc(db, "app", "state");

/* ===============================
   SAVE FULL APPSTATE (SAFE)
================================ */
export async function saveStateToCloud(localState) {
  if (!localState) return;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(DOC_REF);

    const remote = snap.exists()
      ? snap.data()
      : {};

    // 🔥 ГЛИБОКЕ ЗЛИТТЯ
    const merged = deepMerge(remote, localState);

    tx.set(DOC_REF, merged);
  });
}

/* ===============================
   REALTIME SUBSCRIBE
================================ */
export function subscribeToCloudState(cb) {
  return onSnapshot(DOC_REF, (snap) => {
    if (!snap.exists()) return;
    cb(snap.data());
  });
}

/* ===============================
   HELPERS
================================ */
function deepMerge(target, source) {
  if (typeof target !== "object" || typeof source !== "object") {
    return source;
  }

  const out = Array.isArray(target) ? [...target] : { ...target };

  Object.keys(source).forEach((key) => {
    if (source[key] && typeof source[key] === "object") {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  });

  return out;
}