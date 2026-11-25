/** GS1 check digit for EAN-8, UPC-A, EAN-13 and GTIN-14. */
export function isValidGtin(value: string): boolean {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  if (/^0+$/.test(value)) return false;
  const body = value.slice(0, -1).split("").reverse();
  const sum = body.reduce(
    (total, digit, index): number =>
      total + Number(digit) * (index % 2 === 0 ? 3 : 1),
    0,
  );
  return (10 - (sum % 10)) % 10 === Number(value.at(-1));
}

/** UPC-E needs expansion before its GS1 checksum can be checked. */
export function expandUpce(value: string): string | null {
  if (!/^[01]\d{7}$/.test(value)) return null;
  const [system, a, b, c, d, e, f, check] = value;
  const body = "012".includes(f)
    ? `${a}${b}${f}0000${c}${d}${e}`
    : f === "3"
      ? `${a}${b}${c}00000${d}${e}`
      : f === "4"
        ? `${a}${b}${c}${d}00000${e}`
        : `${a}${b}${c}${d}${e}0000${f}`;
  const expanded = `${system}${body}${check}`;
  return isValidGtin(expanded) ? expanded : null;
}

export function createBarcodeVerifier(): (
  value: string,
  now?: number,
) => string | null {
  let previous = "";
  let count = 0;
  let lastTime = 0;
  return (value: string, now = Date.now()): string | null => {
    if (!isValidGtin(value)) {
      previous = "";
      count = 0;
      return null;
    }
    count = previous === value && now - lastTime < 1500 ? count + 1 : 1;
    previous = value;
    lastTime = now;
    return count >= 3 ? value : null;
  };
}
