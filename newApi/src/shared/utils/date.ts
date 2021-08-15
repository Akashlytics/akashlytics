


export const getDayStr = (date?: Date) => {
  return date ? date.toISOString().split("T")[0] : getDay().toISOString().split('T')[0];
}

function getDay() {
  let currentDate = toUTC(new Date());
  currentDate.setUTCHours(0, 0, 0, 0);

  return currentDate;
}

function toUTC(date) {
  var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

  return new Date(now_utc);
}