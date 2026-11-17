const DIGITAL_FORMATS = new Set(['EBOOK', 'AUDIOBOOK']);

/** True when every line of the order is an eBook or audiobook: nothing ships, the book lives in the E-Library. */
export function isDigitalOnly(items = []) {
  return items.length > 0 && items.every((item) => DIGITAL_FORMATS.has(item.format));
}
