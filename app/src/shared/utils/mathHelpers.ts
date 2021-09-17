export function average(a: number, b: number) {
  return (a + b) / 2
}

export function round(amount: number, precision: number = 2) {
  return Math.round((amount + Number.EPSILON) * Math.pow(10, precision)) / Math.pow(10, precision);
}

export function uaktToAKT(amount, precision = 2) {
  return round(amount / 1000000, precision);
}

export function percIncrease(a: number, b: number) {
  let percent: number;
  if (b !== 0) {
    if (a !== 0) {
      percent = (b - a) / a;
    } else {
      percent = b;
    }
  } else {
    percent = - a;
  }
  return round(percent, 4);
}

export function nFormatter(num: number, digits: number) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}