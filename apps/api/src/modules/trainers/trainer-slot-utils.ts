/** Aligned with gym booking slot grid for MVP */
export function defaultSlotTimes(): string[] {
  return ["06:30", "07:30", "09:00", "17:30", "19:00"];
}

export function weekdayShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export function slotStartEndFor(dateIso: string, start: string): { startTime: string; endTime: string } {
  const startTime = `${start}:00`;
  const endTime = start === "19:00" ? "20:00:00" : `${start.split(":")[0]}:${start.split(":")[1]}:00`;
  return {
    startTime: `${dateIso}T${startTime}Z`,
    endTime: `${dateIso}T${endTime}Z`,
  };
}
