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
const blockForm = document.getElementById("blockForm");
const blockDate = document.getElementById("blockDate");
const blockHour = document.getElementById("blockHour");
const blockMinute = document.getElementById("blockMinute");
const blockDuration = document.getElementById("blockDuration");
const blockStatus = document.getElementById("blockStatus");

// Загрузка заявок со статусом "pending"
async function loadBookings() {
  try {
    const q = query(collection(db, "slots"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);

    bookingsTable.innerHTML = "";
    snapshot.forEach(docSnap => {
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

    if (snapshot.empty) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="6" style="text-align:center; color:#666;">No pending bookings</td>`;
      bookingsTable.appendChild(emptyRow);
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    alert("Failed to load bookings. Check console for details.");
  }
}

// Обработчик кнопок Confirm и Reject
bookingsTable.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("confirm")) {
    try {
      const docRef = doc(db, "slots", id);
      await updateDoc(docRef, { status: "confirmed" });
      await loadBookings();
    } catch (error) {
      console.error("Error confirming booking:", error);
      alert("Failed to confirm booking. Check console for details.");
    }
  } else if (e.target.classList.contains("reject")) {
    try {
      const docRef = doc(db, "slots", id);
      await updateDoc(docRef, { status: "rejected" });
      await loadBookings();
    } catch (error) {
      console.error("Error rejecting booking:", error);
      alert("Failed to reject booking. Check console for details.");
    }
  }
});

// Обработка формы блокировки времени
blockForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dateStr = blockDate.value;
  const hour = parseInt(blockHour.value);
  const minute = parseInt(blockMinute.value);
  const duration = parseInt(blockDuration.value);
  const status = blockStatus.value;

  if (!dateStr || isNaN(hour) || isNaN(minute) || !duration || duration <= 0 || !status) {
    alert("Please fill all fields with valid data.");
    return;
  }

  if (hour < 0 || hour > 23) {
    alert("Hour must be between 0 and 23.");
    return;
  }

  if (minute !== 0 && minute !== 30) {
    alert("Minute must be 0 or 30.");
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
  } catch (error) {
    console.error("Error saving slot:", error);
    alert("Failed to save slot. Check console for details.");
  }
});

// Начальная загрузка заявок
loadBookings();

