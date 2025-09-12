"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface PayTRIframeProps {
  iframeToken: string
  onSuccess: () => void
  onError: (error: string) => void
}

export const PayTRIframe = ({ iframeToken, onSuccess, onError }: PayTRIframeProps) => {
  // Test token kontrolü
  const isTestToken = iframeToken.startsWith('test_token_');
  
  if (isTestToken) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">PayTR Test Modu</h3>
          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
              <h4 className="text-lg font-medium text-yellow-800">Test Modu Aktif</h4>
            </div>
            <p className="text-yellow-700 mb-4">
              PayTR entegrasyonu henüz tamamlanmamıştır. Gerçek ödeme bilgileri yapılandırıldıktan sonra bu bölüm aktif olacaktır.
            </p>
            <div className="bg-white p-4 rounded border">
              <h5 className="font-medium mb-2">Test Bilgileri:</h5>
              <ul className="text-sm space-y-1">
                <li><strong>Token:</strong> {iframeToken}</li>
                <li><strong>Durum:</strong> Simülasyon Modu</li>
                <li><strong>Ödeme:</strong> Test Ödemesi</li>
              </ul>
            </div>
            <div className="mt-4 flex space-x-3">
              <Button 
                onClick={() => onSuccess()} 
                className="bg-green-600 hover:bg-green-700"
              >
                Test Ödemesini Başarılı Kabul Et
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onError('Test ödemesi iptal edildi')}
              >
                Test Ödemesini İptal Et
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // PayTR iframe yükleme işlemi
    const script = document.createElement('script');
    script.src = 'https://www.paytr.com/js/iframeResizer.min.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">Güvenli Ödeme</h3>
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
            id="paytriframe"
            width="100%"
            height="600px"
            scrolling="no"
            frameBorder="0"
            allowTransparency={true}
            allowFullScreen={true}
          />
        </div>
      </div>
    </div>
  );
}; 