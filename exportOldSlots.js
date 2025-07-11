import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔒 Старый config (тот, который был до booking-site-b80ac)
const firebaseConfig = {
  apiKey: "AIzaSyAQcwegDSfjfuoeKq7s42Eexxj_gGfyQro",
  authDomain: "tennis-schedule-ltc.firebaseapp.com",
  projectId: "tennis-schedule-ltc",
  storageBucket: "tennis-schedule-ltc.firebasestorage.app",
  messagingSenderId: "913456855993",
  appId: "1:913456855993:web:89af8a5df62d4fda291468"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportSlots() {
  const snapshot = await getDocs(collection(db, "slots"));
  const data = [];
  snapshot.forEach(doc => {
    const slot = doc.data();
    // Преобразуем timestamp в ISO строку
    data.push({
      ...slot,
      time: slot.time?.toDate?.().toISOString() || null
    });
  });
  console.log("SLOTS_JSON:", JSON.stringify(data, null, 2));
}

exportSlots();
