# MealFlex Frontend

MealFlex müşteri, satıcı ve yönetici arayüzlerini içeren React + Vite
uygulaması.

## Gereksinimler

- Node.js 20+
- npm
- Yerelde http://localhost:9090 üzerinde çalışan MealFlex Backend

## Yerel çalıştırma

    npm install
    npm run dev

Uygulama varsayılan olarak http://localhost:5173 adresinde çalışır. Vite,
/api isteklerini yerel backend uygulamasına yönlendirir.

## Kalite kontrolleri

    npm run lint
    npm run build
    npm run test:e2e

İlk tarayıcı testinden önce `npx playwright install chromium` çalıştırın.
Playwright kendi Vite test sunucusunu başlatır. Mevcut senaryolar mobil, tablet
ve masaüstü Chromium görünümünde çalışır; API yanıtları taklit edildiğinden
gerçek backend/veritabanı veya ödeme sağlayıcısı entegrasyonunu doğrulamaz.

Teslimat saatleri için backend'in `GET /api/v1/stores/{id}/delivery-times`
uç noktasını desteklemesi gerekir; tarih aralığı `startDate` ve `endDate`
parametreleriyle gönderilir. Satıcı ayarları 15 dakikalık birden fazla aralığı
tekil saatlere dönüştürerek kaydeder. Yeni abonelik ekranı yalnızca seçilen
dönemin tüm hizmet günlerine uygun saatleri gösterir.

Backend ayrı MealFlex-BE reposunda tutulur.
