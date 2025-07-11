import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const bookingsTable = document.querySelector("#bookingsTable tbody");
const confirmedTable = document.querySelector("#confirmedTable tbody");
const blockForm = document.getElementById("blockForm");
const blockDate = document.getElementById("blockDate");
const blockTime = document.getElementById("blockTime");
const blockDuration = document.getElementById("blockDuration");
const blockStatus = document.getElementById("blockStatus");

// Загрузка заявок со статусом "pending"
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

// Загрузка заявок со статусом "confirmed"
async function loadConfirmedBookings() {
  try {
    const q = query(collection(db, "slots"), where("status", "==", "confirmed"));
    const snapshot = await getDocs(q);

    confirmedTable.innerHTML = "";
    if (snapshot.empty) {
      confirmedTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#666;">No confirmed bookings</td></tr>`;
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

  if (!dateStr || !timeStr || !duration || duration <= 0 || !status) {
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
      status
    });

    alert(`Time with status "${status}" saved successfully.`);
    blockForm.reset();
    blockDuration.value = "30";

    await loadPendingBookings();
    await loadConfirmedBookings();
  } catch (error) {
    console.error("Error saving slot:", error);
    alert("Failed to save slot. Check console.");
  }
});

// Инициализация загрузки
loadPendingBookings();
loadConfirmedBookings();
