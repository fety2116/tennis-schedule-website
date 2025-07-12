import { db } from "./firebase.js";
import {
  collection, query, where, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const calendarEl = document.getElementById("calendar");
const modal = document.getElementById("modal");
const openBookingBtn = document.getElementById("openBooking");
const bookingForm = document.getElementById("bookingForm");
const closeBookingBtn = document.getElementById("closeBooking");
const nameInput = document.getElementById("name");
const contactInput = document.getElementById("contact");
const bookingDateInput = document.getElementById("bookingDate");
const startTimeSelect = document.getElementById("startTime");
const durationSelect = document.getElementById("duration");

const registerModal = document.getElementById("registerModal");
const closeRegisterBtn = document.getElementById("closeRegister");

const membershipModal = document.getElementById("membershipModal");
const closeMembershipBtn = document.getElementById("closeMembership");

let calendar = null;

function generateTimeOptions() {
  startTimeSelect.innerHTML = "";
  for (let hour = 7; hour <= 21; hour++) {
    for (let min of [0, 30]) {
      const value = `${hour.toString().padStart(2, '0')}:${min === 0 ? '00' : '30'}`;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      startTimeSelect.appendChild(option);
    }
  }
}

function restrictPastDates() {
  const today = new Date();
  bookingDateInput.min = today.toISOString().split("T")[0];
}

async function loadSlotsAndRenderCalendar() {
  const q = query(collection(db, "slots"), where("status", "!=", "rejected"));
  const snapshot = await getDocs(q);
  const events = [];

  snapshot.forEach(docSnap => {
    const slot = docSnap.data();
    if (slot.status === "rejected") return; // фильтр дополнительно

    let start = slot.time?.toDate?.() || new Date(slot.time);
    if (!start) return;

    const durationMinutes = slot.duration || 30;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    // Цвета по статусам и типам
    let color = "#4caf50"; // зеленый по умолчанию (private lesson)
    let title = "Private Lesson";

    if (slot.status === "pending") {
      color = "#ff9800"; // оранжевый
      title = "Pending";
    } else if (slot.status === "confirmed") {
      color = "#388e3c"; // средний зеленый (confirmed private)
      title = "Private Lesson";
    } else if (slot.status === "blocked") {
      color = "#666666"; // серый для блоков
      title = "Blocked / Unavailable";
    } else if (slot.status === "summercamp") {
      color = "#2e7d32"; // темный зеленый (летний лагерь)
      title = "Summer Camp";
    } else if (slot.status === "mens") {
      color = "#4caf50"; // светло-зеленый (мужские)
      title = "Men's Lesson";
    } else if (slot.status === "womens") {
      color = "#4caf50"; // светло-зеленый (женские)
      title = "Women's Lesson";
    } else if (slot.status === "kids") {
      color = "#1b5e20"; // темный зеленый (детские)
      title = "Kids Lesson";
    }

    let extendedProps = {};
    if (["summercamp", "mens", "womens", "kids"].includes(slot.status)) {
      extendedProps = { showLink: true, type: slot.status };
    }

    events.push({
      id: docSnap.id,
      title,
      start,
      end,
      color,
      ...extendedProps
    });
  });

  if (calendar) calendar.destroy();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "timeGridWeek,timeGridDay"
    },
    slotDuration: "00:30:00",
    slotMinTime: "06:00:00",
    slotMaxTime: "21:00:00",
    allDaySlot: false,
    height: "100%",
    events,
    eventContent: function(arg) {
      const container = document.createElement("div");
      container.style.color = "white";
      container.style.fontSize = "0.85rem";
      container.style.lineHeight = "1.2";

      // Время обычным шрифтом
      const startTimeStr = arg.event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const endTimeStr = arg.event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      const timeEl = document.createElement("div");
      timeEl.textContent = `${startTimeStr} - ${endTimeStr}`;
      timeEl.style.fontWeight = "400"; // обычный шрифт для времени
      timeEl.style.textShadow = "none";
      container.appendChild(timeEl);

      // Заголовок жирным
      const titleEl = document.createElement("div");
      titleEl.textContent = arg.event.title;
      titleEl.style.fontWeight = "500"; // жирный
      titleEl.style.textShadow = "none";
      container.appendChild(titleEl);

      if (arg.event.extendedProps.showLink) {
        const link = document.createElement("a");
        link.href = "#";
        link.textContent = arg.event.extendedProps.type === "summercamp" ? "Register now" : "Get membership";
        link.style.display = "block";
        link.style.marginTop = "4px";
        link.style.color = "white";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";

        link.addEventListener("click", (e) => {
          e.preventDefault();
          if (arg.event.extendedProps.type === "summercamp") {
            registerModal.style.display = "flex";
          } else {
            membershipModal.style.display = "flex";
          }
        });

        container.appendChild(link);
      }

      return { domNodes: [container] };
    }
  });

  calendar.render();
}

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const contact = contactInput.value.trim();
  const dateStr = bookingDateInput.value;
  const startTimeStr = startTimeSelect.value;
  const durationHours = parseFloat(durationSelect.value);

  if (!name || !contact || !dateStr || !startTimeStr || !durationHours) {
    alert("Please fill in all fields.");
    return;
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = startTimeStr.split(":").map(Number);
  const start = new Date(y, m - 1, d, h, min);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  const q = query(collection(db, "slots"), where("status", "in", ["pending", "confirmed", "blocked"]));
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const slot = docSnap.data();
    const slotStart = slot.time.toDate();
    const slotEnd = new Date(slotStart.getTime() + slot.duration * 60000);
    if (start < slotEnd && slotStart < end) {
      alert("Conflict with another booking.");
      return;
    }
  }

  await addDoc(collection(db, "slots"), {
    time: start,
    status: "pending",
    duration: durationHours * 60,
    bookedBy: name,
    contact: contact
  });

  alert("Booking request submitted.");
  bookingForm.reset();
  modal.style.display = "none";
  await loadSlotsAndRenderCalendar();
});

openBookingBtn.addEventListener("click", () => modal.style.display = "flex");
closeBookingBtn.addEventListener("click", () => modal.style.display = "none");
modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

closeRegisterBtn.addEventListener("click", () => { registerModal.style.display = "none"; });
closeMembershipBtn.addEventListener("click", () => { membershipModal.style.display = "none"; });

registerModal.addEventListener("click", (e) => { if (e.target === registerModal) registerModal.style.display = "none"; });
membershipModal.addEventListener("click", (e) => { if (e.target === membershipModal) membershipModal.style.display = "none"; });

generateTimeOptions();
restrictPastDates();
loadSlotsAndRenderCalendar();
