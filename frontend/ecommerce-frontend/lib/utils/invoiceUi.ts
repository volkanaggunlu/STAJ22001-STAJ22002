export type AnyInvoiceStatus = string | undefined | null

export function getInvoiceStatusLabel(status: AnyInvoiceStatus) {
  const key = String(status || 'pending').toLowerCase()
  if (['approved'].includes(key)) return 'Onaylandı'
  if (['rejected'].includes(key)) return 'Reddedildi'
  if (['sent'].includes(key)) return 'Gönderildi'
  if (['processing'].includes(key)) return 'İşleniyor'
  if (['error', 'failed'].includes(key)) return 'Hata'
  if (['pending', 'bekleniyor'].includes(key)) return 'Bekleniyor'
  return key
}

export function getInvoiceStatusBadgeClass(status: AnyInvoiceStatus) {
  const key = String(status || 'pending').toLowerCase()
  if (['approved'].includes(key)) return 'bg-green-100 text-green-800'
  if (['rejected', 'error', 'failed'].includes(key)) return 'bg-red-100 text-red-800'
  if (['sent', 'processing'].includes(key)) return 'bg-blue-100 text-blue-800'
  if (['pending', 'bekleniyor'].includes(key)) return 'bg-gray-100 text-gray-800'
  return 'bg-gray-100 text-gray-800'
} 