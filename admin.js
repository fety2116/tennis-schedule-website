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
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const bookingsTable = document.querySelector("#bookingsTable tbody");
const confirmedTable = document.querySelector("#confirmedTable tbody");
const pastConfirmedTable = document.querySelector("#pastConfirmedTable tbody");

const blockForm = document.getElementById("blockForm");
const blockDate = document.getElementById("blockDate");
const blockTime = document.getElementById("blockTime");
const blockDuration = document.getElementById("blockDuration");
const blockStatus = document.getElementById("blockStatus");
const logoutBtn = document.getElementById("logoutBtn");
const cleanupBtn = document.getElementById("cleanupOldSlots");

// Форматирование даты-времени
function formatDateTime(date) {
  const options = { 
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    hour12: true
  };
  return date.toLocaleString(undefined, options);
}

// Проверка авторизации
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

// Генерация опций времени с 06:30 до 21:00 с шагом 30 мин
function generateTimeOptions() {
  blockTime.innerHTML = "";
  const startHour = 6, startMinute = 30;
  const endHour = 21, endMinute = 0;

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

// Загрузка pending bookings
async function loadPendingBookings() {
  try {
    const q = query(collection(db, "slots"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    bookingsTable.innerHTML = "";

    if (snapshot.empty) {
      bookingsTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#666;">No pending bookings</td></tr>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const slot = docSnap.data();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${slot.bookedBy || ""}</td>
        <td>${slot.contact || ""}</td>
        <td>${formatDateTime(slot.time.toDate())}</td>
        <td>${slot.duration} min</td>
        <td>${slot.status}</td>
        <td>
          <button class="confirm" data-id="${docSnap.id}">Confirm</button>
          <button class="reject" data-id="${docSnap.id}">Reject</button>
          <button class="delete-pending" data-id="${docSnap.id}">Delete</button>
        </td>
      `;
      bookingsTable.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading pending bookings:", err);
    alert("Failed to load pending bookings.");
  }
}

// Загрузка confirmed bookings с разделением на будущие и прошлые
async function loadConfirmedBookings() {
  try {
    const q = query(collection(db, "slots"), where("status", "==", "confirmed"));
    const snapshot = await getDocs(q);

    confirmedTable.innerHTML = "";
    pastConfirmedTable.innerHTML = "";

    const now = new Date();

    if (snapshot.empty) {
      confirmedTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#666;">No confirmed bookings</td></tr>`;
      pastConfirmedTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#666;">No past confirmed bookings</td></tr>`;
      return;
    }

const futureConfirmed = [];
const pastConfirmed = [];

snapshot.forEach(docSnap => {
  const slot = docSnap.data();
  const slotDate = slot.time.toDate();
  const isPast = slotDate < now;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${slot.bookedBy || ""}</td>
    <td>${slot.contact || ""}</td>
    <td>${formatDateTime(slotDate)}</td>
    <td>${slot.duration} min</td>
    <td>${slot.status}</td>
    <td><button class="delete" data-id="${docSnap.id}">Delete</button></td>
  `;

  if (isPast) {
    pastConfirmed.push({ date: slotDate, row });
  } else {
    futureConfirmed.push({ date: slotDate, row });
  }
});

// Сортируем оба массива по дате
futureConfirmed.sort((a, b) => a.date - b.date);
pastConfirmed.sort((a, b) => a.date - b.date);

// Добавляем отсортированные строки в таблицы
futureConfirmed.forEach(entry => confirmedTable.appendChild(entry.row));
pastConfirmed.forEach(entry => pastConfirmedTable.appendChild(entry.row));

  } catch (err) {
    console.error("Error loading confirmed bookings:", err);
    alert("Failed to load confirmed bookings.");
  }
}

// Обработчик кнопок Confirm, Reject и Delete
document.body.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  const docRef = doc(db, "slots", id);

  try {
    if (e.target.classList.contains("confirm")) {
      await updateDoc(docRef, { status: "confirmed" });
    } else if (e.target.classList.contains("reject")) {
      await updateDoc(docRef, { status: "rejected" });
    } else if (e.target.classList.contains("delete-pending")) {
      if (confirm("Are you sure you want to delete this pending booking?")) {
        await deleteDoc(docRef);
      }
    } else if (e.target.classList.contains("delete")) {
      if (confirm("Are you sure you want to delete this confirmed booking?")) {
        await deleteDoc(docRef);
      }
    }
    await loadPendingBookings();
    await loadConfirmedBookings();
  } catch (err) {
    console.error("Error handling action:", err);
    alert("An error occurred. Check console.");
  }
});

// Обработка формы блокировки / ручного бронирования
blockForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dateStr = blockDate.value;
  const timeStr = blockTime.value;
  const duration = parseInt(blockDuration.value);
  const status = blockStatus.value;

  if (!dateStr || !timeStr || !duration || duration <= 0 || !status) {
    alert("Please fill all required fields.");
    return;
  }

  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

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
    alert(`Slot with status/type "${status}" saved successfully.`);
    blockForm.reset();
    blockDuration.value = "30";
    await loadPendingBookings();
    await loadConfirmedBookings();
  } catch (err) {
    console.error("Error saving slot:", err);
    alert("Failed to save slot. Check console.");
  }
});

// Удаление старых слотов (старше 3 месяцев)
cleanupBtn.addEventListener("click", async () => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  try {
    const q = query(collection(db, "slots"));
    const snapshot = await getDocs(q);
    let deletedCount = 0;

    for (const docSnap of snapshot.docs) {
      const slot = docSnap.data();
      const start = slot.time.toDate ? slot.time.toDate() : new Date(slot.time);
      const end = new Date(start.getTime() + (slot.duration || 30) * 60000);

      if (end < threeMonthsAgo) {
        await deleteDoc(doc(db, "slots", docSnap.id));
        deletedCount++;
      }
    }

    alert(`✅ Deleted ${deletedCount} old slots.`);
    await loadPendingBookings();
    await loadConfirmedBookings();
  } catch (err) {
    console.error("Cleanup error:", err);
    alert("⚠️ Failed to clean up old slots.");
  }
});
