'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { adminApi } from '@/lib/api/services/admin'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/format'
import Image from 'next/image'

export default function AdminUserOrdersPage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'user-orders', userId],
    queryFn: async () => {
      // Basit çözüm: tüm siparişleri çekip client tarafında bu kullanıcıya filtrele
      const res = await adminApi.getOrders({ page: 1, limit: 50 })
      const orders = (res?.orders || []).filter((o: any) => (o.userId?._id || o.userId) === userId)
      return orders
    },
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Kullanıcı Siparişleri</h1>
          <Button onClick={() => refetch()}>Yenile</Button>
        </div>
        <Card>
          <CardContent className="p-8 text-destructive">Siparişler yüklenemedi.</CardContent>
        </Card>
      </div>
    )
  }

  const orders = data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Siparişleri</h1>
          <CardDescription>Toplam {orders.length} sipariş</CardDescription>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">Geri</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-muted-foreground">Bu kullanıcıya ait sipariş bulunamadı.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Ürünler</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.orderNumber || order._id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {(order.items || []).map((it: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            {it.image ? (
                              <Image src={it.image} alt={it.productName || it.name} width={32} height={32} className="rounded" />
                            ) : (
                              <div className="w-8 h-8 bg-muted rounded" />
                            )}
                            <span className="text-sm">
                              {(it.productName || it.name) || 'Ürün'} x{it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status || 'oluşturuldu'}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(order.totalAmount || order.total || 0)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}