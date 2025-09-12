'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Calendar, DollarSign, Truck, Eye, AlertCircle } from "lucide-react"
import { useOrders } from '@/hooks/useOrders'
import Link from 'next/link'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const orderStatuses = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'paid', label: 'Ödendi' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal Edildi' }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'paid': return 'bg-blue-100 text-blue-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <AlertCircle className="h-4 w-4" />
    case 'paid': return <DollarSign className="h-4 w-4" />
    case 'shipped': return <Truck className="h-4 w-4" />
    case 'delivered': return <Package className="h-4 w-4" />
    case 'cancelled': return <AlertCircle className="h-4 w-4" />
    default: return <Package className="h-4 w-4" />
  }
}

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [limit] = useState(10)

  const { orders, pagination, loading, error } = useOrders(API_URL, currentPage, limit, selectedStatus === 'all' ? undefined : selectedStatus)

  // Debug için useEffect ekliyorum
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [DEBUG] Siparişlerim sayfası durumu:', {
        orders,
        pagination,
        loading,
        error,
        currentPage,
        selectedStatus,
        API_URL
      });
    }
  }, [orders, pagination, loading, error, currentPage, selectedStatus]);

  const handleStatusChange = (status: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [DEBUG] Durum değişti:', status);
    }
    setSelectedStatus(status)
    setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
  }

  const handlePageChange = (page: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [DEBUG] Sayfa değişti:', page);
    }
    setCurrentPage(page)
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [DEBUG] Siparişlerim sayfasında hata:', error);
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 p-4 bg-red-50 text-red-700 rounded">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Siparişlerim</h1>
            <p className="text-gray-600 mt-1">Tüm siparişlerinizi buradan takip edebilirsiniz</p>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Sipariş Yönetimi</span>
          </div>
        </div>

        {/* Filtreler */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sipariş Durumu</label>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Bilgisi */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-4 bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="text-sm text-yellow-800">
                <strong>Debug Bilgisi:</strong>
                <br />
                Loading: {loading ? 'Evet' : 'Hayır'}
                <br />
                Error: {error || 'Yok'}
                <br />
                Sipariş Sayısı: {orders?.length || 0}
                <br />
                Seçili Durum: {selectedStatus}
                <br />
                Sayfa: {currentPage}
                <br />
                API URL: {API_URL}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sipariş Listesi */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz siparişiniz yok</h3>
                <p className="text-gray-600 mb-4">İlk siparişinizi vermek için ürünlerimizi inceleyin</p>
                <Link href="/">
                  <Button>Alışverişe Başla</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">
                              {orderStatuses.find(s => s.value === order.status)?.label || order.status}
                            </span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium text-gray-900">
                            ₺{order.totalAmount?.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>{order.totalItems || 0} ürün</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link href={`/siparislerim/${order._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Detay
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sayfalama */}
        {pagination && pagination.pages > 1 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Önceki
                </Button>
                
                {[...Array(pagination.pages)].map((_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.pages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Sonraki
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-600 mt-2">
                Sayfa {currentPage} / {pagination.pages} • Toplam {pagination.total} sipariş
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 