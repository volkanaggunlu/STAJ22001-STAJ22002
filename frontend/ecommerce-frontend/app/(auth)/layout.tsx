import Link from 'next/link'
import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Giriş Yap | Açık Atölye',
  description: 'Açık Atölye hesabınıza giriş yapın veya yeni hesap oluşturun',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-primary -to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
              <Image
                src="/logos/aa-yatay.png"
                alt="AA"
                width={40}
                height={40}
                className="rounded-lg"
              />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {children}
          </div>
          
          {/* Footer Links */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600 space-x-4">
              <Link 
                href="/hakkimizda" 
                className="hover:text-blue-600 transition-colors"
              >
                Hakkımızda
              </Link>
              <span>•</span>
              <Link 
                href="https://mail.google.com/mail/u/0/?fs=1&tf=cm&source=mailto&to=info@acikatolye.com.tr" 
                className="hover:text-blue-600 transition-colors"
              >
                İletişim
              </Link>
              <span>•</span>
              <Link 
                href="/gizlilik" 
                className="hover:text-blue-600 transition-colors"
              >
                Gizlilik
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 