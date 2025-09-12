
import type React from "react"
import { Jura } from "next/font/google"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { toast } from 'sonner'
import "./globals.css"
import ClientProviders from "./components/ClientProviders"

const jura = Jura({ subsets: ["latin"] })

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

export const metadata = {
  title: "Açık Atölye | Elektronik, Maker ve Hobi Atölyesi",
  description: "Açık Atölye; elektronik, robotik, 3D baskı, maker ve hobi alanlarında ilham veren bir atölye, eğitim ve topluluk merkezidir. Yaratıcı projeler ve paylaşım için hemen katıl!",
  keywords: "açık atölye, elektronik, maker, 3d baskı, arduino, raspberry pi, eğitim, hobi, topluluk, bursa",
  icons: {
    icon: "/logos/aa.png",
  },
  openGraph: {
    title: "Açık Atölye",
    description: "Elektronik, maker ve hobi projeleri için atölye, eğitim ve topluluk merkezi.",
    url: "https://acikatolye.com.tr",
    siteName: "Açık Atölye",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Açık Atölye",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Açık Atölye",
    description: "Elektronik, maker ve hobi projeleri için atölye, eğitim ve topluluk merkezi.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Global sepet senkronizasyonu
  return (
    <html lang="tr">
      <body className={jura.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
