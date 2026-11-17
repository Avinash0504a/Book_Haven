/**
 * Format numbers / BigDecimal strings into Indian Rupee format (e.g. ₹499.00 or ₹499)
 */
export function formatRupees(amount, options = { decimals: 2 }) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0.00';
  }
  const num = Number(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options.decimals ?? 2,
    maximumFractionDigits: options.decimals ?? 2
  }).format(num);

  return formatted;
}

/**
 * Format an ISO timestamp string into Indian localized display format
 */
export function formatDate(isoString, includeTime = false) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Format a delivery date as "Mon, 21 Jul" (weekday, day, short month) in India time.
 */
export function formatDeliveryDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata'
  }).formatToParts(date);
  const part = (type) => parts.find((p) => p.type === type)?.value ?? '';

  return `${part('weekday')}, ${part('day')} ${part('month')}`;
}

/**
 * Format gift points (e.g. "120 pts")
 */
export function formatPoints(points) {
  if (!points || isNaN(Number(points))) return '0 pts';
  return `${Number(points).toLocaleString('en-IN')} pts`;
}
