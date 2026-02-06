export function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatMoney4(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

export function formatDateTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString()
}
