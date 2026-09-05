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

Backend ayrı MealFlex-BE reposunda tutulur.
