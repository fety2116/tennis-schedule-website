import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// Generate time options from 7:00 to 21:00 every 30 minutes
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

// Prevent choosing past dates
function restrictPastDates() {
  const today = new Date();
  bookingDateInput.min = today.toISOString().split("T")[0];
}

// Load busy slots and render them in calendar
async function loadSlotsAndRenderCalendar() {
  const q = query(collection(db, "slots"), where("status", "in", ["pending", "confirmed", "blocked"]));
  const snapshot = await getDocs(q);
  const events = [];

  snapshot.forEach(docSnap => {
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
      color
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
      right: "timeGridWeek,timeGridDay"
    },
    slotDuration: "00:30:00",
    slotMinTime: "06:00:00",
    slotMaxTime: "21:00:00",
    allDaySlot: false,
    events,
    height: "100%"
  });

  calendar.render();
}

// Check if two time intervals overlap
function isOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

// Handle form submission
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

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = startTimeStr.split(":").map(Number);
  const startTime = new Date(year, month - 1, day, hours, minutes);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  // Check for conflicts
  const q = query(collection(db, "slots"), where("status", "in", ["pending", "confirmed", "blocked"]));
  const busySnapshot = await getDocs(q);

  for (const docSnap of busySnapshot.docs) {
    const slot = docSnap.data();
    const slotStart = slot.time.toDate();
    const slotDuration = slot.duration || 30;
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

    if (isOverlap(startTime, endTime, slotStart, slotEnd)) {
      alert("Selected time overlaps with an existing booking.");
      return;
    }
  }

  // Add booking with pending status
  await addDoc(collection(db, "slots"), {
    time: startTime,
    status: "pending",
    duration: durationHours * 60, // minutes
    bookedBy: name,
    contact: contact
  });

  alert("Your booking request has been sent. Please wait for confirmation.");
  bookingForm.reset();
  modal.style.display = "none";
  await loadSlotsAndRenderCalendar();
});

// Show modal on button click
openBookingBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Close modal on cancel button click
closeBookingBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal on clicking outside the form
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Init
generateTimeOptions();
restrictPastDates();
loadSlotsAndRenderCalendar();
