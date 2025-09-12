'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, AlertCircle, CheckCircle, Settings } from "lucide-react"
import { useEmailStatus } from '@/hooks/useEmailStatus'
import { useEmailTest } from '@/hooks/useEmailTest'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function EmailManagementPage() {
  const { emailStatus, loading: statusLoading, error: statusError } = useEmailStatus(API_URL)
  const { sendTestEmail, loading: testLoading, error: testError, success: testSuccess } = useEmailTest(API_URL)
  
  const [testEmail, setTestEmail] = useState('')
  const [emailType, setEmailType] = useState<'order_confirmation' | 'welcome'>('order_confirmation')

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin')
      return
    }

    await sendTestEmail(testEmail, emailType)
    
    if (testSuccess) {
      toast.success('Test e-postası başarıyla gönderildi!')
      setTestEmail('')
    } else if (testError) {
      toast.error(testError)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">E-posta Yönetimi</h1>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">E-posta Servisleri</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* E-posta Durumu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                E-posta Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : statusError ? (
                <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded">
                  <AlertCircle className="h-5 w-5" />
                  <span>{statusError}</span>
                </div>
              ) : emailStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durum:</span>
                    <Badge variant={emailStatus.status === 'test_mode' ? 'secondary' : 'default'}>
                      {emailStatus.status === 'test_mode' ? 'Test Modu' : 'Aktif'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>SMTP Host:</span>
                      <span className="font-mono">{emailStatus.config?.host}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Port:</span>
                      <span>{emailStatus.config?.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gönderen:</span>
                      <span>{emailStatus.config?.from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Test Modu:</span>
                      <span>{emailStatus.config?.testMode ? 'Evet' : 'Hayır'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  E-posta durumu alınamadı
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test E-postası Gönder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Test E-postası Gönder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="testEmail">E-posta Adresi</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="emailType">E-posta Türü</Label>
                  <Select value={emailType} onValueChange={(value: 'order_confirmation' | 'welcome') => setEmailType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_confirmation">Sipariş Onay E-postası</SelectItem>
                      <SelectItem value="welcome">Hoş Geldin E-postası</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSendTestEmail} 
                  disabled={testLoading || !testEmail}
                  className="w-full"
                >
                  {testLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Gönderiliyor...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Test E-postası Gönder
                    </div>
                  )}
                </Button>

                {testSuccess && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded">
                    <CheckCircle className="h-5 w-5" />
                    <span>Test e-postası başarıyla gönderildi!</span>
                  </div>
                )}

                {testError && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded">
                    <AlertCircle className="h-5 w-5" />
                    <span>{testError}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* E-posta İstatistikleri */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>E-posta İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {emailStatus?.config?.testMode ? 'Test' : 'Aktif'}
                </div>
                <div className="text-sm text-gray-600">Durum</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {emailStatus?.config?.host ? 'Bağlı' : 'Bağlantı Yok'}
                </div>
                <div className="text-sm text-gray-600">SMTP Bağlantısı</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {emailStatus?.config?.from || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Gönderen Adres</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 