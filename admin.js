import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const bookingsTable = document.querySelector("#bookingsTable tbody");
const confirmedTable = document.querySelector("#confirmedTable tbody");
const blockForm = document.getElementById("blockForm");
const blockDate = document.getElementById("blockDate");
const blockTime = document.getElementById("blockTime");
const blockDuration = document.getElementById("blockDuration");
const blockStatus = document.getElementById("blockStatus");
const blockType = document.getElementById("blockType");
const logoutBtn = document.getElementById("logoutBtn");

// Проверка авторизации и загрузка данных
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Access denied. Please login.");
    window.location.href = "login.html";
  } else {
    loadPendingBookings();
    loadConfirmedBookings();
  }
});

// Выход из админки
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// Генерация опций времени для блокировки
function generateTimeOptions() {
  blockTime.innerHTML = "";
  const startHour = 6,
    startMinute = 30;
  const endHour = 21,
    endMinute = 0;

  let current = new Date();
  current.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);

  while (current <= endTime) {
    const h = current.getHours().toString().padStart(2, "0");
    const m = current.getMinutes().toString().padStart(2, "0");
    const option = document.createElement("option");
    option.value = `${h}:${m}`;
    option.textContent = `${h}:${m}`;
    blockTime.appendChild(option);

    current.setMinutes(current.getMinutes() + 30);
  }
}
generateTimeOptions();

// Загрузка pending заявок
async function loadPendingBookings() {
  try {
    const q = query(collection(db, "slots"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);

    bookingsTable.innerHTML = "";
    if (snapshot.empty) {
      bookingsTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#666;">No pending bookings</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const slot = docSnap.data();
      const start = slot.time.toDate();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${slot.bookedBy || ""}</td>
        <td>${slot.contact || ""}</td>
        <td>${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td>${slot.duration} min</td>
        <td>${slot.status}</td>
        <td>
          <button class="confirm" data-id="${docSnap.id}">Confirm</button>
          <button class="reject" data-id="${docSnap.id}">Reject</button>
        </td>
      `;

      bookingsTable.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading pending bookings:", error);
    alert("Failed to load pending bookings. Check console.");
  }
}

// Загрузка confirmed заявок с сортировкой по времени
async function loadConfirmedBookings() {
  try {
    const q = query(
      collection(db, "slots"),
      where("status", "==", "confirmed"),
      orderBy("time", "asc")
    );
    const snapshot = await getDocs(q);

    confirmedTable.innerHTML = "";
    if (snapshot.empty) {
      confirmedTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#666;">No confirmed bookings</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const slot = docSnap.data();
      const start = slot.time.toDate();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${slot.bookedBy || ""}</td>
        <td>${slot.contact || ""}</td>
        <td>${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td>${slot.duration} min</td>
        <td>${slot.status}</td>
        <td>${slot.type || "-"}</td>
      `;

      confirmedTable.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading confirmed bookings:", error);
    alert("Failed to load confirmed bookings. Check console.");
  }
}

// Обработка кнопок Confirm и Reject
bookingsTable.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  try {
    const docRef = doc(db, "slots", id);

    if (e.target.classList.contains("confirm")) {
      await updateDoc(docRef, { status: "confirmed" });
    } else if (e.target.classList.contains("reject")) {
      await updateDoc(docRef, { status: "rejected" });
    } else {
      return;
    }

    await loadPendingBookings();
    await loadConfirmedBookings();
  } catch (error) {
    console.error("Error updating booking status:", error);
    alert("Failed to update booking status. Check console.");
  }
});

// Обработка формы блокировки времени
blockForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dateStr = blockDate.value;
  const timeStr = blockTime.value; // "HH:MM"
  const duration = parseInt(blockDuration.value);
  const status = blockStatus.value;
  const type = blockType.value;

  if (!dateStr || !timeStr || !duration || duration <= 0 || !status || !type) {
    alert("Please fill all fields with valid data.");
    return;
  }

  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  // Проверка времени в нужном диапазоне
  const totalMinutes = hour * 60 + minute;
  if (totalMinutes < (6 * 60 + 30) || totalMinutes > (21 * 60)) {
    alert("Time must be between 06:30 and 21:00.");
    return;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const startTime = new Date(year, month - 1, day, hour, minute);

  try {
    await addDoc(collection(db, "slots"), {
      time: Timestamp.fromDate(startTime),
      duration,
      status,
      type
    });

    alert(`Time with status "${status}" and type "${type}" saved successfully.`);
    blockForm.reset();
    blockDuration.value = "30";

    await loadPendingBookings();
    await loadConfirmedBookings();
  } catch (error) {
    console.error("Error saving slot:", error);
    alert("Failed to save slot. Check console.");
  }
});
