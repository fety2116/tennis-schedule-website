import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Берём Luxon из глобального объекта (в html должен быть подключён перед этим скриптом)
const DateTime = luxon.DateTime;

const calendarEl = document.getElementById("calendar");
const bookingForm = document.getElementById("bookingForm");
const nameInput = document.getElementById("name");
const contactInput = document.getElementById("contact");
const bookingDateInput = document.getElementById("bookingDate");
const startTimeSelect = document.getElementById("startTime");
const durationSelect = document.getElementById("duration");
const openBookingBtn = document.getElementById("openBooking");
const modal = document.getElementById("modal");
const closeBookingBtn = document.getElementById("closeBooking");

let calendar = null;

// Генерация опций времени с 7:00 до 21:00 каждые 30 минут
function generateTimeOptions() {
  startTimeSelect.innerHTML = "";
  for (let hour = 7; hour <= 21; hour++) {
    for (let min of [0, 30]) {
      const value = `${hour.toString().padStart(2, "0")}:${min === 0 ? "00" : "30"}`;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      startTimeSelect.appendChild(option);
    }
  }
}

// Ограничиваем выбор прошедших дат (мин.дата = сегодня)
function restrictPastDates() {
  const today = new Date();
  bookingDateInput.min = today.toISOString().split("T")[0];
}

// Загружаем слоты из Firestore и показываем их в календаре
async function loadSlotsAndRenderCalendar() {
  const q = query(
    collection(db, "slots"),
    where("status", "in", ["pending", "confirmed", "blocked"])
  );
  const snapshot = await getDocs(q);
  const events = [];

  snapshot.forEach((docSnap) => {
    const slot = docSnap.data();
    let start = null;
    if (slot.time && typeof slot.time.toDate === "function") {
      start = slot.time.toDate();
    } else if (slot.time) {
      start = new Date(slot.time);
    }
    if (!start) return;

    const durationMinutes = slot.duration || 30;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    let color = "gray";
    let title = "";

    switch (slot.status) {
      case "pending":
        color = "orange";
        title = "Pending";
        break;
      case "confirmed":
        color = "green";
        title = "Booked";
        break;
      case "blocked":
        color = "gray";
        title = "Blocked";
        break;
    }

    events.push({
      id: docSnap.id,
      title,
      start,
      end,
      color,
    });
  });

  if (calendar) {
    calendar.destroy();
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    timeZone: "America/Edmonton",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "timeGridWeek,timeGridDay",
    },
    slotDuration: "00:30:00",
    slotMinTime: "06:00:00",
    slotMaxTime: "21:00:00",
    allDaySlot: false,
    events,
    height: "100%",
  });

  calendar.render();
}

// Проверяем пересечение двух временных интервалов
function isOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

// Обработка отправки формы бронирования
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const contact = contactInput.value.trim();
  const dateStr = bookingDateInput.value;
  const startTimeStr = startTimeSelect.value;
  const durationHours = parseFloat(durationSelect.value);

  if (!name || !contact || !dateStr || !startTimeStr || !durationHours) {
    alert("Please fill in all fields");
    return;
  }

  // Создаём DateTime в зоне America/Edmonton с помощью Luxon
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = startTimeStr.split(":").map(Number);

  const startDT = DateTime.fromObject(
    { year, month, day, hour: hours, minute: minutes },
    { zone: "America/Edmonton" }
  );

  const startTime = startDT.toJSDate();
  const endDT = startDT.plus({ hours: durationHours });
  const endTime = endDT.toJSDate();

  // Проверяем пересечения со слотами в Firestore
  const q = query(
    collection(db, "slots"),
    where("status", "in", ["pending", "confirmed", "blocked"])
  );
  const busySnapshot = await getDocs(q);

  for (const docSnap of busySnapshot.docs) {
    const slot = docSnap.data();
    let slotStart = null;
    if (slot.time && typeof slot.time.toDate === "function") {
      slotStart = slot.time.toDate();
    } else if (slot.time) {
      slotStart = new Date(slot.time);
    }
    if (!slotStart) continue;

    const slotDuration = slot.duration || 30;
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

    if (isOverlap(startTime, endTime, slotStart, slotEnd)) {
      alert("Selected time overlaps with an existing booking.");
      return;
    }
  }

  // Добавляем новый слот с статусом pending
  await addDoc(collection(db, "slots"), {
    time: startTime,
    status: "pending",
    duration: durationHours * 60, // минуты
    bookedBy: name,
    contact: contact,
  });

  alert("Your booking request has been sent. Please wait for confirmation.");
  bookingForm.reset();
  modal.style.display = "none";
  await loadSlotsAndRenderCalendar();
});

// Открытие и закрытие модального окна
openBookingBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeBookingBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Инициализация
generateTimeOptions();
restrictPastDates();
loadSlotsAndRenderCalendar();
