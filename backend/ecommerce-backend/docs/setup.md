## Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- MongoDB 6+

### .env
`ENVIRONMENT_SETUP.md` içeriğine göre `.env` oluşturun. Örnek:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/elektrotech
JWT_SECRET=change-me
```

### Kurulum
```bash
npm install
npm run dev
```

### Swagger UI
- `docs/openapi.yaml` dosyasını doldurun.
- Dokümantasyon: `http://localhost:3000/docs` 