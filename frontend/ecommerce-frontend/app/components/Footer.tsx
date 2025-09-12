'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Cpu } from "lucide-react"
import { useEffect, useState } from "react"

export default function Footer() {

const [categories, setCategories] = useState<{id: string | number ; name:string; slug: string}[]>([])
const [loading, setLoading] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {

    const getCategories = async () => {
      setLoading(true)
      setError(null) // Hata durumunu sıfırla
      try{
        const res= await fetch("http://localhost:8080/api/categories?level=0");
        const data = await res.json();

        if(data.success){
          setCategories(data.data.categories || []) // Eğer categories null/undefined ise boş array
        } else{
          setError("API'den kategoriler alınamadı.")
        }

      }catch(err){
        setError("Kategoriler getirilirken bir hata oluştu.")
        console.error(err)
      }finally{
        setLoading(false)
      }

    } 
      getCategories();

  },[])

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <img src="/logos/yatay-beyaz.png" alt="Açık Atölye Logo" width={120} height={40} />
            </Link>
            <p className="text-gray-300 mb-4">
              Açık Atölye; elektronik, hobi ve yaratıcı projeler için atölye, eğitim ve topluluk merkezi.
            </p>
            <div className="flex space-x-4">
              <Button asChild size="sm" variant="ghost" className="text-gray-400 hover:text-[#fed233]">
                <a href="https://www.instagram.com/acik_atolye_hub/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="sm" variant="ghost" className="text-gray-400 hover:text-[#fed233]">
                <a href="https://www.youtube.com/@ackatolye8292" target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="sm" variant="ghost" className="text-gray-400 hover:text-[#fed233]">
                <a href="https://www.facebook.com/atolye.acik/" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Hızlı Linkler</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/hakkimizda" className="text-gray-300 hover:text-white transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="https://mail.google.com/mail/u/0/?fs=1&tf=cm&source=mailto&to=info@acikatolye.com.tr" className="text-gray-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/kargo" className="text-gray-300 hover:text-white transition-colors">
                  Kargo Bilgileri
                </Link>
              </li>
              <li>
                <Link href="/iade" className="text-gray-300 hover:text-white transition-colors">
                  İade & Değişim
                </Link>
              </li>
              <li>
                <Link href="/gizlilik-politikasi" className="text-gray-300 hover:text-white transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/kullanim-sartlari" className="text-gray-300 hover:text-white transition-colors">
                  Kullanım Şartları
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Kategoriler</h3>
            
            {loading && (
              <p className="text-gray-400">Kategoriler yükleniyor...</p>
            )}

            {error && (
              <p className="text-red-400">{error}</p>
            )}

            {!loading && !error && (
              <ul className="space-y-3">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <li key={category.id}>
                      <Link href={`/kategori/${category.slug}`} className="text-gray-300 hover:text-white transition-colors">
                        {category.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400">Henüz kategori bulunmamaktadır.</p>
                )}
              </ul>
            )}
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">İletişim</h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#fed233]" />
                <span className="text-gray-300">0530 607 0166</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#fed233]" />
                <span className="text-gray-300">info@acikatolye.com.tr</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#fed233] mt-1" />
                <span className="text-gray-300">
                  İhsaniye, Fatih Sultan Mehmet Blv. No:38 D D:L,<br />16130 Nilüfer/Bursa
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2025 Açık Atölye. Tüm hakları saklıdır.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="text-gray-400 text-sm">Güvenli Ödeme:</span>
            <div className="flex space-x-2">
              <div className="bg-white text-black px-2 py-1 rounded text-xs font-bold">VISA</div>
              <div className="bg-white text-black px-2 py-1 rounded text-xs font-bold">MC</div>
              <div className="bg-[#fed233] text-black px-2 py-1 rounded text-xs font-bold">AMEX</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}