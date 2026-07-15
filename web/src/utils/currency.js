const formatCurrency = (amount, iso = 'EUR') => {
    const formatter = new Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: iso,
    });
    const value = amount / 10** formatter.resolvedOptions().maximumFractionDigits;
    return formatter.format(value);
}

const formatDate = (raw) => {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d)) return raw
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getUTCFullYear()}`
}

export { formatCurrency, formatDate }