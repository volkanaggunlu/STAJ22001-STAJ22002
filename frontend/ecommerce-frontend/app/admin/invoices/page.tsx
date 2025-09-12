'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Download, RefreshCw, Search, MoreHorizontal, Eye, Edit } from 'lucide-react'
import { useInvoicesAdminList, useAdminSendInvoiceEmail, useAdminManualInvoice } from '@/lib/hooks/useInvoices'
import invoicesApi from '@/lib/api/services/invoices'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/services/admin'

export default function AdminInvoicesPage() {
  const [channel, setChannel] = useState<'einvoice'|'earchive'|undefined>()
  const [status, setStatus] = useState<string|undefined>()
  const [from, setFrom] = useState<string|undefined>()
  const [to, setTo] = useState<string|undefined>()
  const router = useRouter()

  const { data, isLoading } = useInvoicesAdminList({ status, from, to, page: 1, limit: 20 })
  const items = data?.data?.items || []

  function StatusBadge({ value }: { value?: string }) {
    const cls = value === 'approved' ? 'bg-green-100 text-green-800' :
      value === 'rejected' ? 'bg-red-100 text-red-800' :
      value === 'sent' || value === 'processing' ? 'bg-blue-100 text-blue-800' :
      value === 'failed' || value === 'error' ? 'bg-red-100 text-red-800' :
      'bg-gray-100 text-gray-800'
    return <Badge className={cls}>{value || 'bilinmiyor'}</Badge>
  }

  async function handleDownload(orderId: string) {
    const blob = await invoicesApi.downloadPdf(orderId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${orderId}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function RowActions({ orderId }: { orderId: string }) {
    const { mutate: updateInvoice, isPending: isUpdating } = useAdminManualInvoice(orderId)
    const [statusOpen, setStatusOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [newStatus, setNewStatus] = useState<string | undefined>()

    const { data: detailResp } = useQuery({
      queryKey: ['invoice', 'detail', orderId],
      queryFn: () => invoicesApi.get(orderId),
      enabled: viewOpen || editOpen,
    })
    const invoice = detailResp?.data

    // Edit form state (tüm alanlar)
    // Seller
    const [sellerName, setSellerName] = useState('')
    const [sellerTaxOffice, setSellerTaxOffice] = useState('')
    const [sellerVkn, setSellerVkn] = useState('')
    // seller.tckn backend tarafından kaldırıldı
    const [sellerMersis, setSellerMersis] = useState('')
    const [sellerAddress, setSellerAddress] = useState('')
    const [sellerCity, setSellerCity] = useState('')
    const [sellerDistrict, setSellerDistrict] = useState('')
    const [sellerPostalCode, setSellerPostalCode] = useState('')
    const [sellerPhone, setSellerPhone] = useState('')
    const [sellerEmail, setSellerEmail] = useState('')
    const [sellerBankName, setSellerBankName] = useState('')
    const [sellerIban, setSellerIban] = useState('')

    // Buyer
    const [buyerFirstName, setBuyerFirstName] = useState('')
    const [buyerLastName, setBuyerLastName] = useState('')
    const [buyerCompanyName, setBuyerCompanyName] = useState('')
    const [buyerTckn, setBuyerTckn] = useState('')
    const [buyerTaxNumber, setBuyerTaxNumber] = useState('')
    const [buyerTaxOffice, setBuyerTaxOffice] = useState('')
    const [buyerEmail, setBuyerEmail] = useState('')
    const [buyerPhone, setBuyerPhone] = useState('')
    const [buyerAddress, setBuyerAddress] = useState('')
    const [buyerCity, setBuyerCity] = useState('')
    const [buyerDistrict, setBuyerDistrict] = useState('')
    const [buyerPostalCode, setBuyerPostalCode] = useState('')

    // Meta
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [invoiceDate, setInvoiceDate] = useState('')
    const [currency, setCurrency] = useState('')
    const [orderNumber, setOrderNumber] = useState('')
    const [orderDate, setOrderDate] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    // dueDate/payRef kaldırıldı
    const [paymentDate, setPaymentDate] = useState('')
    // dueDate kaldırıldı
    const [metaNotes, setMetaNotes] = useState('')

    // Totals
    const [subtotal, setSubtotal] = useState('')
    const [discountsTotal, setDiscountsTotal] = useState('')
    const [shippingCost, setShippingCost] = useState('')
    const [taxTotal, setTaxTotal] = useState('')
    const [grandTotal, setGrandTotal] = useState('')

    // Shipping
    const [shippingAddress, setShippingAddress] = useState('')
    const [shippingCity, setShippingCity] = useState('')
    const [shippingDistrict, setShippingDistrict] = useState('')
    const [shippingPostalCode, setShippingPostalCode] = useState('')
    const [shippingCarrier, setShippingCarrier] = useState('')
    const [shippingTrackingNumber, setShippingTrackingNumber] = useState('')
    const [shippingDeliveredAt, setShippingDeliveredAt] = useState('')

    // Attachments / notes
    const [pdfPath, setPdfPath] = useState('')
    const [manualNotes, setManualNotes] = useState('')
    const [isUploadingPdf, setIsUploadingPdf] = useState(false)
    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.type !== 'application/pdf') {
          toast.error('Lütfen PDF dosyası seçin')
          return
        }
        setIsUploadingPdf(true)
        const result = await adminApi.uploadInvoicePdf(file, orderId)
        // Backend bu endpointten { url } ya da path dönebilir; olası alanları kontrol edelim
        const url = (result?.url || result?.path || result?.pdfPath || result) as string
        if (!url || typeof url !== 'string') throw new Error('Geçersiz yanıt')
        setPdfPath(url)
        toast.success('PDF yüklendi')
      } catch (err: any) {
        console.error('PDF upload hatası', err)
        toast.error('PDF yüklenemedi')
      } finally {
        setIsUploadingPdf(false)
        e.target.value = ''
      }
    }

    // Buyer type (responsive form behavior)
    const [buyerType, setBuyerType] = useState<'bireysel' | 'kurumsal'>('bireysel')

    useEffect(() => {
      if (invoice && editOpen) {
        // Seller
        setSellerName(invoice.seller?.name || '')
        setSellerTaxOffice(invoice.seller?.taxOffice || '')
        setSellerVkn(invoice.seller?.vkn || '')
        // seller.tckn kaldırıldı
        setSellerMersis(invoice.seller?.mersis || '')
        setSellerAddress(invoice.seller?.address || '')
        setSellerCity(invoice.seller?.city || '')
        setSellerDistrict(invoice.seller?.district || '')
        setSellerPostalCode(invoice.seller?.postalCode || '')
        setSellerPhone(invoice.seller?.phone || '')
        setSellerEmail(invoice.seller?.email || '')
        setSellerBankName(invoice.seller?.bankName || '')
        setSellerIban(invoice.seller?.iban || '')
        // Buyer
        setBuyerFirstName(invoice.buyer?.firstName || '')
        setBuyerLastName(invoice.buyer?.lastName || '')
        setBuyerCompanyName(invoice.buyer?.companyName || '')
        setBuyerTckn(invoice.buyer?.tckn || '')
        setBuyerTaxNumber(invoice.buyer?.taxNumber || '')
        setBuyerTaxOffice(invoice.buyer?.taxOffice || '')
        setBuyerEmail(invoice.buyer?.email || '')
        setBuyerPhone(invoice.buyer?.phone || '')
        setBuyerAddress(invoice.buyer?.address || '')
        setBuyerCity(invoice.buyer?.city || '')
        setBuyerDistrict(invoice.buyer?.district || '')
        setBuyerPostalCode(invoice.buyer?.postalCode || '')
        // Infer buyer type
        const inferredCompany = Boolean(invoice.buyer?.companyName || invoice.buyer?.taxNumber || invoice.buyer?.taxOffice)
        setBuyerType(inferredCompany ? 'kurumsal' : 'bireysel')
        // Meta
        setInvoiceNumber(invoice.meta?.invoiceNumber || '')
        setInvoiceDate(invoice.meta?.invoiceDate ? new Date(invoice.meta.invoiceDate).toISOString().slice(0,10) : '')
        setCurrency(invoice.meta?.currency || '')
        setOrderNumber(invoice.meta?.orderNumber || '')
        setOrderDate(invoice.meta?.orderDate ? new Date(invoice.meta.orderDate).toISOString().slice(0,10) : '')
        setPaymentMethod(invoice.meta?.paymentMethod || '')
        // dueDate kaldırıldı
        setPaymentDate(invoice.meta?.paymentDate ? new Date(invoice.meta.paymentDate).toISOString().slice(0,10) : '')
        // dueDate kaldırıldı
        setMetaNotes(invoice.meta?.notes || '')
        // Totals
        setSubtotal(invoice.totals?.subtotal?.toString() || '')
        setDiscountsTotal(invoice.totals?.discountsTotal?.toString() || '')
        setShippingCost(invoice.totals?.shippingCost?.toString() || '')
        setTaxTotal(invoice.totals?.taxTotal?.toString() || '')
        setGrandTotal(invoice.totals?.grandTotal?.toString() || '')
        // Shipping
        setShippingAddress(invoice.shipping?.address || '')
        setShippingCity(invoice.shipping?.city || '')
        setShippingDistrict(invoice.shipping?.district || '')
        setShippingPostalCode(invoice.shipping?.postalCode || '')
        setShippingCarrier(invoice.shipping?.carrier || '')
        setShippingTrackingNumber(invoice.shipping?.trackingNumber || '')
        setShippingDeliveredAt(invoice.shipping?.deliveredAt ? new Date(invoice.shipping.deliveredAt).toISOString().slice(0,10) : '')
        // Attachments / notes
        setPdfPath(invoice.pdfPath || '')
        setManualNotes(invoice.manualNotes || '')
        // Status
        setNewStatus(invoice.status)
      }
    }, [invoice, editOpen])

    const saveEdit = () => {
      const payload: any = {
        status: newStatus,
        // Parties
        seller: {
          name: sellerName || undefined,
          taxOffice: sellerTaxOffice || undefined,
          vkn: sellerVkn || undefined,
          // tckn gönderilmeyecek
          mersis: sellerMersis || undefined,
          address: sellerAddress || undefined,
          city: sellerCity || undefined,
          district: sellerDistrict || undefined,
          postalCode: sellerPostalCode || undefined,
          phone: sellerPhone || undefined,
          email: sellerEmail || undefined,
          bankName: sellerBankName || undefined,
          iban: sellerIban || undefined,
        },
        buyer: buyerType === 'kurumsal'
          ? {
              companyName: buyerCompanyName || undefined,
              taxNumber: buyerTaxNumber || undefined,
              taxOffice: buyerTaxOffice || undefined,
              // bireysel alanları bilinçli şekilde temizle
              firstName: undefined,
              lastName: undefined,
              tckn: undefined,
              // ortak alanlar
              email: buyerEmail || undefined,
              phone: buyerPhone || undefined,
              address: buyerAddress || undefined,
              city: buyerCity || undefined,
              district: buyerDistrict || undefined,
              postalCode: buyerPostalCode || undefined,
            }
          : {
              firstName: buyerFirstName || undefined,
              lastName: buyerLastName || undefined,
              tckn: buyerTckn || undefined,
              // kurumsal alanları bilinçli şekilde temizle
              companyName: undefined,
              taxNumber: undefined,
              taxOffice: undefined,
              // ortak alanlar
              email: buyerEmail || undefined,
              phone: buyerPhone || undefined,
              address: buyerAddress || undefined,
              city: buyerCity || undefined,
              district: buyerDistrict || undefined,
              postalCode: buyerPostalCode || undefined,
            },
        // Meta
        meta: {
          invoiceNumber: invoiceNumber || undefined,
          invoiceDate: invoiceDate || undefined,
          currency: currency || undefined,
          orderNumber: orderNumber || undefined,
          orderDate: orderDate || undefined,
          paymentMethod: paymentMethod || undefined,
          paymentDate: paymentDate || undefined,
          notes: metaNotes || undefined,
        },
        // Totals
        totals: {
          subtotal: subtotal ? Number(subtotal) : undefined,
          discountsTotal: discountsTotal ? Number(discountsTotal) : undefined,
          shippingCost: shippingCost ? Number(shippingCost) : undefined,
          taxTotal: taxTotal ? Number(taxTotal) : undefined,
          grandTotal: grandTotal ? Number(grandTotal) : undefined,
        },
        // Shipping
        shipping: {
          address: shippingAddress || undefined,
          city: shippingCity || undefined,
          district: shippingDistrict || undefined,
          postalCode: shippingPostalCode || undefined,
          carrier: shippingCarrier || undefined,
          trackingNumber: shippingTrackingNumber || undefined,
          deliveredAt: shippingDeliveredAt || undefined,
        },
        // Attachments / notes
        pdfPath: pdfPath || undefined,
        manualNotes: manualNotes || undefined,
      }
      updateInvoice(payload, {
        onSuccess: () => {
          toast.success('Fatura güncellendi')
          setEditOpen(false)
        },
        onError: () => toast.error('Fatura güncellenemedi'),
      })
    }

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusOpen(true)}>Durumu Değiştir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewOpen(true)}>
              <Eye className="h-4 w-4 mr-2" /> Görüntüle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" /> Düzenle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Durum Değiştir */}
        <AlertDialog open={statusOpen} onOpenChange={setStatusOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fatura Durumunu Değiştir</AlertDialogTitle>
              <AlertDialogDescription>Yeni durumu seçin ve kaydedin.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Bekleniyor</SelectItem>
                  <SelectItem value="sent">Gönderildi</SelectItem>
                  <SelectItem value="processing">İşleniyor</SelectItem>
                  <SelectItem value="approved">Onaylandı</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                  <SelectItem value="error">Hata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction
                disabled={!newStatus || isUpdating}
                onClick={() => {
                  if (!newStatus) return
                  updateInvoice(
                    { status: newStatus as any },
                    {
                      onSuccess: () => {
                        toast.success('Durum güncellendi')
                        setStatusOpen(false)
                      },
                      onError: () => toast.error('Durum güncellenemedi'),
                    }
                  )
                }}
              >
                Kaydet
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Görüntüle Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Fatura Bilgileri</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>OrderID:</strong> {orderId}</p>
                <p><strong>Durum:</strong> {invoice?.status}</p>
                <p><strong>Toplam:</strong> ₺{invoice?.totals?.grandTotal?.toFixed?.(2) || invoice?.totals?.grandTotal}</p>
                <p><strong>İndirim:</strong> ₺{invoice?.totals?.discountsTotal?.toFixed?.(2) || invoice?.totals?.discountsTotal}</p>
              </div>
              <div>
                <p><strong>Müşteri:</strong> {invoice?.buyer?.companyName || `${invoice?.buyer?.firstName || ''} ${invoice?.buyer?.lastName || ''}`}</p>
                <p><strong>Fatura No:</strong> {invoice?.meta?.invoiceNumber || '-'}</p>
                <p><strong>Fatura Tarihi:</strong> {invoice?.meta?.invoiceDate ? new Date(invoice.meta.invoiceDate).toLocaleDateString('tr-TR') : '-'}</p>
                {(() => {
                  const buyer = invoice?.buyer as any
                  const isCompany = Boolean(buyer?.companyName || buyer?.taxNumber || buyer?.taxOffice)
                  if (isCompany) {
                    return (
                      <>
                        <p><strong>Şirket:</strong> {buyer?.companyName || '-'}</p>
                        <p><strong>Vergi No:</strong> {buyer?.taxNumber || '-'}</p>
                        <p><strong>Vergi Dairesi:</strong> {buyer?.taxOffice || '-'}</p>
                      </>
                    )
                  }
                  return (
                    <>
                      <p><strong>Ad Soyad:</strong> {(buyer?.firstName || '-') + ' ' + (buyer?.lastName || '')}</p>
                      <p><strong>TCKN:</strong> {buyer?.tckn || '-'}</p>
                    </>
                  )
                })()}
              </div>
              <div className="md:col-span-2">
                <p className="font-semibold mb-1">Kalemler</p>
                <div className="max-h-48 overflow-auto border rounded p-2">
                  {(invoice?.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span>{it.name} x{it.quantity}</span>
                      <span>₺{(it.totalInclTax ?? (it.unitPrice * it.quantity))?.toFixed?.(2) || (it.totalInclTax ?? (it.unitPrice * it.quantity))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOpen(false)}>Kapat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Düzenle Modal (genişletilmiş form) */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="w-full max-w-[95vw] md:max-w-5xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fatura Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Status & Meta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Durum</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="sent">sent</SelectItem>
                      <SelectItem value="processing">processing</SelectItem>
                      <SelectItem value="approved">approved</SelectItem>
                      <SelectItem value="rejected">rejected</SelectItem>
                      <SelectItem value="error">error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Fatura No</label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Fatura Tarihi</label>
                  <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Para Birimi</label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Sipariş No</label>
                  <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Sipariş Tarihi</label>
                  <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Ödeme Yöntemi</label>
                  <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Ödeme Tarihi</label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs text-gray-600">Meta Notları</label>
                  <Textarea value={metaNotes} onChange={(e) => setMetaNotes(e.target.value)} />
                </div>
              </div>

              {/* Seller */}
              <div>
                <p className="text-sm font-semibold mb-2">Satıcı</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Ad</label>
                    <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Vergi Dairesi</label>
                    <Input value={sellerTaxOffice} onChange={(e) => setSellerTaxOffice(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">VKN</label>
                    <Input value={sellerVkn} onChange={(e) => setSellerVkn(e.target.value)} />
                  </div>
                  {/* seller.tckn kaldırıldı */}
                  <div>
                    <label className="text-xs text-gray-600">MERSİS</label>
                    <Input value={sellerMersis} onChange={(e) => setSellerMersis(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Adres</label>
                    <Input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">İl</label>
                    <Input value={sellerCity} onChange={(e) => setSellerCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">İlçe</label>
                    <Input value={sellerDistrict} onChange={(e) => setSellerDistrict(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Posta Kodu</label>
                    <Input value={sellerPostalCode} onChange={(e) => setSellerPostalCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Telefon</label>
                    <Input value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Email</label>
                    <Input value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Banka</label>
                    <Input value={sellerBankName} onChange={(e) => setSellerBankName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">IBAN</label>
                    <Input value={sellerIban} onChange={(e) => setSellerIban(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Buyer */}
              <div>
                <p className="text-sm font-semibold mb-2">Alıcı</p>
                <div className="mb-3">
                  <label className="text-xs text-gray-600">Müşteri Tipi</label>
                  <Select value={buyerType} onValueChange={(v) => setBuyerType(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri Tipi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bireysel">Bireysel</SelectItem>
                      <SelectItem value="kurumsal">Kurumsal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {buyerType === 'kurumsal' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Şirket</label>
                      <Input value={buyerCompanyName} onChange={(e) => setBuyerCompanyName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Vergi No</label>
                      <Input value={buyerTaxNumber} onChange={(e) => setBuyerTaxNumber(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Vergi Dairesi</label>
                      <Input value={buyerTaxOffice} onChange={(e) => setBuyerTaxOffice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Email</label>
                      <Input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Telefon</label>
                      <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Adres</label>
                      <Input value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">İl</label>
                      <Input value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">İlçe</label>
                      <Input value={buyerDistrict} onChange={(e) => setBuyerDistrict(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Posta Kodu</label>
                      <Input value={buyerPostalCode} onChange={(e) => setBuyerPostalCode(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Ad</label>
                      <Input value={buyerFirstName} onChange={(e) => setBuyerFirstName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Soyad</label>
                      <Input value={buyerLastName} onChange={(e) => setBuyerLastName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">TCKN</label>
                      <Input value={buyerTckn} onChange={(e) => setBuyerTckn(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Email</label>
                      <Input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Telefon</label>
                      <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Adres</label>
                      <Input value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">İl</label>
                      <Input value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">İlçe</label>
                      <Input value={buyerDistrict} onChange={(e) => setBuyerDistrict(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Posta Kodu</label>
                      <Input value={buyerPostalCode} onChange={(e) => setBuyerPostalCode(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div>
                <p className="text-sm font-semibold mb-2">Toplamlar</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Ara Toplam</label>
                    <Input inputMode="decimal" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">İndirim</label>
                    <Input inputMode="decimal" value={discountsTotal} onChange={(e) => setDiscountsTotal(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Kargo</label>
                    <Input inputMode="decimal" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Vergi</label>
                    <Input inputMode="decimal" value={taxTotal} onChange={(e) => setTaxTotal(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Genel Toplam</label>
                    <Input inputMode="decimal" value={grandTotal} onChange={(e) => setGrandTotal(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <p className="text-sm font-semibold mb-2">Kargo / Teslimat</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Adres</label>
                    <Input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">İl</label>
                    <Input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">İlçe</label>
                    <Input value={shippingDistrict} onChange={(e) => setShippingDistrict(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Posta Kodu</label>
                    <Input value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Kargo Firması</label>
                    <Input value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Takip No</label>
                    <Input value={shippingTrackingNumber} onChange={(e) => setShippingTrackingNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Teslim Tarihi</label>
                    <Input type="date" value={shippingDeliveredAt} onChange={(e) => setShippingDeliveredAt(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Ekler / Notlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">PDF Yolu (pdfPath)</label>
                  <Input value={pdfPath} onChange={(e) => setPdfPath(e.target.value)} />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                    />
                    <Button variant="secondary" type="button" disabled>{isUploadingPdf ? 'Yükleniyor...' : 'PDF Yükle'}</Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Notlar</label>
                  <Textarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Vazgeç</Button>
              <Button onClick={saveEdit} disabled={isUpdating}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Faturalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Kanal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einvoice">e-Fatura</SelectItem>
                <SelectItem value="earchive">e-Arşiv</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sent">Gönderildi</SelectItem>
                <SelectItem value="processing">İşleniyor</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
                <SelectItem value="error">Hata</SelectItem>
                <SelectItem value="pending">Bekleniyor</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={from || ''} onChange={(e) => setFrom(e.target.value || undefined)} />
            <Input type="date" value={to || ''} onChange={(e) => setTo(e.target.value || undefined)} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Fatura No</th>
                  <th className="py-2 pr-4">Sipariş</th>
                  <th className="py-2 pr-4">Müşteri</th>
                  <th className="py-2 pr-4">Fatura Tarihi</th>
                  <th className="py-2 pr-4">Toplam</th>
                  <th className="py-2 pr-4">Durum</th>
                  <th className="py-2 pr-4 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="py-4" colSpan={7}>Yükleniyor...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="py-4" colSpan={7}>Kayıt bulunamadı</td></tr>
                ) : (
                  items.map((inv: any) => (
                    <tr key={inv.orderId} className="border-t">
                      <td className="py-2 pr-4">{inv?.meta?.invoiceNumber || '-'}</td>
                      <td className="py-2 pr-4 font-mono">{inv?.orderId}</td>
                      <td className="py-2 pr-4">{inv?.buyer?.companyName || `${inv?.buyer?.firstName || ''} ${inv?.buyer?.lastName || ''}` || '-'}</td>
                      <td className="py-2 pr-4">{inv?.meta?.invoiceDate ? new Date(inv.meta.invoiceDate).toLocaleDateString('tr-TR') : '-'}</td>
                      <td className="py-2 pr-4">{inv?.totals?.grandTotal != null ? `₺${(inv.totals.grandTotal?.toFixed?.(2) || inv.totals.grandTotal)}` : '-'}</td>
                      <td className="py-2 pr-4"><StatusBadge value={inv.status} /></td>
                      <td className="py-2 pr-4 text-right"><RowActions orderId={inv.orderId} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 