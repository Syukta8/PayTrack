const DATE_KEY = /^\d{4}-(\d{2})-(\d{2})$/;

/** Restricts a user-selected cycle start day to the valid monthly range. */
export function normalizeCycleStartDay(value: number): number {
  return Number.isInteger(value) && value >= 1 && value <= 31 ? value : 1;
}

/** Finds the day used by a cycle in a month, including short months. */
export function cycleDayInMonth(year: number, monthIndex: number, cycleStartDay: number): number {
  return Math.min(normalizeCycleStartDay(cycleStartDay), new Date(year, monthIndex + 1, 0).getDate());
}

/** Returns the inclusive reporting period containing a local YYYY-MM-DD date. */
export function trackingCycleForDate(dateKey: string, cycleStartDay: number): { start: string; end: string } {
  if (!DATE_KEY.test(dateKey)) throw new Error("Tracking cycles require a valid YYYY-MM-DD date.");
  const [year, month, day] = dateKey.split("-").map(Number);
  const startsThisMonth = day >= cycleDayInMonth(year, month - 1, cycleStartDay);
  const sourceMonth = startsThisMonth ? month - 1 : month - 2;
  const startYear = sourceMonth < 0 ? year - 1 : year;
  const startMonth = (sourceMonth + 12) % 12;
  const endMonthCandidate = startMonth + 1;
  const endYear = endMonthCandidate === 12 ? startYear + 1 : startYear;
  const endMonth = endMonthCandidate % 12;
  const startDay = cycleDayInMonth(startYear, startMonth, cycleStartDay);
  const nextStartDay = cycleDayInMonth(endYear, endMonth, cycleStartDay);
  const end = new Date(endYear, endMonth, nextStartDay - 1);
  return {
    start: `${startYear}-${String(startMonth + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
  };
}

/** Builds a stable selector key from the beginning of a reporting cycle. */
export function trackingCycleKey(dateKey: string, cycleStartDay: number): string {
  return trackingCycleForDate(dateKey, cycleStartDay).start;
}
