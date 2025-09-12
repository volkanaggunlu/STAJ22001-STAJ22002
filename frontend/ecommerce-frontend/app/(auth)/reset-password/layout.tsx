import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense 
      fallback={
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Yükleniyor</h1>
            <p className="text-gray-600">Şifre sıfırlama sayfası hazırlanıyor...</p>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
} 