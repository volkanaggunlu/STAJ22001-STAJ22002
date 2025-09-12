'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useProtectedRoute } from '@/lib/hooks/useAuth'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/app/components/AdminSidebar'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  
  // Protected route hook with admin role requirement
  const { isAuthorized, isLoading } = useProtectedRoute('admin')

  // Show loading spinner while checking auth
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Yetki Kontrol Ediliyor</h3>
            <p className="text-sm text-muted-foreground">
              Lütfen bekleyin, giriş yetkiniz kontrol ediliyor...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unauthorized message if user is not admin
  if (isInitialized && (!isAuthenticated || !isAuthorized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Erişim Reddedildi</h2>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Bu sayfaya erişim için admin yetkisine sahip olmanız gerekmektedir.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                Ana Sayfaya Dön
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Farklı Hesapla Giriş Yap
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render admin panel for authorized users
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Modern Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="container flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-foreground">
                  Admin Panel
                </h1>
                <div className="hidden sm:block">
                  <span className="text-sm text-muted-foreground">
                    Açık Atölye Yönetim Sistemi
                  </span>
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium">{user?.name} {user?.surname}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="container p-6 space-y-6">
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">İçerik yükleniyor...</p>
                  </div>
                </div>
              }>
                {children}
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 