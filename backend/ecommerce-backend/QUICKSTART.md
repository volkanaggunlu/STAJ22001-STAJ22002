# 🚀 Hızlı Başlangıç Rehberi

Bu rehber projeyi en hızlı şekilde çalıştırmanızı sağlar.

## ⚡ 1 Dakikada Çalıştırma

### Ön Gereksinimler
- Node.js (v18+)
- Docker & Docker Compose

### Adım 1: Projeyi İndirin
```bash
git clone <repository-url>
cd ecommerce-backend
```

### Adım 2: Otomatik Kurulum
```bash
./setup.sh
```

### Adım 3: Tamamlandı! 🎉
Proje şu adreslerde çalışıyor:
- **API**: http://localhost:8888
- **Database UI**: http://localhost:34366

## 🛠️ Manuel Kurulum (Docker ile)

```bash
# 1. Dependencies'leri kur
npm install

# 2. Environment dosyasını kopyala
cp .env.example .env

# 3. Docker servisleri başlat
sudo docker-compose up -d

# 4. API'yi test et
curl http://localhost:8888/api/products
```

## 🧪 API Test Örnekleri

### Kullanıcı Kaydı
```bash
curl -X POST http://localhost:8888/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "surname": "User", 
    "email": "test@example.com",
    "password": "password123",
    "phone": "+905551234567"
  }'
```

### Ürünleri Listele
```bash
curl http://localhost:8888/api/products
```

### Giriş Yap
```bash
curl -X POST http://localhost:8888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🛑 Servisleri Durdurma

```bash
sudo docker-compose down
```

## 🔧 Geliştirici Komutları

```bash
# Development mode
npm run dev

# Testleri çalıştır
npm test

# Log'ları izle
sudo docker-compose logs -f node

# Veritabanını sıfırla
sudo docker-compose down -v && sudo docker-compose up -d
```

## 📝 Önemli Notlar

1. **.env dosyası** production'da gerçek değerlerle doldurulmalıdır
2. **MongoDB Express** giriş bilgileri:
   - Kullanıcı: `Ahtapot#Ayhan`
   - Şifre: `Tursuhan!434!Tursunaz`
3. **Test Mode** aktif (TEST_MODE=1)

## 🆘 Sorun mu Yaşıyorsunuz?

### Docker izin hatası
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port zaten kullanımda
```bash
sudo netstat -tulpn | grep :8888
sudo kill -9 <process_id>
```

### Daha fazla yardım için
- [README.md](README.md) dosyasını okuyun
- GitHub Issues'da sorun bildirin

---

**💡 İpucu**: Herhangi bir sorun yaşarsanız `sudo docker-compose logs` komutu ile log'ları kontrol edin. 