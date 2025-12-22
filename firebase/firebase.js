/**
 * firebase.js
 * ---------------------------------------
 * Firebase Web (script tag / CDN modules) + Cloud Firestore
 *
 * ✅ гарантує initializeApp (fix app/no-app)
 * ✅ load state from Firestore
 * ✅ save state to Firestore (merge)
 * ✅ realtime sync via onSnapshot
 *
 * ❗ Важливо:
 * - Працює і якщо Firebase вже ініціалізований в index.html (reuse getApp())
 * - Працює і якщо ні (ініціалізує сам)
 */

// -------------------------------
// Firebase SDK (CDN ES Modules)
// -------------------------------
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// -------------------------------
// 🔧 ТВОЯ КОНФІГА (з Firebase console)
// -------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
  authDomain: "quail-farm-tracke.firebaseapp.com",
  projectId: "quail-farm-tracke",
  storageBucket: "quail-farm-tracke.firebasestorage.app",
  messagingSenderId: "914329630014",
  appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
};

// -------------------------------
// ДЕ саме зберігаємо AppState у Firestore
// collection: "app", doc: "state"
// (відповідає твоєму Firestore /app)
// -------------------------------
const STATE_DOC = { collection: "app", doc: "state" };

// -------------------------------
// Local client id (для дебагу між 2 пристроями)
// -------------------------------
const CLIENT_ID_KEY = "qft_client_id";
function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `c_${Math.random().toString(16).slice(2)}_${Date.now()}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

// -------------------------------
// Lazy init (щоб не було app/no-app)
// -------------------------------
let _app = null;
let _db = null;

export function ensureFirebase() {
  // 1) reuse if already init (наприклад, ти вставляв initializeApp в index.html)
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  if (!_db) {
    _db = getFirestore(_app);
  }
  return { app: _app, db: _db };
}

function getStateDocRef() {
  const { db } = ensureFirebase();
  return doc(db, STATE_DOC.collection, STATE_DOC.doc);
}

// -------------------------------
// ✅ SAVE (merge, щоб не “затирало все”)
// -------------------------------
export async function saveStateToCloud(appStateObj) {
  const ref = getStateDocRef();
  const clientId = getClientId();

  // Обгортаємо в payload (метадані корисні для дебагу)
  const payload = {
    ...appStateObj,
    __meta: {
      updatedAt: serverTimestamp(),
      clientId
    }
  };

  // merge:true => не зносить поля, яких нема в payload
  await setDoc(ref, payload, { merge: true });

  console.log(`☁ saveStateToCloud OK (clientId=${clientId})`);
}

// -------------------------------
// ✅ LOAD (повертає object або null)
// -------------------------------
export async function loadStateFromCloud() {
  const ref = getStateDocRef();
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.log("☁ loadStateFromCloud: документа ще нема (порожньо)");
    return null;
  }

  const data = snap.data();

  // Приберемо службове поле, щоб не лізло в AppState, якщо не хочеш
  // (якщо хочеш бачити __meta — закоментуй наступні 2 рядки)
  if (data && data.__meta) delete data.__meta;

  console.log("☁ loadStateFromCloud OK");
  return data;
}

// -------------------------------
// ✅ REALTIME SUBSCRIBE
// -------------------------------
export function subscribeToCloudState(onRemoteState) {
  if (typeof onRemoteState !== "function") {
    throw new Error("subscribeToCloudState: onRemoteState має бути функцією");
  }

  const ref = getStateDocRef();
  const localClientId = getClientId();

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const meta = data.__meta || {};
      const fromClient = meta.clientId || "unknown";

      // Якщо хочеш НЕ застосовувати власні ж апдейти (щоб не миготіло),
      // можна пропускати, але я залишаю застосування — так надійніше.
      // if (fromClient === localClientId) return;

      // Приберемо __meta зі state, щоб не ламало твою структуру
      if (data.__meta) delete data.__meta;

      console.log(
        `🔄 Cloud update received (from=${fromClient}, this=${localClientId})`
      );

      onRemoteState(data);
    },
    (err) => {
      console.warn("⚠ subscribeToCloudState error", err);
    }
  );
}