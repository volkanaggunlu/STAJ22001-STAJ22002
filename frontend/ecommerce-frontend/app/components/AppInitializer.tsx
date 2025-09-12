"use client"
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { setItemsFromApi } from '@/lib/store/cartStore'
import { apiClient } from '@/lib/api/client'

export default function AppInitializer() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/cart').then((res: any) => {
        if (res.data?.success && res.data?.data?.cart) {
          setItemsFromApi(res.data.data.cart)
        }
      })
    }
  }, [isAuthenticated])
  return null
} 