// new hook
import  { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';


export function useCategories(apiUrl: string, page: number=1 , limit: number=12){

    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true) 
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState<any>(null)


    useEffect(()=>{

        if(process.env.NODE_ENV === 'development'){
            console.log('📂 [DEBUG] useCategories hook çalışıyor:', { apiUrl, page, limit })
        }
        
        setLoading(true)
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit',limit.toString())

        const url= `${apiUrl}?${params.toString()}`

        apiClient
            .get(url)
            .then((response: any) => {
              if(process.env.NODE_ENV==='development'){
                console.log('📂 [DEBUG] useCategories API yanıt durumu:', response.status)
              }  
              return response.data
            })
            .then((data: any) =>{

                if(data.success===false){
                    const errorMessage = data.error?.message || 'Kategoriler Alınamadı'
                    setError(errorMessage)
                    setCategories([])
                    setPagination(null)
                } else {
                    const categoriesData = data.categories || data.data?.categories || []
                    const paginationData = data.pagination || data.data?.pagination || null

                    setCategories(categoriesData)
                    setPagination(paginationData)
                    setError(null)
                }
                    setLoading(false)
            })
            .catch((err: any)=> {
                setError('Kategoriler Alınamadı')
                setCategories([])
                setPagination(null)
                setLoading(false)

                if(process.env.NODE_ENV==='development'){
                    console.error('📂 [DEBUG] useCategories API hatası:',err)
                }
            })
        }, [apiUrl,page,limit])

        return {categories,loading,pagination,error}
}