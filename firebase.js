// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQcwegDSfjfuoeKq7s42Eexxj_gGfyQro",
  authDomain: "tennis-schedule-ltc.firebaseapp.com",
  projectId: "tennis-schedule-ltc",
  storageBucket: "tennis-schedule-ltc.firebasestorage.app",
  messagingSenderId: "913456855993",
  appId: "1:913456855993:web:89af8a5df62d4fda291468"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
