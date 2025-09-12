'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  Star,
  Settings,
  Home,
  LogOut,
  Plus,
  List,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/lib/hooks/useAuth'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Ürün Yönetimi',
    icon: Package,
    defaultOpen: true,
    items: [
      {
        title: 'Ürün Listesi',
        href: '/admin/products',
        icon: List,
      },
      {
        title: 'Yeni Ürün',
        href: '/admin/products/new',
        icon: Plus,
      },
    ],
  },
  {
    title: 'Kategori Yönetimi',
    icon: FolderTree,
    defaultOpen: false,
    items: [
      {
        title: 'Kategori Listesi',
        href: '/admin/categories',
        icon: List,
      },
      {
        title: 'Yeni Kategori',
        href: '/admin/categories/new',
        icon: Plus,
      },
    ],
  },
  {
    title: 'Kullanıcılar',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Siparişler',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Faturalar',
    href: '/admin/invoices',
    icon: List,
  },
  {
    title: 'Yorumlar',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    title: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { mutate: logout } = useLogout()
  const [openMenus, setOpenMenus] = useState<string[]>(
    menuItems.filter(item => item.items && item.defaultOpen).map(item => item.title)
  )

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const isMenuOpen = (title: string) => openMenus.includes(title)

  const isActive = (href: string) => pathname === href
  const isParentActive = (items: any[]) => items.some(item => pathname === item.href)

  return (
    <Sidebar className="border-r bg-background">
      <SidebarHeader className="border-b">
        <div className="px-6 py-4">
          <Link href="/admin" className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-2.5 rounded-lg shadow-sm">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Açık Atölye
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Admin Panel</p>
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {menuItems.map((item) => {
                if (item.items) {
                  const isOpen = isMenuOpen(item.title)
                  const isParentHighlighted = isParentActive(item.items)
                  
                  return (
                    <div key={item.title} className="space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => toggleMenu(item.title)}
                          className={cn(
                            "w-full justify-between hover:bg-accent/50 transition-colors duration-200",
                            "font-medium text-sm py-2.5 px-3",
                            isParentHighlighted && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className={cn(
                              "h-5 w-5",
                              isParentHighlighted ? "text-blue-600" : "text-muted-foreground"
                            )} />
                            <span>{item.title}</span>
                          </div>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      {isOpen && (
                        <div className="ml-4 space-y-1 border-l border-border pl-4">
                          {item.items.map((subItem) => (
                            <SidebarMenuItem key={subItem.href}>
                              <SidebarMenuButton asChild>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    "w-full justify-start hover:bg-accent/50 transition-colors duration-200",
                                    "text-sm py-2 px-3 rounded-md",
                                    isActive(subItem.href) && "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600"
                                  )}
                                >
                                  <subItem.icon className={cn(
                                    "h-4 w-4 mr-3",
                                    isActive(subItem.href) ? "text-blue-600" : "text-muted-foreground"
                                  )} />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "w-full justify-start hover:bg-accent/50 transition-colors duration-200",
                          "font-medium text-sm py-2.5 px-3 rounded-md",
                          isActive(item.href) && "bg-blue-50 text-blue-700 border-l-2 border-blue-600"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 mr-3",
                          isActive(item.href) ? "text-blue-600" : "text-muted-foreground"
                        )} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-muted/30">
        <SidebarMenu className="space-y-1 p-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link 
                href="/" 
                className="w-full justify-start hover:bg-accent/50 transition-colors duration-200 text-sm py-2 px-3 rounded-md"
              >
                <Home className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>Ana Sayfa</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-0 h-auto hover:bg-red-50 hover:text-red-700 transition-colors duration-200 text-sm py-2 px-3 rounded-md"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>Çıkış Yap</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
} 