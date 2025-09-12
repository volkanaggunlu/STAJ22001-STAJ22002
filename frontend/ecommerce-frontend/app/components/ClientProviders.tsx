"use client"
import React from "react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import AppInitializer from "./AppInitializer"
import Header from "./Header"
import Footer from "./Footer"
import { CartDrawer } from '@/app/components/CartDrawer'
import { usePathname } from 'next/navigation'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())
  const pathname = usePathname();
  const hideHeaderFooter = pathname === '/coming-soon' || pathname?.startsWith('/admin');
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer />
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
      <CartDrawer />
      <Toaster position="top-right" richColors closeButton duration={4000} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
} 