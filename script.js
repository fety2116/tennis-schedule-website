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
    if (slot.status === "rejected") return;

    let start = slot.time?.toDate?.() || new Date(slot.time);
    if (!start) return;

    const durationMinutes = slot.duration || 30;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    let title = "Private Lesson";
    if (slot.status === "pending") title = "Pending";
    else if (slot.status === "confirmed") title = "Private Lesson";
    else if (slot.status === "blocked") title = "Blocked / Unavailable";
    else if (slot.status === "summercamp") title = "Summer Camp";
    else if (slot.status === "mens") title = "Men's Lesson";
    else if (slot.status === "womens") title = "Women's Lesson";
    else if (slot.status === "kids") title = "Kids Lesson";

    let extendedProps = {};
    if (["summercamp", "mens", "womens", "kids"].includes(slot.status)) {
      extendedProps = { showLink: true, type: slot.status };
    }

    events.push({
      id: docSnap.id,
      title,
      start,
      end,
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
      container.style.fontSize = "0.85rem";
      container.style.lineHeight = "1.2";
      container.style.padding = "2px 4px";
      container.style.borderRadius = "4px";

      const now = new Date();
      const isPast = arg.event.end < now;

      const type = arg.event.extendedProps.type || arg.event.title.toLowerCase();
      let bg = "#4caf50"; // default green

      if (arg.event.title === "Pending") bg = "#ff9800";
      else if (arg.event.title === "Blocked / Unavailable") bg = "#666666";
      else if (type === "summercamp") bg = "#2e7d32";
      else if (type === "mens") bg = "#4caf50";
      else if (type === "womens") bg = "#4caf50";
      else if (type === "kids") bg = "#1b5e20";
      else if (type === "private lesson") bg = "#388e3c";

      if (isPast) {
        container.style.backgroundColor = "#ddd";
        container.style.color = "#444";
        container.style.opacity = "0.7";
      } else {
        container.style.backgroundColor = bg;
        container.style.color = "white";
      }

      const startTimeStr = arg.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTimeStr = arg.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const timeEl = document.createElement("div");
      timeEl.textContent = `${startTimeStr} - ${endTimeStr}`;
      timeEl.style.fontWeight = "400";
      container.appendChild(timeEl);

      const titleEl = document.createElement("div");
      titleEl.textContent = arg.event.title;
      titleEl.style.fontWeight = "600";
      container.appendChild(titleEl);

      if (arg.event.extendedProps.showLink) {
        const link = document.createElement("a");
        link.href = "#";
        link.textContent = arg.event.extendedProps.type === "summercamp" ? "Register now" : "Get membership";
        link.style.display = "block";
        link.style.marginTop = "4px";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";
        link.style.color = isPast ? "#444" : "white";

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

generateTimeOptions();
restrictPastDates();
loadSlotsAndRenderCalendar();
