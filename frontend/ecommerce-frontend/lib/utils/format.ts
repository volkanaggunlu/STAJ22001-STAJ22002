// Price formatting
export function formatPrice(price: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

// Phone number formatting (Turkish format)
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Turkish phone format: +90 XXX XXX XX XX
  if (cleaned.startsWith('90')) {
    const number = cleaned.slice(2)
    if (number.length >= 10) {
      return `+90 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 8)} ${number.slice(8, 10)}`
    }
  } else if (cleaned.length >= 10) {
    return `+90 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
  }
  
  return phone
}

// Date formatting
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }
  
  return new Intl.DateTimeFormat('tr-TR', defaultOptions).format(dateObj)
}

// Relative date formatting (e.g., "2 gün önce")
export function formatRelativeDate(date: string | Date): string {
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  const intervals = [
    { label: 'yıl', seconds: 31536000 },
    { label: 'ay', seconds: 2592000 },
    { label: 'hafta', seconds: 604800 },
    { label: 'gün', seconds: 86400 },
    { label: 'saat', seconds: 3600 },
    { label: 'dakika', seconds: 60 },
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label} önce`
    }
  }
  
  return 'Az önce'
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Number formatting with Turkish locale
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR').format(num)
}

// Percentage formatting
export function formatPercentage(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

// Text truncation with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Slug generation from Turkish text
export function createSlug(text: string): string {
  const turkishChars = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'I': 'i', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  }
  
  return text
    .replace(/[çğıöşüÇĞIİÖŞÜ]/g, (match) => turkishChars[match as keyof typeof turkishChars])
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// SKU generation
export function generateSKU(category: string, brand: string, name: string): string {
  const categoryCode = category.slice(0, 3).toUpperCase()
  const brandCode = brand.slice(0, 3).toUpperCase()
  const nameCode = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
  const timestamp = Date.now().toString().slice(-4)
  
  return `${categoryCode}-${brandCode}-${nameCode}-${timestamp}`
}

// Order number generation
export function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const timestamp = now.getTime().toString().slice(-4)
  
  return `ET${year}${month}${day}${timestamp}`
}

// Color hex validation
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Credit card masking
export function maskCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length < 4) return cardNumber
  
  const visibleDigits = 4
  const maskedSection = '*'.repeat(cleaned.length - visibleDigits)
  const lastDigits = cleaned.slice(-visibleDigits)
  
  return maskedSection + lastDigits
}

// Rating display
export function formatRating(rating: number): string {
  return rating.toFixed(1)
} 