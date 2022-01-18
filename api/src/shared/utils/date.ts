


export const getDayStr = (date?: Date) => {
  return date ? toUTC(date).toISOString().split("T")[0] : getTodayUTC().toISOString().split('T')[0];
}

export function getTodayUTC() {
  let currentDate = toUTC(new Date());
  currentDate.setUTCHours(0, 0, 0, 0);

  return currentDate;
}

export function startOfDay(date: Date) {
  let currentDate = toUTC(date);
  currentDate.setUTCHours(0, 0, 0, 0);

  return currentDate;
}

export function endOfDay(date: Date) {
  let currentDate = toUTC(date);
  currentDate.setUTCHours(23, 59, 59, 999);

  return currentDate;
}

export function toUTC(date) {
  const now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

  return new Date(now_utc);
}