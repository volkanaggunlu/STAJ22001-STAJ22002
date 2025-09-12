'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Search, MoreHorizontal, RefreshCw, Trash2, User, Shield } from 'lucide-react'
import { useAdminUsers, useDeleteUser } from '@/lib/hooks/useAdminUsers'

type RoleFilter = 'all' | 'user' | 'admin'

export default function AdminUsersPage() {
  // Filters & pagination
  const [page, setPage] = useState(1)
  // temp filters (form state)
  const [tempSearch, setTempSearch] = useState('')
  const [tempRole, setTempRole] = useState<RoleFilter>('all')
  const [tempStatus, setTempStatus] = useState<'all' | 'active' | 'inactive'>('active')
  // applied filters (query state)
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedRole, setAppliedRole] = useState<RoleFilter>('all')
  const [appliedStatus, setAppliedStatus] = useState<'all' | 'active' | 'inactive'>('active')

  const { data, isLoading, error, refetch } = useAdminUsers({
    page,
    limit: 20,
    search: appliedSearch || undefined,
    role: appliedRole !== 'all' ? appliedRole : undefined,
    status: appliedStatus !== 'all' ? appliedStatus : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const deleteUserMutation = useDeleteUser()

  const users = data?.users || []
  const pagination = data?.pagination || { total: 0, totalPages: 0, page: 1, limit: 20 }
  const getStatusBadge = (user: any) => {
      const active = user.isActive !== false
      if (active) return <Badge variant="default">Aktif</Badge>
      return <Badge variant="secondary">Pasif</Badge>
   }

  const getRoleBadge = (user: any) => {
    const r = user.role || 'user'
    if (r === 'admin') return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">Admin</Badge>
    return <Badge variant="outline">Kullanıcı</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
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
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-2">Kullanıcılar yüklenirken hata oluştu</p>
              <Button variant="outline" onClick={() => refetch()}>
                Tekrar Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">Toplam {pagination.total} kullanıcı • Sayfa {pagination.page}/{pagination.totalPages}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">Filtreler ve Arama</CardTitle>
          <CardDescription>Kullanıcıları arayın ve role göre filtreleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input value={tempSearch} onChange={e => setTempSearch(e.target.value)} placeholder="Kullanıcı ara... (isim, email vb.)" className="pl-10" />
            </div>
            <Select value={tempRole} onValueChange={(v: RoleFilter) => setTempRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="user">Kullanıcı</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tempStatus} onValueChange={(v: any) => setTempStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button className="flex-1" onClick={() => {
                setAppliedSearch(tempSearch)
                setAppliedRole(tempRole)
                setAppliedStatus(tempStatus)
                setPage(1)
              }}>Uygula</Button>
              <Button variant="outline" onClick={() => {
                setTempSearch('')
                setTempRole('all')
                setTempStatus('all')
                setAppliedSearch('')
                setAppliedRole('all')
                setAppliedStatus('all')
                setPage(1)
              }}>Temizle</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
          <CardDescription>Toplam {pagination.total} kullanıcı</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => (
                <TableRow key={u._id || u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {u.role === 'admin' ? <Shield className="h-4 w-4 text-purple-600" /> : <User className="h-4 w-4 text-muted-foreground" />}
                      {u.firstName || u.name} {u.lastName || ''}
                    </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{getRoleBadge(u)}</TableCell>
                  <TableCell>{getStatusBadge(u)}</TableCell>
                  <TableCell>{new Date(u.createdAt || u.registeredAt).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menüyü aç</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u._id || u.id}`}>
                            Siparişlerini Gör
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" /> Sil
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{u.firstName || u.name} {u.lastName || ''}" kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUserMutation.mutate(u._id || u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">Toplam {pagination.total} kullanıcı, sayfa başına {pagination.limit}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Önceki</Button>
                <span className="text-sm">{page} / {pagination.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}>Sonraki</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


