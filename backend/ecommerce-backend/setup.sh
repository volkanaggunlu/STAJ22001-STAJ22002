#!/bin/bash

# E-Commerce Backend Setup Script
# Bu script projeyi otomatik olarak kurar ve çalıştırır

echo "🚀 E-Commerce Backend Kurulum Başlıyor..."
echo "======================================="

# Gerekli yazılımları kontrol et
echo "📋 Sistem gereksinimleri kontrol ediliyor..."

# Node.js kontrol
if ! command -v node &> /dev/null; then
    echo "❌ Node.js bulunamadı. Lütfen Node.js'i kurun: https://nodejs.org/"
    exit 1
fi

# Docker kontrol
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker bulunamadı. Manuel kurulum yapılacak."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

# Docker Compose kontrol
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose bulunamadı."
    DOCKER_AVAILABLE=false
fi

echo "✅ Node.js $(node --version) bulundu"
echo "✅ npm $(npm --version) bulundu"

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "✅ Docker bulundu"
    echo "✅ Docker Compose bulundu"
fi

# .env dosyası kontrol
echo ""
echo "🔧 Environment konfigürasyonu kontrol ediliyor..."

if [ ! -f .env ]; then
    echo "⚠️  .env dosyası bulunamadı."
    echo "📝 .env.example'dan .env dosyası oluşturuluyor..."
    cp .env.example .env
    echo "✅ .env dosyası oluşturuldu"
    echo "⚠️  UYARI: .env dosyasındaki değerleri düzenlemeniz gerekiyor!"
else
    echo "✅ .env dosyası mevcut"
fi

# Dependencies kur
echo ""
echo "📦 Dependencies kuruluyor..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Dependencies kurulumu başarısız!"
    exit 1
fi

echo "✅ Dependencies başarıyla kuruldu"

# Docker ile kurulum
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "🐳 Docker ile kurulum yapılıyor..."
    
    # Docker permission kontrol
    if docker info &> /dev/null; then
        echo "✅ Docker izinleri OK"
        docker-compose up -d
    else
        echo "⚠️  Docker izin sorunu. Sudo ile çalıştırılıyor..."
        sudo docker-compose up -d
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker servisleri başlatıldı"
        
        # Servislerin hazır olmasını bekle
        echo "⏳ Servisler hazırlanıyor..."
        sleep 10
        
        # API test
        echo "🧪 API test ediliyor..."
        if curl -s http://localhost:8888/api/products > /dev/null; then
            echo "✅ API başarıyla çalışıyor!"
        else
            echo "⚠️  API henüz hazır değil, birkaç saniye daha bekleyin..."
        fi
        
        echo ""
        echo "🎉 Kurulum tamamlandı! Erişim bilgileri:"
        echo "======================================="
        echo "🌐 Backend API: http://localhost:8888"
        echo "🗃️  MongoDB: localhost:27017"
        echo "🖥️  Mongo Express: http://localhost:34366"
        echo ""
        echo "📝 Mongo Express Giriş:"
        echo "   Kullanıcı: Ahtapot#Ayhan"
        echo "   Şifre: Tursuhan!434!Tursunaz"
        echo ""
        echo "🧪 API Test:"
        echo "   curl http://localhost:8888/api/products"
        
    else
        echo "❌ Docker kurulumu başarısız!"
        exit 1
    fi
    
else
    # Manuel kurulum
    echo ""
    echo "🛠️  Manuel kurulum başlatılıyor..."
    echo "⚠️  MongoDB'nin sisteminizde kurulu ve çalışıyor olması gerekir"
    echo ""
    echo "MongoDB kurulumu için:"
    echo "Ubuntu/Debian: sudo apt-get install mongodb"
    echo "macOS: brew install mongodb/brew/mongodb-community"
    echo ""
    echo "MongoDB'yi başlatmak için:"
    echo "sudo systemctl start mongod"
    echo ""
    echo "Kurulum tamamlandıktan sonra çalıştırmak için:"
    echo "npm run dev"
fi

echo ""
echo "📚 Daha fazla bilgi için README.md dosyasını okuyun"
echo "🆘 Sorun yaşarsanız GitHub Issues'a başvurun" 