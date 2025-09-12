"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// NavigationMenu kaldırıldı; alt menüler custom hover dropdown ile gösterilecek
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, ShoppingCart, User, Menu, Heart, Cpu, Wrench, Printer, Gift, Gamepad2, LogOut, Settings, Package, Truck, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useIsAdmin } from '@/lib/hooks/useAuth'
import { useCart } from '@/lib/store/cartStore'
import Image from 'next/image'
import { categoriesApi } from '@/lib/api/services/categories'
import type { Category } from '@/lib/api/types'

export default function Header() {
  const [categories,setCategories] = useState<Category[]>([]);

    const iconMap: Record<string, React.ReactNode> = {
    "elektronik": <Cpu className="h-4 w-4 mr-2" />,
    "kitler": <Wrench className="h-4 w-4 mr-2" />,
    "hobi": <Gamepad2 className="h-4 w-4 mr-2" />,
    "3d-baski": <Printer className="h-4 w-4 mr-2" />,
    "hediye": <Gift className="h-4 w-4 mr-2" />,
  };
  const { user, isAuthenticated, logout, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const { totalItems, openCart } = useCart()

  const handleLogin = () => {
    router.push('/login')
  }

  const handleLogout = () => {
    console.log('🔐 Logout initiated from Header')
    logout()
  }

  const handleProfile = () => {
    router.push('/hesabim')
  }

  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await categoriesApi.getCategoryTree()
        if (res.success) {
          setCategories(res.data.categories || [])
        }
      } catch (err) {
        console.error("Kategori ağacı getirilirken bir hata oluştu", err)
      }
    }
    getCategories()
  }, [])

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="p-2 rounded-lg">
              <Image src="/logos/yatay-logo.png" alt="Açık Atölye Logo" width={170} height={60} priority />
            </div>
            
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-3xl mx-4">
            <div className="relative w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const input = (e.currentTarget.querySelector('input[name="header-search"]') as HTMLInputElement | null)
                  const q = input?.value?.trim()
                  if (q) {
                    const url = `/urunler?page=1&limit=24&sort=newest&search=${encodeURIComponent(q)}&q=${encodeURIComponent(q)}`
                    window.location.href = url
                  }
                }}
              >
                <Input name="header-search" type="search" placeholder="Ürün, marka veya kategori ara..." className="pl-4 pr-12 py-3" />
                <Button type="submit" size="sm" className="absolute right-1 top-1 bottom-1">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {isInitialized && isAuthenticated && (
              <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                <Link href="/favorilerim">
                  <Heart className="h-5 w-5 mr-2" />
                  Favoriler
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
              <Link href="/kargo-takip">
                <Truck className="h-5 w-5 mr-2" />
                Kargo Takip
              </Link>
            </Button>

            {/* Admin Panel Button - Only for admins */}
            {isInitialized && isAuthenticated && isAdmin && (
              <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                <Link href="/admin">
                  <Settings className="h-5 w-5 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            )}

            {/* Authentication Section */}
            {isInitialized && (
              isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                      <User className="h-5 w-5 mr-2" />
                      {user?.name || 'Hesabım'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name} {user?.surname}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile}>
                      <User className="mr-2 h-4 w-4" />
                      Hesabım
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/siparislerim">
                        <Package className="mr-2 h-4 w-4" />
                        Siparişlerim
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleLogin}>
                    <User className="h-5 w-5 mr-2" />
                    Giriş Yap
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">
                      Kayıt Ol
                    </Link>
                  </Button>
                </div>
              )
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalItems}
                </Badge>
              )}
              <span className="sr-only">Sepet</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const input = (e.currentTarget.querySelector('input[name="header-search-mobile"]') as HTMLInputElement | null)
                      const q = input?.value?.trim()
                      if (q) {
                        const url = `/urunler?page=1&limit=24&sort=newest&search=${encodeURIComponent(q)}&q=${encodeURIComponent(q)}`
                        window.location.href = url
                      }
                    }}
                  >
                    <Input name="header-search-mobile" placeholder="Ürün ara..." />
                  </form>
                  
                  {/* Mobile Auth Section */}
                  {isInitialized && (
                    isAuthenticated ? (
                      <div className="border-b pb-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user?.name} {user?.surname}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleProfile}>
                            <User className="mr-2 h-4 w-4" />
                            Hesabım
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                            <Link href="/siparislerim">
                              <Package className="mr-2 h-4 w-4" />
                              Siparişlerim
                            </Link>
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                              <Link href="/admin">
                                <Settings className="mr-2 h-4 w-4" />
                                Admin Panel
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Çıkış Yap
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-b pb-4 space-y-2">
                        <Button className="w-full" onClick={handleLogin}>
                          Giriş Yap
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/register">
                            Kayıt Ol
                          </Link>
                        </Button>
                      </div>
                    )
                  )}

                  <Link
                    href="/kategori/elektronik"
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
                  >
                    <Cpu className="h-5 w-5" />
                    <span>Elektronik Komponentler</span>
                  </Link>
                  
                  {/* Kargo Takip */}
                  <Link href="/kargo-takip" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                    <Truck className="h-5 w-5" />
                    <span>Kargo Takip</span>
                  </Link>
                  
                  <Link href="/kategori/kitler" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                    <Wrench className="h-5 w-5" />
                    <span>Geliştirme Kitleri</span>
                  </Link>
                  <Link href="/kategori/hobi" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                    <Gamepad2 className="h-5 w-5" />
                    <span>Hobi Malzemeleri</span>
                  </Link>
                  <Link href="/kategori/3d-baski" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                    <Printer className="h-5 w-5" />
                    <span>3D Baskı</span>
                  </Link>
                  <Link href="/kategori/hediye" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                    <Gift className="h-5 w-5" />
                    <span>Hediyelik Ürünler</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="relative z-50 flex items-center gap-2 py-1">
            {categories.map((parentCategory) => (
              <div key={parentCategory.id} className="group relative">
                <Link 
                  href={`/kategori/${parentCategory.slug}`}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground"
                >
                  {parentCategory.name}
                  <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                </Link>
                {(parentCategory.children?.length ?? 0) > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-48 rounded-md border bg-white text-gray-900 shadow-lg opacity-0 pointer-events-none translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0">
                    <ul className="p-2">
                      {(parentCategory.children ?? []).map((child: any) => (
                        <li key={child.id}>
                          <Link
                            href={`/kategori/${parentCategory.slug}/${child.slug}`}
                            className="block rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <div className="text-sm font-medium">{child.name}</div>
                            {child.description && (
                              <p className="text-xs text-muted-foreground">{child.description}</p>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}