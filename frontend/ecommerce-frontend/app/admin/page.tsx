'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Eye, 
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  MoreHorizontal,
  Plus,
  DollarSign,
  Activity,
  RefreshCw,
  FolderTree
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS, APP_CONFIG } from '@/lib/utils/constants'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'
import { adminApi } from '@/lib/api/services/admin'
import { formatPrice } from '@/lib/utils/format'

export default function AdminDashboard() {
  // API Queries
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_STATS,
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: APP_CONFIG.CACHE_TIMES.MEDIUM,
    retry: 3
  })

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'recent-orders'],
    queryFn: () => adminApi.getRecentOrders(5),
    staleTime: APP_CONFIG.CACHE_TIMES.SHORT,
    retry: 2
  })

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'top-products'],
    queryFn: () => adminApi.getTopProducts(4),
    staleTime: APP_CONFIG.CACHE_TIMES.MEDIUM,
    retry: 2
  })

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['admin', 'sales-data'],
    queryFn: () => adminApi.getSalesData('6m'),
    staleTime: APP_CONFIG.CACHE_TIMES.LONG,
    retry: 2
  })

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['admin', 'category-distribution'],
    queryFn: () => adminApi.getCategoryDistribution(),
    staleTime: APP_CONFIG.CACHE_TIMES.LONG,
    retry: 2
  })

  // Stats configuration
  const stats = [
    {
      title: 'Toplam Ürün',
      value: dashboardStats?.totalProducts || 0,
      change: dashboardStats?.trends?.products || '+0%',
      icon: Package,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/admin/products'
    },
    {
      title: 'Toplam Kullanıcı',
      value: dashboardStats?.totalUsers || 0,
      change: dashboardStats?.trends?.users || '+0%',
      icon: Users,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/admin/users'
    },
    {
      title: 'Toplam Sipariş',
      value: dashboardStats?.totalOrders || 0,
      change: dashboardStats?.trends?.orders || '+0%',
      icon: ShoppingCart,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/admin/orders'
    },
    {
      title: 'Aylık Satış',
      value: formatPrice(dashboardStats?.monthlySales || 0),
      change: dashboardStats?.trends?.sales || '+0%',
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/admin/orders'
    }
  ]

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Tamamlandı', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      delivered: { label: 'Teslim Edildi', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      processing: { label: 'Hazırlanıyor', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Onaylandı', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Kargoda', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Beklemede', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'İptal Edildi', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />
    } else if (trend.startsWith('-')) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />
    }
    return null
  }

  const getTrendColor = (trend: string) => {
    if (trend.startsWith('+')) return 'text-green-600'
    if (trend.startsWith('-')) return 'text-red-600'
    return 'text-muted-foreground'
  }

  // Error state
  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Activity className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Veri Yükleme Hatası</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Dashboard verileri yüklenemiyor. Lütfen tekrar deneyin.
            </p>
            <Button onClick={() => refetchStats()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Açık Atölye yönetim paneli genel görünümü
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Rapor Al
          </Button>
          <Button onClick={() => refetchStats()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <Link href={stat.href}>
                <CardContent className="p-6">
                  {statsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">
                          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </p>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(stat.change)}
                          <span className={`text-xs font-medium ${getTrendColor(stat.change)}`}>
                            {stat.change}
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      {/* Charts & Analytics */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Satış Trendi</span>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>Son 6 aylık satış performansı</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Kategori Dağılımı</CardTitle>
            <CardDescription>Satış oranları kategorilere göre</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData || []}
                    dataKey="percentage"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {(categoryData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 137.5}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Son Siparişler</CardTitle>
              <CardDescription>En son gelen 5 sipariş</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">
                Tümünü Gör
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(recentOrders || []).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {order.customerName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)} • {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz sipariş bulunmuyor</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>En Çok Satan Ürünler</CardTitle>
              <CardDescription>Satış performansına göre top 4</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">
                Tümünü Gör
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(topProducts || []).map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.salesCount} satış • {formatPrice(product.revenue)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                ))}
                {(!topProducts || topProducts.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz satış verisi bulunmuyor</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
          <CardDescription>Sık kullanılan yönetim işlemleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/admin/products/new">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Yeni Ürün</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/admin/categories/new">
                <FolderTree className="h-6 w-6" />
                <span className="text-sm">Yeni Kategori</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/admin/orders">
                <ShoppingCart className="h-6 w-6" />
                <span className="text-sm">Siparişler</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/admin/users">
                <Users className="h-6 w-6" />
                <span className="text-sm">Kullanıcılar</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 