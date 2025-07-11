// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrhv1mxgda0wrBZeLyCakG5sPlFVT2w8s",
  authDomain: "booking-site-b80ac.firebaseapp.com",
  projectId: "booking-site-b80ac",
  storageBucket: "booking-site-b80ac.firebasestorage.app",
  messagingSenderId: "328839671227",
  appId: "1:328839671227:web:b6d7ccc7825c7e11b6289e"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
