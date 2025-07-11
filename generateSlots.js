async function generateSlots() {
  const startDate = new Date();
  const daysToGenerate = 90;
  const workDayStartHour = 7;
  const workDayEndHour = 20;

  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    for (let hour = workDayStartHour; hour < workDayEndHour; hour++) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);

      await addDoc(collection(db, "slots"), {
        time: slotStart,
        status: "available"
      });
    }
  }
  console.log("Slots generated!");
}

await generateSlots();

async function clearSlots() {
  const slotsRef = collection(db, "slots");
  const querySnapshot = await getDocs(slotsRef);
  for (const docSnap of querySnapshot.docs) {
    await deleteDoc(doc(db, "slots", docSnap.id));
  }
  console.log("All slots deleted");
}
await clearSlots();