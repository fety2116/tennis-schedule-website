import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Новый firebaseConfig (тот, что для booking-site-b80ac)
const firebaseConfig = {
  apiKey: "AIzaSyDrhv1mxgda0wrBZeLyCakG5sPlFVT2w8s",
  authDomain: "booking-site-b80ac.firebaseapp.com",
  projectId: "booking-site-b80ac",
  storageBucket: "booking-site-b80ac.firebasestorage.app",
  messagingSenderId: "328839671227",
  appId: "1:328839671227:web:b6d7ccc7825c7e11b6289e"
};

// Инициализация только если еще не инициализировано
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Вставь сюда JSON, который скопировала из старого проекта
const oldSlots = [ 
  {
    "duration": 300,
    "time": "2025-07-30T20:00:00.117Z",
    "status": "blocked"
  },
  {
    "duration": 60,
    "time": "2025-07-30T00:00:00.000Z",
    "status": "blocked"
  },
  {
    "duration": 180,
    "status": "blocked",
    "time": "2025-08-11T15:00:00.000Z"
  },
  {
    "status": "blocked",
    "time": "2025-07-30T15:00:00.000Z",
    "duration": 180
  },
  {
    "duration": 120,
    "time": "2025-08-07T22:00:00.000Z",
    "status": "blocked"
  },
  {
    "status": "blocked",
    "time": "2025-07-31T15:00:00.000Z",
    "duration": 180
  },
  {
    "status": "blocked",
    "time": "2025-07-28T15:00:00.000Z",
    "duration": 180
  },
  {
    "status": "blocked",
    "time": "2025-08-06T15:00:00.000Z",
    "duration": 180
  },
  {
    "duration": 120,
    "status": "blocked",
    "time": "2025-07-17T22:00:00.000Z"
  },
  {
    "duration": 180,
    "status": "blocked",
    "time": "2025-07-14T15:00:00.000Z"
  },
  {
    "time": "2025-08-12T15:00:00.000Z",
    "status": "blocked",
    "duration": 180
  },
  {
    "time": "2025-07-24T15:00:00.000Z",
    "status": "blocked",
    "duration": 180
  },
  {
    "duration": 180,
    "status": "blocked",
    "time": "2025-07-22T15:00:00.000Z"
  },
  {
    "time": "2025-07-23T15:00:00.000Z",
    "duration": 180,
    "status": "blocked"
  },
  {
    "bookedBy": "Roxanne's kids (Henry, Phillipe, Andre)",
    "contact": "+1 418 455-2172",
    "duration": 120,
    "time": "2025-07-12T00:00:00.000Z",
    "status": "confirmed"
  },
  {
    "status": "blocked",
    "time": "2025-07-16T15:00:00.000Z",
    "duration": 180
  },
  {
    "time": "2025-07-23T20:00:00.313Z",
    "status": "blocked",
    "duration": 300
  },
  {
    "time": "2025-08-05T15:00:00.000Z",
    "duration": 180,
    "status": "blocked"
  },
  {
    "time": "2025-07-18T15:00:00.000Z",
    "duration": 180,
    "status": "blocked"
  },
  {
    "time": "2025-07-16T00:00:00.000Z",
    "status": "blocked",
    "duration": 60
  },
  {
    "status": "blocked",
    "time": "2025-07-11T15:00:00.000Z",
    "duration": 180
  },
  {
    "time": "2025-07-12T15:00:00.249Z",
    "duration": 60,
    "contact": "+1 604 833-8052",
    "bookedBy": "Diana and Scott",
    "status": "confirmed"
  },
  {
    "status": "confirmed",
    "duration": 60,
    "bookedBy": "Hilary's kids (Penelope and Sebastian)",
    "contact": "hilarynicolespence@gmail.com",
    "time": "2025-07-29T22:30:00.000Z"
  },
  {
    "status": "blocked",
    "duration": 120,
    "time": "2025-07-31T22:00:00.000Z"
  },
  {
    "duration": 120,
    "contact": "kids",
    "status": "blocked",
    "bookedBy": "kids",
    "time": "2025-07-10T22:00:00.000Z"
  },
  {
    "duration": 180,
    "status": "blocked",
    "time": "2025-08-07T15:00:00.000Z"
  },
  {
    "status": "blocked",
    "duration": 180,
    "time": "2025-07-29T15:00:00.000Z"
  },
  {
    "time": "2025-07-24T22:00:00.000Z",
    "status": "blocked",
    "duration": 120
  },
  {
    "status": "blocked",
    "time": "2025-08-14T15:00:00.000Z",
    "duration": 180
  },
  {
    "status": "blocked",
    "time": "2025-07-17T15:00:00.000Z",
    "duration": 180
  },
  {
    "status": "blocked",
    "time": "2025-08-15T15:00:00.000Z",
    "duration": 180
  },
  {
    "status": "blocked",
    "time": "2025-07-15T15:00:00.000Z",
    "duration": 180
  },
  {
    "bookedBy": "Hilary's kids (Penelope and Sebastian)",
    "status": "confirmed",
    "time": "2025-07-15T22:30:00.000Z",
    "duration": 60,
    "contact": "hilarynicolespence@gmail.com"
  },
  {
    "time": "2025-07-22T22:30:00.000Z",
    "status": "confirmed",
    "contact": "hilarynicolespence@gmail.com",
    "duration": 60,
    "bookedBy": "Hilary's kids (Penelope and Sebastian)"
  },
  {
    "duration": 30,
    "bookedBy": "Данил",
    "time": "2025-07-11T11:30:00.000Z",
    "status": "rejected",
    "contact": "1"
  },
  {
    "status": "blocked",
    "duration": 180,
    "time": "2025-08-08T15:00:00.000Z"
  },
  {
    "status": "rejected",
    "bookedBy": "1",
    "contact": "1",
    "duration": 30,
    "time": "2025-07-11T13:00:00.000Z"
  },
  {
    "time": "2025-07-25T15:00:00.000Z",
    "status": "blocked",
    "duration": 180
  },
  {
    "time": "2025-07-21T15:00:00.000Z",
    "status": "blocked",
    "duration": 180
  },
  {
    "contact": "z",
    "status": "blocked",
    "duration": 300,
    "bookedBy": "z",
    "time": "2025-07-16T20:00:00.000Z"
  },
  {
    "status": "blocked",
    "time": "2025-08-13T15:00:00.000Z",
    "duration": 180
  },
  {
    "time": "2025-07-23T00:00:00.128Z",
    "status": "blocked",
    "duration": 60
  },
  {
    "status": "blocked",
    "time": "2025-07-09T20:00:00.013Z",
    "duration": "300",
    "Contact": "",
    "Name": ""
  },
  {
    "status": "blocked",
    "time": "2025-08-01T15:00:00.000Z",
    "duration": 180
  }
];

async function importSlots() {
  for (const slot of oldSlots) {
    if (!slot.time) continue; // пропускаем слоты без времени
    await addDoc(collection(db, "slots"), {
      time: Timestamp.fromDate(new Date(slot.time)),
      status: slot.status || "available",
      bookedBy: slot.bookedBy || "",
      contact: slot.contact || ""
    });
  }
  console.log("✅ Импорт завершён");
}

importSlots();
