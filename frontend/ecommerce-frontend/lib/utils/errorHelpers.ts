/**
 * Hata mesajlarını güvenli bir şekilde render etmek için yardımcı fonksiyonlar
 */

/**
 * Hata mesajını string olarak döndürür
 * @param error - Hata objesi veya string
 * @returns Güvenli string hata mesajı
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'Bilinmeyen hata'
  
  if (typeof error === 'string') {
    return error
  }
  
  if (typeof error === 'object') {
    // API response error
    if (error.message) {
      return error.message
    }
    
    // Axios error
    if (error.response?.data?.error) {
      return error.response.data.error
    }
    
    // Generic error object
    if (error.error) {
      return typeof error.error === 'string' ? error.error : 'Bilinmeyen hata'
    }
    
    // Fallback
    return 'Bilinmeyen hata'
  }
  
  return 'Bilinmeyen hata'
}

/**
 * Hata durumunu kontrol eder
 * @param error - Hata objesi
 * @returns Hata var mı boolean değeri
 */
export function hasError(error: any): boolean {
  return !!error
} 