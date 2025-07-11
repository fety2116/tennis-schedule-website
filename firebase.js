// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIz4Lcnioo1DAh_S11O1jKC5nyo_ggX5w",
  authDomain: "tennis-schedule-ltc.firebaseapp.com",
  projectId: "tennis-schedule-ltc",
  storageBucket: "tennis-schedule-ltc.firebasestorage.app",
  messagingSenderId: "913456855993",
  appId: "1:913456855993:web:906283fedb4373bf291468"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
