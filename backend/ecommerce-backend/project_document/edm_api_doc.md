# EDM e-Fatura API Dokümantasyonu (Özet ve Entegrasyon Notları)

Bu doküman, EDM/Edoksis e-Fatura servislerinin (EFaturaEDMConnectorService) tipik yetenekleri ve entegrasyon akışını özetler. Firma EDM hizmetlerini kullandığı için üretici dokümanındaki isimler, endpoint’ler ve şemalar WSDL üzerinden doğrulanarak uygulanacaktır.

- Referans: `https://docs.edmbilisim.com.tr/api/api-documentation/einvoice/referenced/EFaturaEDMConnectorService.html` (doğrulama ve tam şema WSDL’den çekilecektir)
- İlgili ürün/marka: Edoksis (SabancıDx)
- Not: Aşağıdaki metot ve akış adları, Edoksis test servislerinde bulunan tipik SOAP operasyonlarıyla uyumludur (ör. `Gonder`, `FaturaSorgulama`, `FaturaIndir`, `FaturaPDFGoruntule`, `FaturaStatuSorgulama`, `GelenFaturaListeleme`, `GidenFaturaListeleme`). Gerçek isim/parametreler WSDL’ye göre birebir eşleştirilecektir.

---

## Kimlik Doğrulama ve Güvenlik

- Kimlik doğrulama: Genellikle SOAP Header’da WS-Security UsernameToken (kullanıcı adı/şifre) veya Basic Auth.
- Sertifika: e-Fatura gönderiminde TLS/Mutual TLS ve imza süreçleri olabilir. `certificates/` dizinindeki kurumsal sertifikalar kullanılacaktır.
- Ortam değişkenleri:
  - `EDM_ENDPOINT` (Test/Prod SOAP endpoint URL)
  - `EDM_WSDL_URL` (WSDL adresi)
  - `EDM_USERNAME`, `EDM_PASSWORD`
  - `EDM_VKN` (gönderici VKN)
  - `EDM_CERT_PATH`, `EDM_CERT_PASSWORD` (gerekirse)

---

## Ortamlar

- Test: Üretici dokümanındaki test endpoint ve WSDL kullanılacak.
- Prod: Üretim endpoint ve WSDL.
- Not: Entegrasyon, önce test ortamında ETTN üretimi ve GİB akış doğrulamasıyla devreye alınır.

---

## Ana Kavramlar

- UBL 2.1: e-Fatura dokümanı UBL 2.1 XML formatında hazırlanır.
- ETTN: Her fatura için benzersiz kimlik (UUID).
- Zarf: GİB’e iletilen paket yapısı; zarf statüsü faturanın durumuna etki eder.
- Ticari/Satış Faturası tipleri: `TICARIFATURA` / `SATIS` vb. Ürün dokümanındaki kodlar esas alınacaktır.

---

## Tipik SOAP Operasyonları (Yüksek Seviye)

Aşağıdaki operasyonlar, Edoksis/EDM e-Fatura servislerinde sık kullanılan metotlara ilişkindir. Metot adları WSDL’den teyit edilecektir.

- `Gonder` (Fatura Gönderimi)
  - Amaç: UBL XML (veya Base64) içeriğinin EDM üzerinden GİB’e gönderimi.
  - Girdi (özet): Gönderici VKN, Alıcı VKN/TCKN, Fatura Tipi, UBL XML (veya Base64), opsiyonel seri/no.
  - Çıktı: `ETTN` (UUID), zarf bilgisi/numarası, işlem sonucu.

- `FaturaStatuSorgulama`
  - Amaç: ETTN veya fatura numarası ile GİB/EDM üzerindeki güncel durumun sorgulanması.
  - Çıktı: `status` (ör. sent, delivered, gib_processing, gib_approved/rejected), zaman damgaları.

- `FaturaSorgulama`
  - Amaç: Filtrelerle (tarih aralığı, alıcı VKN, durum) giden/gelen faturaların listelenmesi.

- `FaturaIndir`
  - Amaç: Faturanın UBL/XML içeriğinin indirilmesi.
  - Çıktı: UBL/XML (Base64 veya raw XML).

- `FaturaPDFGoruntule`
  - Amaç: E-faturanın PDF çıktısını (render) almak.
  - Çıktı: PDF (Base64).

- `GidenFaturaListeleme` / `GelenFaturaListeleme`
  - Amaç: Giden/gelen faturaların sayfalanmış listesi ve özet alanları.

- `FaturaOnayla` / `CevapVer` (Alış faturaları senaryosu için)
  - Amaç: Gelen ticari faturaya kabul/ret cevapları üretmek.

- `ZarfGonder` / `ZarfOnizleme`
  - Amaç: Zarf seviyesinde işlem ve önizleme (gerekliyse).

Not: Üretici sayfasındaki `EFaturaEDMConnectorService` altında bulunan birebir metot/parametre adları WSDL ile eşleşecek şekilde kod tarafında jeneratif olarak üretilecektir (Node SOAP client veya OpenAPI adapter yoksa SOAP client tercih edilecektir).

---

## Veri Şemaları (Özet)

Gerçek XSD/WSDL şemaları entegrasyon sırasında otomatik olarak içe alınacaktır. Aşağıdaki alanlar uygulama içi mapping için kritik:

- Gönderici bilgiler: Unvan, VKN, vergi dairesi, adres, e-fatura GB.
- Alıcı bilgiler: Unvan/AdSoyad, VKN/TCKN, e-Fatura mükellefiyeti, adres.
- Fatura üst bilgileri: Fatura tipi, para birimi, tarih, seri-no (opsiyonel), ödeme bilgileri.
- Kalemler: Mal/Hizmet satırı, KDV oran/tutarı, iskonto/dekont, GTIP (varsa), ölçü birimi.
- Toplamlar: Matrah, KDV toplam, genel toplam.
- Eklentiler: İrsaliye referansı, sipariş referansı, notlar.

---

## Hata Yönetimi

- SOAP Fault: `faultcode`, `faultstring` üreticiye özgü hata mesajlarını içerir.
- Uygulama hataları: Yanlış şema, geçersiz VKN/TCKN, mükellef değil, imza/sertifika sorunları, yetki sorunları.
- İyileştirme: Hata kodlarını `EDM_*` prefix’i ile uygulama log’larına ve kullanıcıya gösterilecek sade mesajlara map’leme.

---

## Hız Sınırları ve Tekrar Denemeler

- Rate limit: Üretici dokümanına göre; genel pratik: 429/503 benzeri durumlarda jitter’lı exponential backoff.
- Tekrar deneme: `Gonder` sonrası `FaturaStatuSorgulama` periyodik kontrol (örn. 5 dk, 15 dk, 60 dk) ve toplam 24-48 saatlik izleme penceresi.

---

## Güvenlik ve Uyumluluk

- TLS ve sertifika doğrulama zorunlu.
- Kimlik bilgileri `.env.local`/secrets store’da saklanır.
- Kişisel veri ve ticari bilgilerin log’larda maskelenmesi.
- PDF/UBL indirme sadece yetkili roller tarafından, imzalı URL veya kısa süreli token ile.

---

## Entegrasyon Stratejisi (Kısa Özet)

1. UBL oluşturma: Siparişten UBL 2.1 üretimi (sunucu tarafında).
2. Gönderim: `Gonder` ile EDM’e iletim, ETTN ve zarf bilgisini kaydetme.
3. Durum izleme: `FaturaStatuSorgulama` ile polling ve `gib_status` alanını güncelleme.
4. Görüntüleme/İndirme: `FaturaPDFGoruntule` ve `FaturaIndir` ile PDF/UBL erişimi.
5. Muhasebe/İade: Gerekirse gelen faturalar, yanıt ve iade senaryoları.

---

## Örnek İstek/Response (Şablon)

Aşağıda bir SOAP `Gonder` isteğine dair yalın bir iskelet verilmiştir. Gerçek alan adları WSDL’den üretilecektir.

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:efat="http://edm/efatura">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${EDM_USERNAME}</wsse:Username>
        <wsse:Password>${EDM_PASSWORD}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <efat:Gonder>
      <efat:GondericiVKN>${EDM_VKN}</efat:GondericiVKN>
      <efat:AliciVKN>1234567890</efat:AliciVKN>
      <efat:FaturaTip>KAGIT_FATURA_YOK</efat:FaturaTip>
      <efat:UblBase64>{BASE64_XML}</efat:UblBase64>
    </efat:Gonder>
  </soapenv:Body>
</soapenv:Envelope>
```

Örnek response (özet):

```xml
<soap:Envelope>
  <soap:Body>
    <GonderResponse>
      <Sonuc>KABUL</Sonuc>
      <ETTN>urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</ETTN>
      <ZarfUuid>...</ZarfUuid>
      <Mesaj>İşlem başarıyla tamamlandı</Mesaj>
    </GonderResponse>
  </soap:Body>
</soap:Envelope>
```

---

## Uygulama İçi Mapping Önerisi

- Sipariş modeli: `Order` içerisine `eInvoice` alanı eklenir: `ettn`, `envelopeId`, `status`, `gibStatusHistory`, `sentAt`, `lastCheckedAt`.
- Admin UI: `app/admin/invoices` sayfasında EDM durum göstergesi, PDF/UBL indir linkleri, manuel yeniden gönder/yeniden kontrol.
- Arka plan işler: `edm:poll-status` cron (5-15 dk aralık), başarısız gönderimler için retry kuyruğu.

---

## Test Planı (Kısa)

- Test ortamında örnek VKN ve alıcılarla `Gonder` denemesi.
- ETTN doğrulama ve `FaturaStatuSorgulama` ile onay sürecinin takibi.
- PDF ve UBL indirilebilirliğinin kontrolü.
- Hata senaryoları: hatalı VKN, şemasız UBL, yetki hatası, ağ hatası.

---

Bu doküman ilk entegrasyon turu için rehber niteliğindedir. Üretici WSDL/şemalarına göre isimler ve alanlar birebir eşleştirilerek kodda kesinleştirilecektir. 