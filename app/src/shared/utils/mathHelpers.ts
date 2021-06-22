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