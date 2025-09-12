"use client"

import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Eye } from 'lucide-react'
import { useInvoice } from '@/lib/hooks/useInvoices'
import { getInvoiceStatusBadgeClass, getInvoiceStatusLabel } from '@/lib/utils/invoiceUi'
import { toast } from 'sonner'
import { useOrderDetail } from '@/hooks/useOrderDetail'
import invoicesApi from '@/lib/api/services/invoices'

export default function InvoiceDetailPage() {
	const params = useParams<{ orderId: string }>()
	const orderId = params?.orderId

	const { data, isLoading, isError } = useInvoice(orderId || '', { refetchIntervalMs: 10000 })
	const status = data?.data?.status
	const totalAmount = (data as any)?.data?.totals?.grandTotal as number | undefined
	const customerName = (data as any)?.data?.buyer?.companyName || `${(data as any)?.data?.buyer?.firstName || ''} ${(data as any)?.data?.buyer?.lastName || ''}`
	const createdAt = (data as any)?.data?.createdAt as string | undefined
	const updatedAt = (data as any)?.data?.updatedAt as string | undefined
	const vatDetails = ((data as any)?.data?.vatDetails as any[] | undefined)
	const invoiceTotals = (data as any)?.data?.totals as any | undefined

	const { order, loading: orderLoading, error: orderError } = useOrderDetail(orderId || '')

	const isReady = ['sent', 'approved'].includes(String(status || '').toLowerCase())

	const downloadBlob = (blob: Blob, filename: string) => {
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		document.body.appendChild(a)
		a.click()
		a.remove()
		URL.revokeObjectURL(url)
	}

	// Hesaplamalar: sipariş verisi ve invoice.totals üzerinden
	const computedSubtotal = Number(
		(order as any)?.subtotal ?? (order as any)?.subTotal ?? (order as any)?.totalBeforeDiscount ?? (order as any)?.totalAmount ?? (order as any)?.total ?? 0
	)
	const computedShipping = Number(
		(order as any)?.shippingCost ?? (order as any)?.shipping ?? 0
	)
	const orderDiscountAmount = Number(
		(order as any)?.discountAmount ?? (order as any)?.discount ?? 0
	)
	const orderCouponDiscount = Number((order as any)?.couponDiscount ?? 0)
	const orderCampaignDiscount = Number((order as any)?.campaignDiscount ?? 0)
	const computedDiscount = Number(
		invoiceTotals?.discountsTotal ?? (orderDiscountAmount || (orderCouponDiscount + orderCampaignDiscount))
	)
	const computedGrandTotal = Number(
		invoiceTotals?.grandTotal ?? (order as any)?.totalAmount ?? (order as any)?.total ?? (computedSubtotal + computedShipping - computedDiscount)
	)
	const discountValue = Number(invoiceTotals?.discountsTotal ?? computedDiscount)
	const grandTotalValue = Number(invoiceTotals?.grandTotal ?? computedGrandTotal)

	const view = async () => {
		if (!isReady) return
		try {
			const blob = await invoicesApi.downloadPdf(orderId || '')
			const url = URL.createObjectURL(blob)
			window.open(url, '_blank')
		} catch (e) {
			toast.error('Fatura dosyasına erişilemedi')
		}
	}

	const download = async () => {
		if (!isReady) return
		try {
			const blob = await invoicesApi.downloadPdf(orderId || '')
			downloadBlob(blob, `fatura-${orderId}.pdf`)
		} catch (e) {
			toast.error('Fatura dosyasına erişilemedi')
		}
	}

	if (!orderId) {
		return <div className="p-6">Geçersiz sipariş</div>
	}

	if (isLoading) {
		return <div className="p-6">Yükleniyor...</div>
	}

	if (isError) {
		return <div className="p-6 text-red-600">Fatura bilgisi alınamadı</div>
	}

	return (
		<div className="container mx-auto px-4 py-8 space-y-6">
			<Card>
				<CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div className="space-y-1">
						<CardTitle>Fatura Detayı</CardTitle>
						<div className="text-sm text-gray-500">Sipariş ID: {orderId}</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge className={getInvoiceStatusBadgeClass(status)}>{getInvoiceStatusLabel(status)}</Badge>
						<Button size="sm" variant="outline" onClick={view} disabled={!isReady}>
							<Eye className="h-4 w-4 mr-2" /> Görüntüle
						</Button>
						<Button size="sm" onClick={download} disabled={!isReady}>
							<Download className="h-4 w-4 mr-2" /> İndir
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<div>Durum: <strong>{getInvoiceStatusLabel(status)}</strong></div>
					{typeof totalAmount === 'number' && <div>Fatura Toplamı: <strong>₺{Number(totalAmount).toFixed(2)}</strong></div>}
					{customerName && <div>Müşteri: <strong>{customerName}</strong></div>}
					{createdAt && <div>Oluşturulma: <strong>{new Date(createdAt).toLocaleString('tr-TR')}</strong></div>}
					{updatedAt && <div>Güncellenme: <strong>{new Date(updatedAt).toLocaleString('tr-TR')}</strong></div>}
				</CardContent>
			</Card>

			{/* Sipariş Özeti */}
			<Card>
				<CardHeader>
					<CardTitle>Sipariş Özeti</CardTitle>
				</CardHeader>
				<CardContent className="text-sm space-y-2">
					{orderLoading && <div>Yükleniyor...</div>}
					{orderError && <div className="text-red-600">Sipariş bilgisi alınamadı</div>}
					{order && (
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<div>Sipariş No: <strong>{(order as any).orderNumber || (order as any)._id}</strong></div>
								<div>Ödeme Yöntemi: <strong>{(order as any).paymentMethod || '-'}</strong></div>
								<div>Ödeme Durumu: <strong>{(order as any).paymentStatus || '-'}</strong></div>
								<div>Sipariş Tarihi: <strong>{(order as any).createdAt ? new Date((order as any).createdAt).toLocaleString('tr-TR') : '-'}</strong></div>
							</div>
							<div>
								<div>Ara Toplam: <strong>₺{computedSubtotal.toFixed(2)}</strong></div>
								<div>Kargo: <strong>{computedShipping ? `₺${computedShipping.toFixed(2)}` : '₺0.00'}</strong></div>
								<div>İndirim: <strong>{discountValue ? `₺${discountValue.toFixed(2)}` : '₺0.00'}</strong></div>
								<div>Toplam: <strong>₺{grandTotalValue.toFixed(2)}</strong></div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Adresler */}
			{order && (
				<div className="grid md:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Teslimat Adresi</CardTitle>
						</CardHeader>
						<CardContent className="text-sm space-y-1">
							<div>{(order as any).shippingAddress?.firstName} {(order as any).shippingAddress?.lastName}</div>
							<div>{(order as any).shippingAddress?.address}</div>
							<div>{(order as any).shippingAddress?.district}, {(order as any).shippingAddress?.city} {(order as any).shippingAddress?.postalCode}</div>
							<div>{(order as any).shippingAddress?.phone}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Fatura Adresi</CardTitle>
						</CardHeader>
						<CardContent className="text-sm space-y-1">
							<div>{(order as any).invoiceAddress?.firstName} {(order as any).invoiceAddress?.lastName}</div>
							<div>{(order as any).invoiceAddress?.companyName ? `Şirket: ${(order as any).invoiceAddress?.companyName}` : ''}</div>
							<div>{(order as any).invoiceAddress?.taxNumber ? `Vergi No: ${(order as any).invoiceAddress?.taxNumber}` : ''}</div>
							<div>{(order as any).invoiceAddress?.address}</div>
							<div>{(order as any).invoiceAddress?.district}, {(order as any).invoiceAddress?.city} {(order as any).invoiceAddress?.postalCode}</div>
							<div>{(order as any).invoiceAddress?.phone}</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Kalemler */}
			{order?.items && Array.isArray(order.items) && (
				<Card>
					<CardHeader>
						<CardTitle>Fatura Kalemleri</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left border-b">
										<th className="py-2 pr-4">Ürün</th>
										<th className="py-2 pr-4">SKU</th>
										<th className="py-2 pr-4">Birim Fiyat</th>
										<th className="py-2 pr-4">Adet</th>
										<th className="py-2 pr-4">Tutar</th>
									</tr>
								</thead>
								<tbody>
									{order.items.map((it: any, idx: number) => {
										const name = it.product?.name || it.name || '-'
										const sku = it.product?.sku || it.sku || '-'
										const unitPrice = it.price ?? it.product?.price ?? 0
										const qty = it.quantity ?? 1
										const lineTotal = (it.total != null ? it.total : unitPrice * qty)
										return (
											<tr key={idx} className="border-b last:border-0">
												<td className="py-2 pr-4">{name}</td>
												<td className="py-2 pr-4">{sku}</td>
												<td className="py-2 pr-4">₺{Number(unitPrice).toFixed(2)}</td>
												<td className="py-2 pr-4">{qty}</td>
												<td className="py-2 pr-4">₺{Number(lineTotal).toFixed(2)}</td>
											</tr>
										)
									})}
									{discountValue > 0 && (
										<tr className="border-b last:border-0">
											<td className="py-2 pr-4 font-medium text-right" colSpan={4}>İndirim</td>
											<td className="py-2 pr-4 text-red-600">-₺{discountValue.toFixed(2)}</td>
										</tr>
									)}
									<tr className="border-b last:border-0">
										<td className="py-2 pr-4 font-semibold text-right" colSpan={4}>Toplam</td>
										<td className="py-2 pr-4 font-semibold">₺{grandTotalValue.toFixed(2)}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* KDV / Vergi Detayları */}
			{vatDetails && Array.isArray(vatDetails) && vatDetails.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>KDV / Vergi Detayları</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left border-b">
										<th className="py-2 pr-4">Oran</th>
										<th className="py-2 pr-4">Matrah</th>
										<th className="py-2 pr-4">KDV</th>
										<th className="py-2 pr-4">Açıklama</th>
									</tr>
								</thead>
								<tbody>
									{vatDetails.map((v: any, idx: number) => (
										<tr key={idx} className="border-b last:border-0">
											<td className="py-2 pr-4">%{v.rate ?? '-'}</td>
											<td className="py-2 pr-4">₺{Number(v.baseAmount ?? 0).toFixed(2)}</td>
											<td className="py-2 pr-4">₺{Number(v.taxAmount ?? 0).toFixed(2)}</td>
											<td className="py-2 pr-4">{v.description ?? '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
} 