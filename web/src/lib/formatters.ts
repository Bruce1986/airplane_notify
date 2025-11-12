export function formatSeconds(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const rounded = Math.round(Math.max(0, value))
  return `${rounded} 秒`
}
