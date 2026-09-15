import { expect, test, type Page, type Route } from '@playwright/test'

const pageResult = (content: unknown[] = []) => ({ content, totalElements: content.length, totalPages: 1, size: 50, number: 0, first: true, last: true })
async function loginAs(page: Page, role: 'CUSTOMER' | 'SELLER' | 'ADMIN') {
  await page.addInitScript(value => {
    localStorage.setItem('accessToken', 'e2e-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1, email: 'test@mealflex.local', firstName: 'Test', lastName: 'Kullanıcı', role: value }))
  }, role)
}
const json = (route: Route, body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

test('kurye davetini kabul eder, atanan teslimatı çalışma alanında görür', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  let invitationAccepted = false
  let assigned = false
  await page.route('**/api/v1/staff/invitations/accept', async route => {
    invitationAccepted = true
    return json(route, { id: 7, email: 'kurye@mealflex.local', role: 'COURIER', status: 'ACTIVE', permissions: ['DELIVERY_VIEW', 'DELIVERY_UPDATE'] })
  })
  await page.route('**/api/v1/seller/stores/5/couriers/deliveries/20', async route => {
    assigned = route.request().method() === 'PATCH'
    return route.fulfill({ status: 204, body: '' })
  })
  await page.route('**/api/v1/courier/deliveries/today', route => json(route, assigned ? [{
    id: 20,
    subscriptionId: 11,
    deliveryDate: '2026-09-08',
    deliveryTime: '12:30',
    personCount: 8,
    menuId: 4,
    addressId: 6,
    menuName: 'Kurumsal Öğle Menüsü',
    deliveryAddress: 'Yenimahalle, Ankara',
    deliveryAddressDetails: 'Test Caddesi No: 1 · Yenimahalle · Ankara',
    courierId: 9,
    courierName: 'Test Kurye',
    routeSequence: 1,
    status: 'SCHEDULED',
  }] : []))

  await page.goto('/staff/invitations/accept?token=tek-kullanimlik-token')
  await page.getByRole('button', { name: 'Daveti kabul et' }).click()
  await expect(page.getByText('Davet kabul edildi')).toBeVisible()
  expect(invitationAccepted).toBeTruthy()

  await page.evaluate(async () => {
    await fetch('/api/v1/seller/stores/5/couriers/deliveries/20', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierId: 9, routeSequence: 1 }),
    })
  })
  expect(assigned).toBeTruthy()
  await page.getByRole('link', { name: 'Kurye çalışma alanına git' }).click()
  await expect(page).toHaveURL(/\/courier$/)
  await expect(page.getByRole('heading', { name: 'Bugünkü rotam' })).toBeVisible()
  await expect(page.getByText('Kurumsal Öğle Menüsü')).toBeVisible()
  await expect(page.getByText(/Test Caddesi No: 1/)).toBeVisible()
})

test('kurye konumunu çevrimdışı kuyruğa ekler ve bağlantı gelince bir kez gönderir', async ({ page, context }) => {
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) => success({
          coords: { latitude: 39.933365, longitude: 32.859742 },
        } as GeolocationPosition),
      },
    })
  })
  let status = 'SCHEDULED'
  const updates: Array<Record<string, unknown>> = []
  await page.route('**/api/v1/courier/deliveries/today', route => json(route, [{
    id: 20,
    subscriptionId: 11,
    deliveryDate: '2026-09-14',
    deliveryTime: '12:30',
    personCount: 8,
    menuId: 4,
    addressId: 6,
    menuName: 'Kurumsal Öğle Menüsü',
    deliveryAddress: 'Yenimahalle, Ankara',
    deliveryAddressDetails: 'Test Caddesi No: 1 · Yenimahalle · Ankara',
    courierId: 9,
    courierName: 'Test Kurye',
    routeSequence: 1,
    status,
  }]))
  await page.route('**/api/v1/courier/deliveries/20/status', async route => {
    updates.push(route.request().postDataJSON())
    status = 'IN_TRANSIT'
    return json(route, { id: 20, status })
  })

  await page.goto('/courier')
  await context.setOffline(true)
  await expect(page.getByText('Çevrimdışısınız; işlemler bağlantı geldiğinde gönderilecek.')).toBeVisible()
  await page.getByRole('button', { name: 'Yola çıktım' }).click()
  await expect(page.getByText('Konumunuz durum güncellemesine eklendi.')).toBeVisible()
  await expect(page.getByText('Gönderilmeyi bekleyen 1 işlem var.')).toBeVisible()
  expect(updates).toHaveLength(0)

  await context.setOffline(false)
  await expect.poll(() => updates.length).toBe(1)
  expect(updates[0]).toMatchObject({
    status: 'IN_TRANSIT',
    courierLatitude: 39.933365,
    courierLongitude: 32.859742,
  })
  await expect(page.getByText('Gönderilmeyi bekleyen 1 işlem var.')).toBeHidden()
})

test('kurye konum iznini reddettiğinde teslimatı konumsuz günceller', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
          error({ code: 1, message: 'Permission denied', PERMISSION_DENIED: 1 } as GeolocationPositionError),
      },
    })
  })
  let update: Record<string, unknown> | undefined
  await page.route('**/api/v1/courier/deliveries/today', route => json(route, [{
    id: 21,
    subscriptionId: 12,
    deliveryDate: '2026-09-14',
    deliveryTime: '13:00',
    personCount: 5,
    menuId: 4,
    addressId: 7,
    menuName: 'Kurumsal Öğle Menüsü',
    deliveryAddress: 'Etimesgut, Ankara',
    courierId: 9,
    courierName: 'Test Kurye',
    routeSequence: 1,
    status: 'SCHEDULED',
  }]))
  await page.route('**/api/v1/courier/deliveries/21/status', async route => {
    update = route.request().postDataJSON()
    return json(route, { id: 21, status: 'IN_TRANSIT' })
  })

  await page.goto('/courier')
  await page.getByRole('button', { name: 'Yola çıktım' }).click()
  await expect(page.getByText(/Konum izni verilmedi.*Teslimat konumsuz güncellendi/)).toBeVisible()
  await expect.poll(() => update).toEqual({ status: 'IN_TRANSIT' })
})

test('kurye yanlış teslimat kodunu görür ve başarısız denemeyi gerekçesiyle kaydeder', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  let status = 'IN_TRANSIT'
  let failureUpdate: Record<string, unknown> | undefined
  await page.route('**/api/v1/courier/deliveries/today', route => json(route, [{
    id: 22,
    subscriptionId: 12,
    deliveryDate: '2026-09-14',
    deliveryTime: '13:00',
    personCount: 5,
    menuId: 4,
    addressId: 7,
    menuName: 'Kurumsal Öğle Menüsü',
    deliveryAddress: 'Etimesgut, Ankara',
    customerPhoneMasked: '•••• ••• 2233',
    courierId: 9,
    courierName: 'Test Kurye',
    routeSequence: 1,
    status,
  }]))
  await page.route('**/api/v1/courier/deliveries/22/status', async route => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    if (body.status === 'DELIVERED') {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Teslimat kodu hatalı.' }),
      })
    }
    failureUpdate = body
    status = 'DELIVERY_ATTEMPTED'
    return json(route, { id: 22, status })
  })

  await page.goto('/courier')
  await page.getByRole('button', { name: 'Teslim et' }).click()
  await page.getByLabel('Teslim alan kişi').fill('Test Teslim Alan')
  await page.getByLabel('Müşteri teslimat kodu').fill('0000')
  await page.getByRole('button', { name: 'Teslimatı tamamla' }).click()
  await expect(page.getByRole('alert')).toHaveText('Teslimat kodu hatalı.')

  await page.getByRole('button', { name: 'Vazgeç' }).click()
  await page.getByRole('button', { name: 'Teslim edilemedi' }).click()
  const saveFailure = page.getByRole('button', { name: 'Başarısız denemeyi kaydet' })
  await expect(saveFailure).toBeDisabled()
  await page.getByLabel('Teslim edilememe nedeni').fill('Müşteri adreste bulunamadı.')
  await page.getByLabel('Gecikme süresi (dakika)').fill('15')
  await page.getByLabel('Operasyon notu').fill('Telefonla ulaşılamadı.')
  await saveFailure.click()
  await expect.poll(() => failureUpdate).toEqual({
    status: 'DELIVERY_ATTEMPTED',
    failureReason: 'Müşteri adreste bulunamadı.',
    notes: 'Telefonla ulaşılamadı.',
    delayMinutes: 15,
  })
  await expect(page.getByText('Teslim edilemedi', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tekrar yola çıktım' })).toBeVisible()
})

test('giriş ve kayıt formları alan bazlı Zod doğrulaması gösterir ve klavyeyle kullanılabilir', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click()
  const accessDialog = page.getByRole('dialog', { name: 'Tekrar hoş geldiniz' })
  await expect(accessDialog).toBeVisible()
  await accessDialog.locator('form').getByRole('button', { name: 'Giriş yap' }).click()
  await expect(page.getByText('E-posta adresinizi girin.')).toBeVisible()
  await expect(page.getByText('Şifrenizi girin.')).toBeVisible()
  await page.getByLabel('E-posta').fill('gecersiz')
  await page.keyboard.press('Tab')
  await expect(page.locator('input[name="password"]')).toBeFocused()
  await page.locator('input[name="password"]').fill('x')
  await accessDialog.locator('form').getByRole('button', { name: 'Giriş yap' }).click()
  await expect(page.getByText('Geçerli bir e-posta adresi girin.')).toBeVisible()

  await page.goto('/register')
  await page.getByLabel(/^Ad/).fill('A')
  await page.getByLabel('Soyad').fill('B')
  await page.getByLabel('E-posta').fill('yanlis')
  await page.locator('input[name="password"]').fill('kisa')
  await page.getByRole('checkbox').check()
  await expect(page.getByRole('button', { name: 'Hesap oluştur' })).toBeDisabled()
  await page.locator('input[name="password"]').fill('abc12345')
  await page.getByRole('button', { name: 'Hesap oluştur' }).click()
  await expect(page.getByText('Ad en az 2 karakter olmalıdır.', { exact: true })).toBeVisible()
  await expect(page.getByText('Geçerli bir e-posta adresi girin.')).toBeVisible()
})

test('müşteri karşılama ekranı giriş, üyelik ve satıcı geçişlerini sunar', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Ekibiniz için doğru öğünü kolayca bulun.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /MealFlex Satıcısı Ol/ })).toHaveAttribute('href', '/seller/login')

  await page.getByRole('link', { name: 'Nasıl çalışır?' }).click()
  await expect(page).toHaveURL(/#how-it-works$/)
  const howItWorksHeading = page.getByRole('heading', { name: 'İlk teslimata kadar üç net adım.' })
  await expect(howItWorksHeading).toBeVisible()
  await expect(howItWorksHeading).toBeFocused()

  await page.getByRole('button', { name: 'Üye Ol', exact: true }).click()
  const registerDialog = page.getByRole('dialog', { name: 'MealFlex’e katılın' })
  await expect(registerDialog).toBeVisible()
  await expect(registerDialog.getByLabel(/^Ad/)).toBeVisible()
  await registerDialog.getByRole('button', { name: 'Pencereyi kapat' }).click()
  await expect(registerDialog).toBeHidden()
})

test('yanlış giriş bağlamı rol bilgisini açıklamadan genel kimlik doğrulama hatası gösterir', async ({ page }) => {
  await page.route('**/api/v1/auth/**', route => {
    if (route.request().url().endsWith('/login')) {
      return json(route, {
        accessToken: 'seller-token',
        refreshToken: 'seller-refresh-token',
        userId: 4,
        email: 'seller@test.mealflex.local',
        firstName: 'Satıcı',
        lastName: 'Test',
        role: 'SELLER',
      })
    }
    return json(route, {})
  })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Tekrar hoş geldiniz' })
  await dialog.getByLabel('E-posta').fill('seller@test.mealflex.local')
  await dialog.locator('input[name="password"]').fill('guclu-sifre')
  await dialog.locator('form').getByRole('button', { name: 'Giriş yap' }).click()
  await expect(dialog.getByText('Kullanıcı adı veya şifre hatalı.')).toBeVisible()
  await expect(dialog.getByText(/satıcı hesabı|\/seller\/login/i)).toHaveCount(0)
})

test('giriş isteği tarayıcıdaki eski tokenı taşımaz', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'expired-access-token')
    localStorage.setItem('refreshToken', 'expired-refresh-token')
  })
  let authorizationHeader: string | undefined
  await page.route('**/api/**', route => {
    if (route.request().url().endsWith('/v1/auth/login')) {
      authorizationHeader = route.request().headers().authorization
      return json(route, {
        accessToken: 'new-access-token', refreshToken: 'new-refresh-token', userId: 7,
        email: 'customer.yenimahalle1@test.mealflex.local', firstName: 'Ali', lastName: 'Aksoy', role: 'CUSTOMER',
      })
    }
    if (route.request().url().includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/login')
  await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Tekrar hoş geldiniz' })
  await dialog.getByLabel('E-posta').fill('customer.yenimahalle1@test.mealflex.local')
  await dialog.locator('input[name="password"]').fill('password')
  await dialog.locator('form').getByRole('button', { name: 'Giriş yap' }).click()

  await expect.poll(() => page.evaluate(() => localStorage.getItem('accessToken'))).toBe('new-access-token')
  expect(authorizationHeader).toBeUndefined()
})

test('rol bazlı giriş adresleri doğru ekranı açar ve korunan alanları doğru girişe yönlendirir', async ({ page }) => {
  await page.goto('/seller/login')
  await expect(page.getByText('Satıcı hesabı', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mağazanıza hoş geldiniz' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Şifremi unuttum' })).toHaveAttribute('href', '/seller/forgot-password')

  await page.goto('/admin/login')
  await expect(page.getByText('Yönetici girişi')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Platformu yönetin' })).toBeVisible()
  await expect(page.getByText('Hesabınız yok mu?')).toHaveCount(0)

  await page.goto('/seller/dashboard')
  await expect(page).toHaveURL(/\/seller\/login$/)
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/admin\/login$/)
})

test('ana kimlik doğrulama ekranındaki metinler WCAG AA kontrastını karşılar ve görünüm taşmaz', async ({ page }) => {
  await page.goto('/login')
  for (const viewport of [{ width: 360, height: 800 }, { width: 834, height: 1112 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  }
  const failures = await page.evaluate(() => {
    const parse = (value: string) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    const luminance = ([red, green, blue]: number[]) => {
      const channels = [red, green, blue].map(value => { const channel = value / 255; return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4 })
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }
    const background = (element: Element | null): number[] => {
      if (!element) return [255, 255, 255]
      const values = (getComputedStyle(element).backgroundColor.match(/[\d.]+/g) || []).map(Number)
      const alpha = values.length === 4 ? values[3] : values.length === 3 ? 1 : 0
      const parent = alpha < 1 ? background(element.parentElement) : [0, 0, 0]
      return [0, 1, 2].map(index => (values[index] || 0) * alpha + parent[index] * (1 - alpha))
    }
    return Array.from(document.querySelectorAll('body *')).filter(element => {
      const ownText = Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
      return ownText && (element as HTMLElement).offsetParent !== null
    }).flatMap(element => {
      const style = getComputedStyle(element)
      const foreground = luminance(parse(style.color))
      const backdrop = luminance(background(element))
      const ratio = (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05)
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700)
      return ratio + 0.01 < (large ? 3 : 4.5) ? [`${element.tagName}: ${element.textContent?.trim().slice(0, 60)} (${ratio.toFixed(2)})`] : []
    })
  })
  expect(failures).toEqual([])
})

test('favori işlemi hata verdiğinde optimistic durum geri alınır', async ({ page }) => {
  let requestStarted = false
  let releaseFailure = () => undefined
  const failureGate = new Promise<void>(resolve => {
    releaseFailure = resolve
  })
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => localStorage.setItem('mealflex-active-address-id', '11'))
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [{ id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', fullAddress: 'Test', defaultAddress: true }])
    if (url.pathname.endsWith('/v1/stores/discovery-metadata')) return json(route, { categories: [], dietTags: [], allergens: [] })
    if (url.pathname.endsWith('/v1/stores/recent')) return json(route, [])
    if (url.pathname.endsWith('/v1/stores')) return json(route, pageResult([{ id: 2, name: 'Test Mutfağı', minPersonCount: 1, status: 'ACTIVE', rating: 4.8, reviewCount: 2, temporarilyClosed: false, categories: [], availableDeliveryTimes: [] }]))
    if (url.pathname.endsWith('/v1/favorites/check/2')) return json(route, { isFavorite: false })
    if (url.pathname.endsWith('/v1/favorites/2') && route.request().method() === 'POST') {
      requestStarted = true
      await failureGate
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    }
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })
  await page.goto('/stores')
  const add = page.getByRole('button', { name: 'Favorilere ekle' })
  await add.click()
  await expect.poll(() => requestStarted).toBe(true)
  await expect(page.getByRole('button', { name: 'Favorilerden çıkar' })).toBeVisible()
  releaseFailure()
  await expect(add).toBeVisible()
})

test('satıcı paneli telefon, tablet ve masaüstünde taşmaz; panel daraltılabilir ve mağaza menüsü kayar', async ({ page }) => {
  await loginAs(page, 'SELLER')
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('unread-count')) return json(route, { count: 0 })
    if (url.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (url.includes('/subscriptions/stores/2')) return json(route, pageResult())
    return json(route, [])
  })
  await page.goto('/seller/stores/2/pending')
  await expect(page.getByLabel('Mağaza bölümleri')).toBeVisible()
  for (const viewport of [{ width: 360, height: 800 }, { width: 834, height: 1112 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  }
  await page.setViewportSize({ width: 1366, height: 768 })
  await expect(page.getByText(/Sistem (çalışıyor|bağlantısı yok|kontrol ediliyor)/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Menüyü daralt' }).click()
  await expect(page.getByRole('button', { name: 'Menüyü genişlet' })).toBeVisible()
  const sidebar = page.locator('aside').first()
  await expect.poll(() => sidebar.evaluate(element => element.getBoundingClientRect().width)).toBe(80)
  const logoAlignment = await sidebar.evaluate(element => {
    const sidebarBox = element.getBoundingClientRect()
    const logoBox = element.querySelector('[aria-label="MealFlex"]')!.getBoundingClientRect()
    return {
      centerDifference: Math.abs((logoBox.x + logoBox.width / 2) - (sidebarBox.x + sidebarBox.width / 2)),
      leftInset: logoBox.x - sidebarBox.x,
    }
  })
  expect(logoAlignment.centerDifference).toBeLessThan(2)
  expect(logoAlignment.leftInset).toBeGreaterThan(8)
  await page.getByRole('button', { name: 'Hesap menüsü' }).click()
  await expect.poll(() => sidebar.evaluate(element => element.getBoundingClientRect().width)).toBe(288)
  await expect(page.getByRole('menu', { name: 'Hesap işlemleri' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Menüyü daralt' })).toBeVisible()
  await expect(page.getByLabel('Mağaza bölümleri').evaluate(element => element.scrollWidth >= element.clientWidth)).resolves.toBeTruthy()
})

test('satıcı destek formu iletişim bilgileriyle e-posta talebi oluşturur', async ({ page }) => {
  await loginAs(page, 'SELLER')
  let supportRequest: Record<string, unknown> | undefined
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/support/requests') && route.request().method() === 'POST') {
      supportRequest = route.request().postDataJSON() as Record<string, unknown>
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 42, emailStatus: 'SENT', createdAt: '2026-09-15T12:00:00Z' }) })
    }
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    if (url.pathname.endsWith('/v1/seller/stores')) return json(route, [])
    return json(route, [])
  })

  await page.goto('/seller/support')
  await expect(page.getByLabel('Ad soyad')).toHaveValue('Test Kullanıcı')
  await expect(page.getByLabel('E-posta')).toHaveValue('test@mealflex.local')
  await page.getByLabel(/Telefon/).fill('+90 555 111 22 33')
  await page.getByLabel('Kategori', { exact: true }).selectOption('TECHNICAL')
  await page.getByLabel('Konu').fill('Mağaza ekranı açılmıyor')
  await page.getByLabel('Mesajınız').fill('Mağaza yönetimi ekranını açarken beklenmeyen bir hata görüyorum.')
  await page.getByRole('button', { name: 'Destek talebi gönder' }).click()

  await expect(page.getByText('Destek talebiniz alındı.')).toBeVisible()
  await expect(page.getByText(/Talep numaranız #42/)).toBeVisible()
  expect(supportRequest).toMatchObject({
    contactName: 'Test Kullanıcı',
    contactEmail: 'test@mealflex.local',
    contactPhone: '+90 555 111 22 33',
    category: 'TECHNICAL',
    subject: 'Mağaza ekranı açılmıyor',
  })
})

test('abonelik listesi API hatasını boş liste gibi göstermez', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/subscriptions')) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    }
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [])
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/subscriptions')
  await expect(page.getByRole('heading', { name: 'Abonelikleriniz yüklenemedi' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tekrar dene' })).toBeVisible()
  await expect(page.getByText('Bu bölümde abonelik bulunmuyor')).toBeHidden()
})

test('satıcı onay talepleri API hatasını boş liste gibi göstermez', async ({ page }) => {
  await loginAs(page, 'SELLER')
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (url.pathname.includes('/subscriptions/stores/2')) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    }
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/seller/stores/2/pending')
  await expect(page.getByRole('heading', { name: 'Onay bekleyen talepler yüklenemedi' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tekrar dene' })).toBeVisible()
  await expect(page.getByText('Onay bekleyen talep bulunmuyor')).toBeHidden()
})

test('satıcı talepleri SLA ile süzer ve seçilenleri kısmi sonuçla toplu kabul eder', async ({ page }) => {
  await loginAs(page, 'SELLER')
  const now = Date.now()
  const base = { customerName: 'Test Müşteri', menuName: 'Ev Menüsü', personCount: 5, startDate: '2026-09-10', endDate: '2026-09-20', deliveryTime: '12:00', deliveryAddress: 'Ankara', totalAmount: 5000, status: 'PENDING_APPROVAL', createdAt: new Date(now - 60_000).toISOString() }
  const subscriptions = [
    { ...base, id: 101, approvalDeadlineAt: new Date(now + 2 * 3_600_000).toISOString() },
    { ...base, id: 102, approvalDeadlineAt: new Date(now + 48 * 3_600_000).toISOString() },
    { ...base, id: 103, approvalDeadlineAt: new Date(now - 3_600_000).toISOString() },
  ]
  const approved: number[] = []
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (path.endsWith('/v1/seller/subscriptions/stores/2')) return json(route, { content: subscriptions, totalElements: 3, totalPages: 1, size: 50, number: 0, first: true, last: true })
    const approveMatch = path.match(/\/seller\/subscriptions\/(\d+)\/approve$/)
    if (approveMatch) {
      const id = Number(approveMatch[1])
      approved.push(id)
      return id === 102 ? route.fulfill({ status: 409, contentType: 'application/json', body: '{}' }) : json(route, { ...base, id, status: 'ACTIVE' })
    }
    if (path.includes('unread-count')) return json(route, { count: 0 })
    if (path.includes('delivery-change-requests')) return json(route, [])
    return json(route, [])
  })

  await page.goto('/seller/stores/2/pending')
  const cards = page.locator('article').filter({ hasText: 'TALEP #' })
  await expect(cards.first()).toContainText('TALEP #103')
  await page.getByLabel('Onay SLA filtresi').selectOption('URGENT')
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toContainText('TALEP #101')
  await page.getByLabel('Onay SLA filtresi').selectOption('ALL')
  await page.getByLabel('Görünen taleplerin tümünü seç').check()
  await page.getByRole('button', { name: 'Seçilenleri kabul et (3)' }).click()
  const dialog = page.getByRole('dialog', { name: 'Seçilen talepleri kabul et' })
  await dialog.getByRole('button', { name: '3 talebi kabul et' }).click()
  await expect(page.getByRole('alert')).toContainText('2 talep kabul edildi')
  await expect(page.getByRole('alert')).toContainText('1 talep kabul edilemedi: #102')
  expect(approved.sort()).toEqual([101, 102, 103])
})

test('dönem uzatma talebi ayrı sekmede bekler ve satıcı onayıyla sonuçlanır', async ({ page }) => {
  await loginAs(page, 'SELLER')
  let approvedRequestId: number | undefined
  const extensionRequest = {
    id: 41,
    subscriptionId: 11,
    customerName: 'Ayşe Yılmaz',
    menuName: 'Haftalık Menü',
    personCount: 10,
    oldEndDate: '2026-10-30',
    newEndDate: '2026-11-13',
    status: 'PENDING',
    requestedAt: '2026-09-12T10:00:00Z',
  }
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (path.endsWith('/v1/seller/subscriptions/stores/2/extension-requests')) return json(route, [extensionRequest])
    if (path.endsWith('/v1/seller/subscriptions/extension-requests/41/approve')) {
      approvedRequestId = 41
      return json(route, { ...extensionRequest, status: 'APPROVED' })
    }
    if (path.endsWith('/v1/seller/subscriptions/stores/2')) return json(route, pageResult())
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/seller/stores/2/pending')
  await page.getByRole('tab', { name: 'Dönem uzatma (1)' }).click()
  await expect(page.getByText('Ayşe Yılmaz · Haftalık Menü')).toBeVisible()
  await expect(page.getByText('30.10.2026 → 13.11.2026')).toBeVisible()
  await page.getByRole('button', { name: 'Onayla ve uzat' }).click()
  await expect.poll(() => approvedRequestId).toBe(41)
})

test('onay modalı küçük ekrana sığar, odağı yönetir ve Escape ile açan düğmeye döner', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.setViewportSize({ width: 360, height: 800 })
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/v1/payments/methods')) return json(route, [{ id: 7, provider: 'TEST', brand: 'Visa', lastFour: '4242', expiryMonth: 12, expiryYear: 2030, defaultMethod: true, active: true }])
    if (url.includes('/v1/payments')) return json(route, [])
    if (url.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })
  await page.goto('/payment-methods')
  await expect(page.getByLabel('Kart üzerindeki ad')).toBeVisible()
  await expect(page.getByLabel('Kart numarası')).toHaveAttribute('autocomplete', 'cc-number')
  const opener = page.getByRole('button', { name: 'Kartı sil' })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Kartı kaldır' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Kaldır' })).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('iyzico modunda kart bilgisi alınmaz ve güvenli kart yönetim sayfasına yönlendirilir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  let managementRequests = 0
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/payments/configuration')) {
      return json(route, { provider: 'IYZICO', hostedCheckout: true })
    }
    if (url.pathname.endsWith('/v1/payments/methods/management')) {
      managementRequests += 1
      return json(route, {
        sessionId: 77,
        provider: 'IYZICO',
        cardPageUrl: 'https://sandbox-cpp.iyzipay.com/card-management/test',
        expiresAt: '2026-09-12T22:00:00Z',
      })
    }
    if (url.pathname.endsWith('/v1/payments/methods')) return json(route, [])
    if (url.pathname.endsWith('/v1/payments/meal-balance')) {
      return json(route, { availableAmount: 0, currency: 'TRY', recentTransactions: [] })
    }
    if (url.pathname.endsWith('/v1/payments/history')) return json(route, [])
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })
  await page.route('https://sandbox-cpp.iyzipay.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>iyzico güvenli kart yönetimi</title>' }),
  )

  await page.goto('/payment-methods')

  await expect(page.getByLabel('Kart numarası')).toHaveCount(0)
  await page.getByRole('button', { name: 'Kart ekle veya yönet' }).click()
  await expect.poll(() => managementRequests).toBe(1)
  await expect(page).toHaveURL(/sandbox-cpp\.iyzipay\.com\/card-management\/test/)
})

test('teslimat durum penceresi erişilebilir, Escape ile kapanır ve odağı geri verir', async ({ page }) => {
  await loginAs(page, 'SELLER')
  const delivery = { id: 20, subscriptionId: 1, deliveryDate: '2026-09-08', deliveryTime: '12:30', personCount: 8, menuName: 'Kurumsal Menü', customerName: 'Test Müşteri', deliveryAddress: 'Ankara', status: 'IN_TRANSIT' }
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (path.endsWith('/v1/seller/stores/2/deliveries/today')) return json(route, [delivery])
    if (path.endsWith('/v1/seller/stores/2/deliveries/route-plan')) return json(route, { method: '', stops: [] })
    if (path.endsWith('/v1/seller/stores/2/delivery-slots')) return json(route, [])
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/seller/stores/2/daily-orders')
  await expect(page).toHaveURL('/seller/stores/2/operations')
  if ((page.viewportSize()?.width || 0) >= 768) {
    await expect(page.getByRole('link', { name: 'Günlük Operasyon' })).toHaveCount(1)
  }
  await expect(page.getByLabel('Teslimat durumu filtresi')).toBeVisible()
  await expect(page.getByLabel('Teslimat saati filtresi')).toBeVisible()
  await expect(page.getByLabel('Kurye filtresi')).toBeVisible()
  await expect(page.getByLabel('Bölge veya mahalle filtresi')).toBeVisible()
  const opener = page.getByRole('button', { name: 'Teslim et' })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Teslim edildi' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Müşteri teslimat kodu')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('satıcı teslimat konumunu cihazdan alır ve koordinatları gelişmiş alanda tutar', async ({ page }) => {
  await loginAs(page, 'SELLER')
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 39.933365, longitude: 32.859742 } } as GeolocationPosition),
      },
    })
  })
  const delivery = { id: 25, subscriptionId: 1, deliveryDate: '2026-09-08', deliveryTime: '12:30', personCount: 8, menuName: 'Kurumsal Menü', customerName: 'Test Müşteri', deliveryAddress: 'Ankara', status: 'DELIVERY_ATTEMPTED', failureReason: 'Adres kapalı' }
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (path.endsWith('/v1/seller/stores/2/deliveries/today')) return json(route, [delivery])
    if (path.endsWith('/v1/seller/stores/2/deliveries/route-plan')) return json(route, { method: '', stops: [] })
    if (path.endsWith('/v1/seller/stores/2/delivery-slots')) return json(route, [])
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/seller/stores/2/operations')
  await page.getByRole('button', { name: 'Yeniden dene' }).click()
  const dialog = page.getByRole('dialog', { name: 'Yolda' })
  await expect(dialog.getByLabel('Kurye enlemi')).toBeHidden()
  await dialog.getByRole('button', { name: 'Konumumu kullan' }).click()
  await expect(dialog.getByText('Konumunuz teslimat kaydına eklendi.')).toBeVisible()
  await dialog.getByText('Gelişmiş konum bilgileri').click()
  await expect(dialog.getByLabel('Kurye enlemi')).toHaveValue('39.933365')
  await expect(dialog.getByLabel('Kurye boylamı')).toHaveValue('32.859742')
})

test('toplu teslimat güncellemesi onay ister ve kısmi hata sonucunu açıklar', async ({ page }) => {
  await loginAs(page, 'SELLER')
  const deliveries = [20, 21, 22].map(id => ({ id, subscriptionId: id, deliveryDate: '2026-09-08', deliveryTime: '12:30', personCount: 8, menuName: 'Kurumsal Menü', customerName: `Müşteri ${id}`, deliveryAddress: 'Ankara', status: 'SCHEDULED' }))
  const attempted: number[] = []
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (path.endsWith('/v1/seller/stores/2/deliveries/today')) return json(route, deliveries)
    const statusMatch = path.match(/\/deliveries\/(\d+)\/status$/)
    if (statusMatch) {
      const id = Number(statusMatch[1])
      attempted.push(id)
      return id === 21
        ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
        : json(route, { ...deliveries.find(item => item.id === id), status: 'PREPARING' })
    }
    if (path.endsWith('/v1/seller/stores/2/deliveries/route-plan')) return json(route, { method: '', stops: [] })
    if (path.endsWith('/v1/seller/stores/2/delivery-slots')) return json(route, [])
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/seller/stores/2/operations')
  const bulkButton = page.getByRole('button', { name: 'Tümünü hazırlamaya al (3)' })
  await bulkButton.click()
  const dialog = page.getByRole('dialog', { name: 'Toplu teslimat güncellemesi' })
  await expect(dialog).toContainText('3 teslimatı topluca hazırlamaya al')
  await dialog.getByRole('button', { name: 'Vazgeç' }).click()
  expect(attempted).toHaveLength(0)

  await bulkButton.click()
  await dialog.getByRole('button', { name: '3 teslimatı güncelle' }).click()
  await expect(page.getByRole('alert')).toContainText('2 teslimat güncellendi')
  await expect(page.getByRole('alert')).toContainText('1 teslimat güncellenemedi: #21')
  await expect(page.getByRole('button', { name: 'Başarısızları tekrar dene' })).toBeVisible()
  expect(attempted.sort()).toEqual([20, 21, 22])
})

test('günlük operasyon menü porsiyonlarını özetler ve mutfak çıktısı üretir', async ({ page }) => {
  await loginAs(page, 'SELLER')
  const base = { subscriptionId: 1, deliveryDate: '2026-09-08', deliveryTime: '12:30', customerName: 'Test Müşteri', deliveryAddress: 'Ankara', status: 'SCHEDULED' }
  const deliveries = [
    { ...base, id: 30, menuName: 'Ev Menüsü', personCount: 5 },
    { ...base, id: 31, menuName: 'Ev Menüsü', personCount: 3 },
    { ...base, id: 32, menuName: 'Vegan Menü', personCount: 4 },
    { ...base, id: 33, menuName: 'İptal Menü', personCount: 100, status: 'CANCELLED' },
  ]
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', status: 'ACTIVE', temporarilyClosed: false, rating: 5, reviewCount: 1, categories: [], availableDeliveryTimes: [] })
    if (path.endsWith('/v1/seller/stores/2/deliveries/today')) return json(route, deliveries)
    if (path.endsWith('/v1/seller/stores/2/deliveries/route-plan')) return json(route, { method: '', stops: [] })
    if (path.endsWith('/v1/seller/stores/2/delivery-slots')) return json(route, [])
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/seller/stores/2/operations')
  const summary = page.getByRole('heading', { name: 'Bugünün mutfak özeti' }).locator('xpath=ancestor::section')
  await expect(summary).toContainText('12 porsiyon · 3 teslimat')
  await expect(summary).toContainText('Ev Menüsü')
  await expect(summary).toContainText('8 porsiyon · 2 teslimat')
  await expect(summary).toContainText('Vegan Menü')
  await expect(summary).not.toContainText('İptal Menü')

  const popupPromise = page.waitForEvent('popup')
  await summary.getByRole('button', { name: 'Mutfak çıktısı' }).click()
  const popup = await popupPromise
  await expect(popup.locator('body')).toContainText('Günlük Mutfak Listesi')
  await expect(popup.locator('body')).toContainText('12 porsiyon · 3 teslimat')
})

test('müşteri değişiklik talebini teslimat takviminden izler', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/delivery-change-requests')) return json(route, [{ id: 9, subscriptionId: 1, deliveryId: 11, deliveryDate: '2026-09-10', requestType: 'CHANGE', oldDeliveryTime: '12:00', requestedDeliveryTime: '13:00', oldPersonCount: 5, requestedPersonCount: 7, priceDifference: 200, status: 'PENDING', requestedAt: '2026-08-29T12:00:00Z' }])
    if (url.includes('/extension-requests')) return json(route, [])
    if (url.endsWith('/v1/subscriptions/1/events')) return json(route, [])
    if (url.endsWith('/v1/subscriptions/1')) return json(route, { subscription: { id: 1, storeId: 2, storeName: 'Test Mutfağı', menuId: 3, menuName: 'Ev Menüsü', addressId: 4, personCount: 5, pricePerPerson: 100, deliveryTime: '12:00', startDate: '2026-09-10', endDate: '2026-09-14', serviceDayCount: 5, totalAmount: 2500, status: 'ACTIVE', createdAt: '2026-08-20T10:00:00Z' }, deliveries: [{ id: 11, subscriptionId: 1, deliveryDate: '2026-09-10', deliveryTime: '12:00', personCount: 5, menuName: 'Ev Menüsü', customerName: 'Test Kullanıcı', deliveryAddress: 'Ankara', status: 'IN_TRANSIT', courierName: 'Mehmet Kurye', courierPhone: '+905321234567', courierPhoneMasked: '•••• ••• 4567' }], reviewed: false })
    if (url.includes('/v1/payments/subscriptions/1')) return json(route, null)
    if (url.includes('unread-count')) return json(route, { count: 0 })
    if (url.includes('/addresses')) return json(route, [])
    return json(route, pageResult())
  })
  await page.goto('/subscriptions/1')
  await expect(page.getByText('Mehmet Kurye')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mehmet Kurye adlı kuryeyi ara' })).toHaveAttribute('href', 'tel:+905321234567')
  await expect(page.getByText(/•••• ••• 4567/)).toBeVisible()
  await expect(page.getByText('Değişiklik onayı bekliyor')).toBeVisible()
  await page.locator('summary').filter({ hasText: 'Teslimat işlemleri' }).click()
  await expect(page.getByText(/ikinci talep gönderilemez/)).toBeVisible()
  await expect(page.getByText('5 → 7')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
})

test('satıcı değişiklik talebi kutusunda sayaç ve karar alanlarını görür', async ({ page }) => {
  await loginAs(page, 'SELLER')
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/delivery-change-requests')) return json(route, [{ id: 9, subscriptionId: 1, deliveryId: 11, customerName: 'Ahmet Yılmaz', deliveryDate: '2026-09-10', requestType: 'CHANGE', oldDeliveryTime: '12:00', requestedDeliveryTime: '13:00', oldPersonCount: 5, requestedPersonCount: 7, oldAddressId: 3, requestedAddressId: 4, oldAddress: 'Ev · Çankaya / Ankara', requestedAddress: 'Ofis · Etimesgut / Ankara', priceDifference: 200, status: 'PENDING', requestedAt: '2026-08-29T12:00:00Z' }])
    if (url.includes('/unread-count')) return json(route, { count: 0 })
    if (url.includes('/subscriptions/stores/2')) return json(route, pageResult())
    if (url.endsWith('/v1/seller/stores/2')) return json(route, { id: 2, name: 'Test Mutfağı', minPersonCount: 1, status: 'ACTIVE', rating: 5, reviewCount: 1, temporarilyClosed: false, categories: [], availableDeliveryTimes: [] })
    return json(route, [])
  })
  await page.goto('/seller/stores/2/pending')
  await page.getByRole('tab', { name: 'Teslimat talepleri (1)' }).click()
  await expect(page.getByText('Teslimat işlem talepleri')).toBeVisible()
  await expect(page.getByText('Ahmet Yılmaz')).toBeVisible()
  await expect(page.getByText(/Kişi:/)).toContainText('5 → 7')
  await expect(page.getByText(/Adres:.*Ev.*Ofis/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
})

test('admin şikâyet karar merkezine yalnız admin rolü erişir', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/v1/admin/complaints')) return json(route, pageResult([{ id: 7, reason: 'Eksik teslimat', description: 'Ürün eksikti', status: 'OPEN', createdAt: '2026-08-29T12:00:00Z', customer: { firstName: 'Ayşe', lastName: 'Yılmaz' }, store: { name: 'Test Mutfağı' } }]))
    if (url.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })
  await page.goto('/admin/complaints')
  await expect(page.getByRole('heading', { name: 'Şikâyet ve anlaşmazlıklar' })).toBeVisible()
  await page.getByText(/#7 · Eksik teslimat/).click()
  await expect(page.getByText('Nihai karar ve telafi')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
})

test('admin destek talebini yanıtlar ve uygulama bildirimi oluşturur', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  let updatePayload: Record<string, unknown> | undefined
  const supportRequest = {
    id: 14, userId: 7, accountRole: 'CUSTOMER', contactName: 'Ayşe Yılmaz',
    contactEmail: 'ayse@example.com', contactPhone: '05550000000', category: 'PAYMENT',
    subject: 'Ödeme ekranı sorunu', message: 'Kartımı eklerken beklenmeyen bir hata görüyorum.',
    status: 'NEW', createdAt: '2026-09-15T10:00:00Z',
  }
  await page.route('**/api/**', async route => {
    const url = route.request().url()
    if (url.includes('/v1/admin/support-requests/14') && route.request().method() === 'PUT') {
      updatePayload = route.request().postDataJSON()
      return json(route, { ...supportRequest, ...updatePayload, adminResponse: updatePayload?.response, respondedAt: '2026-09-15T11:00:00Z' })
    }
    if (url.includes('/v1/admin/support-requests')) return json(route, pageResult([supportRequest]))
    if (url.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/admin/support-requests')
  await page.getByRole('button', { name: /#14.*Ödeme ekranı sorunu/s }).click()
  await page.getByLabel('İşlem durumu').selectOption('ANSWERED')
  await page.getByLabel('Kullanıcıya yanıt').fill('Kartınızı kaldırıp yeniden ekleyerek deneyebilirsiniz.')
  await page.getByRole('button', { name: 'Talebi güncelle' }).click()

  await expect(page.getByText(/kullanıcıya bildirim gönderildi/)).toBeVisible()
  expect(updatePayload).toEqual({ status: 'ANSWERED', response: 'Kartınızı kaldırıp yeniden ekleyerek deneyebilirsiniz.' })
})

test('müşteri admin ekranına yönlendirilemez', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => json(route, route.request().url().includes('unread-count') ? { count: 0 } : []))
  await page.goto('/admin/complaints')
  await expect(page).toHaveURL('/')
})

test('müşteri satıcı ekranına yönlendirilemez', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => json(route, route.request().url().includes('unread-count') ? { count: 0 } : []))
  await page.goto('/seller/dashboard')
  await expect(page).toHaveURL('/')
})

test('satıcı admin ekranına yönlendirilmez ve kendi paneline döner', async ({ page }) => {
  await loginAs(page, 'SELLER')
  await page.route('**/api/**', route => json(route, route.request().url().includes('unread-count') ? { count: 0 } : []))
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL('/seller/dashboard')
})

test('admin satıcı ekranına yönlendirilmez ve kendi paneline döner', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  await page.route('**/api/**', route => json(route, route.request().url().includes('unread-count') ? { count: 0 } : []))
  await page.goto('/seller/dashboard')
  await expect(page).toHaveURL('/admin/dashboard')
})

test('admin gerçek operasyon görev sayısını görür ve risk kaydına ulaşır', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/v1/admin/operations/summary')) return json(route, {
      openComplaints: 1, slaComplaints: 1, delayedDeliveries: 0,
      failedPayments: 0, paymentReviewRequired: false, pendingSubscriptions: 1,
      openRiskCases: 2, taskCount: 4, generatedAt: '2026-09-02T12:00:00Z',
      alerts: [{ type: 'RISK_CASE', id: 8, title: 'Risk incelemesi bekliyor', detail: 'Aynı ödeme aracı birden fazla hesapta kullanıldı.' }],
    })
    if (url.includes('/v1/admin/users') || url.includes('/v1/admin/stores')) return json(route, pageResult())
    return json(route, [])
  })
  await page.goto('/admin/dashboard')
  await expect(page.locator('a:visible[aria-label="4 açık operasyon görevi"]')).toBeVisible()
  await expect(page.getByText('Risk incelemesi bekliyor')).toBeVisible()
  await expect(page.getByText('Risk incelemesi').locator('..').getByText('2')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Kaydı aç' })).toHaveAttribute('href', '/admin/risk')
})

test('admin audit kayıtlarını URL ile kalıcı filtreler ve Türkçe adlarla inceler', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  let auditRequest = ''
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/v1/admin/operations/summary')) return json(route, { openComplaints: 0, slaComplaints: 0, delayedDeliveries: 0, failedPayments: 0, paymentReviewRequired: false, pendingSubscriptions: 0, openRiskCases: 0, taskCount: 0, alerts: [], generatedAt: '2026-09-02T12:00:00Z' })
    if (url.includes('/v1/admin/audit-logs')) {
      auditRequest = url
      return json(route, pageResult([{ id: 11, action: 'ADMIN_PAYMENT_REFUND', entityType: 'PAYMENT', actorId: '9', actorRole: 'ADMIN', oldValue: '', newValue: '{"reason":"Test"}', correlationId: 'trace-1', timestamp: '2026-09-02T12:00:00Z' }]))
    }
    return json(route, [])
  })
  await page.goto('/admin/audit-search?actorId=9&entityType=PAYMENT&action=refund')
  await expect(page.getByText('Ödeme iadesi başlatıldı')).toBeVisible()
  await expect(page.getByText(/Ödeme · İşlemi yapan kullanıcı #9/)).toBeVisible()
  expect(auditRequest).toContain('actorId=9')
  expect(auditRequest).toContain('entityType=PAYMENT')
  expect(auditRequest).toContain('action=refund')
})

test('admin kritik kullanıcı işleminde etkiyi görür ve açıkça onaylar', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/v1/admin/operations/summary')) return json(route, { openComplaints: 0, slaComplaints: 0, delayedDeliveries: 0, failedPayments: 0, paymentReviewRequired: false, pendingSubscriptions: 0, openRiskCases: 0, taskCount: 0, alerts: [], generatedAt: '2026-09-02T12:00:00Z' })
    if (url.endsWith('/v1/admin/users/5')) return json(route, { user: { id: 5, email: 'user@test.local', firstName: 'Test', lastName: 'Müşteri', phone: '5550000000', role: 'CUSTOMER', active: true, emailVerified: true, createdAt: '2026-09-01T10:00:00Z' }, addresses: [], subscriptions: [], complaints: [], audits: [] })
    if (url.includes('/v1/account/reauthenticate')) return json(route, { token: 'recent-token' })
    if (url.includes('/v1/admin/users/5/deactivate')) return json(route, { id: 5, active: false })
    return json(route, [])
  })
  await page.goto('/admin/users/5')
  await page.getByRole('button', { name: 'Pasife al' }).click()
  const dialog = page.getByRole('dialog', { name: 'Kullanıcıyı pasife al' })
  await expect(dialog.getByText('Kullanıcının yeni oturum açması engellenir.')).toBeVisible()
  await dialog.getByLabel('İşlem gerekçesi').fill('Hesap güvenlik incelemesi')
  await dialog.getByLabel('Parolanız').fill('password')
  await expect(dialog.getByRole('button', { name: 'Pasife al' })).toBeDisabled()
  await dialog.getByRole('checkbox').check()
  await expect(dialog.getByRole('button', { name: 'Pasife al' })).toBeEnabled()
})

test('adres formu il, ilçe ve mahalle seçimlerini birbirine bağlı getirir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.includes('/v1/locations/provinces')) return json(route, [{ id: 6, name: 'Ankara' }, { id: 35, name: 'İzmir' }])
    if (url.includes('/v1/locations/districts?provinceId=6')) return json(route, [{ id: 111, name: 'Yenimahalle' }])
    if (url.includes('/v1/locations/neighborhoods?districtId=111')) return json(route, [{ id: 501, name: 'İvedik OSB' }])
    if (url.includes('/v1/addresses')) return json(route, [])
    if (url.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/addresses')
  await page.getByRole('button', { name: /yeni adres/i }).click()
  await expect(page.getByLabel('İlçe')).toBeDisabled()
  await page.getByLabel('İl', { exact: true }).selectOption({ label: 'Ankara' })
  await expect(page.getByLabel('İlçe')).toBeEnabled()
  await expect(page.getByLabel('İlçe').locator('option')).toHaveText(['İlçe seçin', 'Yenimahalle'])
  await page.getByLabel('İlçe').selectOption({ label: 'Yenimahalle' })
  await expect(page.getByLabel('Mahalle')).toBeEnabled()
  await expect(page.getByLabel('Mahalle').locator('option')).toHaveText(['Mahalle seçin', 'İvedik OSB'])
})

test('konum servisi hata verirse adres formunda açık hata gösterilir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => {
    if (route.request().url().includes('/v1/locations/provinces')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    if (route.request().url().includes('/v1/addresses')) return json(route, [])
    if (route.request().url().includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/addresses')
  await page.getByRole('button', { name: /yeni adres/i }).click()
  await expect(page.getByText(/konum seçenekleri yüklenemedi/i)).toBeVisible()
})

test('müşteri kayıtlı adreslerinden varsayılan teslimat adresini değiştirebilir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  const addresses = [
    { id: 10, title: 'Ev', city: 'Ankara', district: 'Yenimahalle', neighborhood: 'İvedik OSB', fullAddress: '1111. Sokak, No: 1', latitude: 39.9334, longitude: 32.8597, defaultAddress: true },
    { id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', neighborhood: 'Bağlıca', fullAddress: '2222. Sokak, No: 2', latitude: 39.9400, longitude: 32.8600, defaultAddress: false },
  ]
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.endsWith('/v1/addresses') && route.request().method() === 'GET') return json(route, addresses)
    if (url.endsWith('/v1/addresses/11/default')) {
      addresses.forEach(address => { address.defaultAddress = address.id === 11 })
      return json(route, addresses[1])
    }
    if (url.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/addresses')
  await expect(page.getByText('Ev', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Varsayılan yap' }).click()
  await expect(page.getByText('Varsayılan', { exact: true })).toBeVisible()
  await expect(page.locator('article').filter({ has: page.getByText('Ofis', { exact: true }) })).toContainText('Varsayılan')
})

test('aktif teslimat adresi ana sayfa, keşif ve abonelikte aynı adresle kullanılır', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => localStorage.setItem('mealflex-active-address-id', '11'))
  const requestedAddressIds: string[] = []
  const address = { id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', neighborhood: 'Bağlıca', fullAddress: '2222. Sokak, No: 2', latitude: 39.9400, longitude: 32.8600, defaultAddress: true }
  const store = { id: 2, name: 'Ofis Mutfağı', minPersonCount: 1, effectiveMinPersonCount: 1, status: 'ACTIVE', rating: 4.8, reviewCount: 12, temporarilyClosed: false, categories: [], availableDeliveryTimes: ['12:00'], nextAvailableDeliveryDate: '2026-09-10', menus: [] }
  const menu = { id: 3, storeId: 2, name: 'Öğle Menüsü', pricePerPerson: 150, dietTags: [], allergens: [], active: true, items: [] }
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [address])
    if (url.pathname.endsWith('/v1/stores')) {
      requestedAddressIds.push(url.searchParams.get('addressId') || '')
      return json(route, pageResult([]))
    }
    if (url.pathname.endsWith('/v1/stores/2')) {
      requestedAddressIds.push(url.searchParams.get('addressId') || '')
      return json(route, store)
    }
    if (url.pathname.endsWith('/v1/stores/2/menus/3')) return json(route, menu)
    if (url.pathname.endsWith('/v1/stores/2/menus/3/schedule')) return json(route, {})
    if (url.pathname.endsWith('/v1/payment-methods')) return json(route, [])
    if (url.pathname.endsWith('/v1/stores/discovery-metadata')) return json(route, { categories: [], dietTags: [], allergens: [] })
    if (url.pathname.endsWith('/v1/stores/recent')) return json(route, [])
    if (url.pathname.includes('/v1/subscriptions')) return json(route, pageResult())
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/')
  await expect(page.getByRole('main').getByText(/Ofis.*Etimesgut/)).toBeVisible()
  await page.goto('/stores')
  await expect(page.getByText('Size hizmet veren işletmeler')).toBeVisible()
  await page.goto('/subscribe?storeId=2&menuId=3')
  await expect(page.getByRole('heading', { name: 'Yeni abonelik talebi' })).toBeVisible()
  expect(requestedAddressIds).toContain('11')
  expect(requestedAddressIds.filter(value => value === '11').length).toBeGreaterThanOrEqual(3)
})

test('adresi olmayan müşteri abonelik ekranından adres eklemeye yönlendirilir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [])
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/subscribe?storeId=2&menuId=3')
  await expect(page.getByRole('heading', { name: 'Önce teslimat adresi ekleyin' })).toBeVisible()
  await page.getByRole('link', { name: 'Adres ekle' }).click()
  await expect(page).toHaveURL(/\/addresses$/)
})

test('keşif kategori filtresi URL ve adres parametresiyle çalışır, işletme favoriye eklenir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => localStorage.setItem('mealflex-active-address-id', '11'))
  const requests: URL[] = []
  const address = { id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', fullAddress: 'Test adresi', latitude: 39.9400, longitude: 32.8600, defaultAddress: true }
  const store = { id: 2, name: 'Vegan Ofis Mutfağı', minPersonCount: 1, status: 'ACTIVE', rating: 4.8, reviewCount: 12, temporarilyClosed: false, categories: ['VEGAN'], dietTags: ['VEGAN'], allergens: [], availableDeliveryTimes: [], distanceKm: 2.4 }
  let favorite = false
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [address])
    if (url.pathname.endsWith('/v1/stores/discovery-metadata')) return json(route, { categories: ['VEGAN'], dietTags: ['VEGAN'], allergens: ['GLUTEN'] })
    if (url.pathname.endsWith('/v1/stores')) { requests.push(url); return json(route, pageResult([store])) }
    if (url.pathname.endsWith('/v1/stores/recent')) return json(route, [])
    if (url.pathname.endsWith('/v1/favorites/check/2')) return json(route, { isFavorite: favorite })
    if (url.pathname.endsWith('/v1/favorites/2') && route.request().method() === 'POST') { favorite = true; return route.fulfill({ status: 204 }) }
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/stores?category=VEGAN')
  await expect(page.getByText('Vegan Ofis Mutfağı')).toBeVisible()
  await expect(page).toHaveURL(/category=VEGAN/)
  await expect.poll(() => requests.some(url => url.searchParams.get('addressId') === '11' && url.searchParams.get('category') === 'VEGAN' && !url.searchParams.has('dietTag'))).toBeTruthy()
  await page.getByRole('button', { name: 'Favorilere ekle' }).click()
  await expect(page.getByRole('button', { name: 'Favorilerden çıkar' })).toBeVisible()
})

test('işletme detayı menü, alerjen, görsel, program ve fiyat geçerliliğini gösterir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => localStorage.setItem('mealflex-active-address-id', '11'))
  await page.route('https://example.test/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect width="4" height="3" fill="#eee"/></svg>',
    }),
  )
  const address = { id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', fullAddress: 'Test adresi', latitude: 39.94, longitude: 32.86, defaultAddress: true }
  const store = { id: 2, name: 'Test Mutfağı', minPersonCount: 1, effectiveMinPersonCount: 1, status: 'ACTIVE', rating: 4.8, reviewCount: 12, temporarilyClosed: false, categories: [], availableDeliveryTimes: ['12:00'], coverImageUrl: 'https://example.test/store.jpg', logoUrl: 'https://example.test/logo.jpg' }
  const menu = { id: 3, storeId: 2, name: 'Vegan Öğle Menüsü', description: 'Taze günlük menü', pricePerPerson: 175, priceEffectiveFrom: '2099-09-01', imageUrl: 'https://example.test/menu.jpg', dietTags: ['VEGAN'], allergens: ['GLUTEN'], allergenInfo: 'İz miktarda süt içerebilir', active: true, items: [{ id: 4, name: 'Mercimek Çorbası', imageUrl: 'https://example.test/item.jpg', sortOrder: 0 }] }
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [address])
    if (url.pathname.endsWith('/v1/stores/2')) return json(route, store)
    if (url.pathname.endsWith('/v1/stores/2/menus')) return json(route, [menu])
    if (url.pathname.endsWith('/v1/stores/2/menus/3/schedule')) return json(route, { MONDAY: [{ id: 1, itemName: 'Mercimek Çorbası', sortOrder: 0 }] })
    if (url.pathname.endsWith('/v1/stores/2/business-hours')) return json(route, [{ id: 1, dayOfWeek: 'MONDAY', openTime: '08:00', closeTime: '18:00', open: true }])
    if (url.pathname.endsWith('/v1/reviews/store/2')) return json(route, pageResult())
    if (url.pathname.endsWith('/v1/favorites/check/2')) return json(route, { isFavorite: false })
    if (url.pathname.endsWith('/v1/stores/2/view')) return route.fulfill({ status: 204 })
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/stores/2')
  await expect(page.getByRole('heading', { name: 'Vegan Öğle Menüsü' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Vegan Öğle Menüsü' })).toHaveAttribute('loading', 'lazy')
  await expect(page.getByText('Vegan', { exact: true })).toBeVisible()
  await expect(page.getByText('İçerir: Gluten')).toBeVisible()
  await expect(page.getByText('Ek bilgi: İz miktarda süt içerebilir')).toBeVisible()
  await expect(page.getByText(/Fiyat geçerliliği:.*2099/)).toBeVisible()
  await expect(page.getByText('Menüde yer alabilecek yemek çeşitleri')).toBeVisible()
  await expect(page.getByText('Mercimek Çorbası', { exact: true })).toBeVisible()
})

test('abonelik formu beş hizmet günü, kupon ve ödeme yöntemiyle aynı toplamı kaydeder', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => localStorage.setItem('mealflex-active-address-id', '11'))
  const formatDate = (date: Date) => date.toISOString().slice(0, 10)
  const startDate = formatDate(new Date(Date.now() + 3 * 86400000))
  const endDate = formatDate(new Date(Date.now() + 7 * 86400000))
  const address = { id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', fullAddress: 'Test adresi', latitude: 39.94, longitude: 32.86, defaultAddress: true }
  const store = { id: 2, name: 'Test Mutfağı', minPersonCount: 3, effectiveMinPersonCount: 3, status: 'ACTIVE', rating: 4.8, reviewCount: 12, temporarilyClosed: false, categories: [], availableDeliveryTimes: ['12:30', '13:30'], nextAvailableDeliveryDate: startDate }
  const menu = { id: 3, storeId: 2, name: 'Ev Menüsü', pricePerPerson: 120, active: true, dietTags: [], allergens: [], items: [] }
  const paymentMethod = { id: 90, provider: 'TEST', brand: 'Visa', lastFour: '4242', expiryMonth: 12, expiryYear: 2030, defaultMethod: true, active: true }
  const previewRequests: Record<string, unknown>[] = []
  let createRequest: Record<string, unknown> | undefined
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [address])
    if (url.pathname.endsWith('/v1/stores/2')) return json(route, store)
    if (url.pathname.endsWith('/v1/stores/2/delivery-times')) return json(route, ['12:30', '13:30'])
    if (url.pathname.endsWith('/v1/stores/2/menus/3')) return json(route, menu)
    if (url.pathname.endsWith('/v1/stores/2/menus/3/schedule')) return json(route, {})
    if (url.pathname.endsWith('/v1/payments/configuration')) return json(route, { provider: 'MOCK', hostedCheckout: false })
    if (url.pathname.endsWith('/v1/payments/methods')) return json(route, [paymentMethod])
    if (url.pathname.endsWith('/v1/subscriptions/preview')) {
      const body = route.request().postDataJSON() as Record<string, unknown>
      previewRequests.push(body)
      return json(route, { storeId: 2, menuId: 3, distanceKm: 2.1, minimumPersonCount: 3, serviceDayCount: 5, serviceDates: [startDate], excludedDates: [], pricePerPerson: 120, priceEffectiveFrom: startDate, totalAmount: body.couponCode === 'HOSGELDIN' ? 1_620 : 1_800 })
    }
    if (url.pathname.endsWith('/v1/subscriptions') && route.request().method() === 'POST') {
      createRequest = route.request().postDataJSON() as Record<string, unknown>
      return json(route, { id: 77 })
    }
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/subscribe?storeId=2&menuId=3&addressId=11')
  await expect(page.getByText('Bu adres için minimum 3 kişi.')).toBeVisible()
  await page.getByRole('button', { name: /Devam Et/i }).click()
  await page.getByLabel('Başlangıç tarihi').fill(startDate)
  await page.getByLabel('Bitiş tarihi').fill(endDate)
  await page.getByRole('button', { name: /Devam Et/i }).click()
  await page.getByLabel('Uygun teslimat saati').selectOption('13:30')
  await page.getByRole('button', { name: /Devam Et/i }).click()
  await expect(page.getByText('Gerçek hizmet günü')).toBeVisible()
  await expect(page.getByText('5 gün', { exact: true })).toBeVisible()
  await page.getByLabel(/Kupon veya kurumsal kod/i).fill('hosgeldin')
  await expect.poll(() => previewRequests.some(request => request.couponCode === 'HOSGELDIN')).toBeTruthy()
  await expect(page.getByText('1.620 ₺').first()).toBeVisible()
  await page.getByText(/Mesafeli satış ve abonelik koşullarını okudum/i).click()
  await page.getByRole('button', { name: /^(Abonelik Talebini Gönder|Talebi gönder)$/i }).click()
  await expect(page.getByRole('heading', { name: 'Talebiniz satıcıya gönderildi' })).toBeVisible()
  expect(createRequest).toMatchObject({ storeId: 2, menuId: 3, addressId: 11, personCount: 3, deliveryTime: '13:30', startDate, endDate, paymentMethodId: 90, couponCode: 'HOSGELDIN', commercialTermsAccepted: true })
})

test('iyzico kartı olmayan müşteri abonelik talebi gönderemez', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.addInitScript(() => localStorage.setItem('mealflex-active-address-id', '11'))
  const formatDate = (date: Date) => date.toISOString().slice(0, 10)
  const startDate = formatDate(new Date(Date.now() + 3 * 86400000))
  const endDate = formatDate(new Date(Date.now() + 7 * 86400000))
  const address = { id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', fullAddress: 'Test adresi', latitude: 39.94, longitude: 32.86, defaultAddress: true }
  const store = { id: 2, name: 'Test Mutfağı', minPersonCount: 1, effectiveMinPersonCount: 1, status: 'ACTIVE', rating: 4.8, reviewCount: 12, temporarilyClosed: false, categories: [], availableDeliveryTimes: ['12:30'], nextAvailableDeliveryDate: startDate }
  const menu = { id: 3, storeId: 2, name: 'Ev Menüsü', pricePerPerson: 120, active: true, dietTags: [], allergens: [], items: [] }
  let createRequests = 0
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [address])
    if (url.pathname.endsWith('/v1/stores/2')) return json(route, store)
    if (url.pathname.endsWith('/v1/stores/2/delivery-times')) return json(route, ['12:30'])
    if (url.pathname.endsWith('/v1/stores/2/menus/3')) return json(route, menu)
    if (url.pathname.endsWith('/v1/payments/configuration')) return json(route, { provider: 'IYZICO', hostedCheckout: true })
    if (url.pathname.endsWith('/v1/payments/methods')) return json(route, [])
    if (url.pathname.endsWith('/v1/subscriptions/preview')) {
      return json(route, { storeId: 2, menuId: 3, distanceKm: 2.1, minimumPersonCount: 1, serviceDayCount: 5, serviceDates: [startDate], excludedDates: [], pricePerPerson: 120, priceEffectiveFrom: startDate, totalAmount: 600 })
    }
    if (url.pathname.endsWith('/v1/subscriptions') && route.request().method() === 'POST') {
      createRequests += 1
      return json(route, { id: 77 })
    }
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/subscribe?storeId=2&menuId=3&addressId=11')
  await page.getByRole('button', { name: /Devam Et/i }).click()
  await page.getByLabel('Başlangıç tarihi').fill(startDate)
  await page.getByLabel('Bitiş tarihi').fill(endDate)
  await page.getByRole('button', { name: /Devam Et/i }).click()
  await page.getByLabel('Uygun teslimat saati').selectOption('12:30')
  await page.getByRole('button', { name: /Devam Et/i }).click()

  await expect(page.getByText('Kayıtlı kartınız bulunmuyor')).toBeVisible()
  await expect(page.getByRole('link', { name: 'iyzico ile kart ekle' })).toHaveAttribute('href', '/payment-methods')
  await expect(page.getByRole('button', { name: /^(Abonelik Talebini Gönder|Talebi gönder)$/i })).toBeDisabled()
  expect(createRequests).toBe(0)
})

test('ödeme bekleyen müşteri iyzico güvenli ödeme sayfasına yönlendirilir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  const subscription = { id: 1, storeId: 2, storeName: 'Test Mutfağı', menuId: 3, menuName: 'Ev Menüsü', addressId: 11, addressTitle: 'Ofis', deliveryAddress: 'Test adresi', personCount: 3, pricePerPerson: 120, deliveryTime: '12:30', startDate: '2099-09-01', endDate: '2099-09-05', serviceDayCount: 5, totalAmount: 1800, status: 'PAYMENT_PENDING', approvedAt: '2099-08-21T10:00:00Z', createdAt: '2099-08-20T10:00:00Z' }
  let checkoutStarted = false
  await page.route('https://sandbox-api.iyzipay.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>iyzico güvenli ödeme</h1>' }))
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/subscriptions/1')) return json(route, { subscription, deliveries: [], reviewed: false })
    if (url.pathname.endsWith('/v1/subscriptions/1/events')) return json(route, [])
    if (url.pathname.endsWith('/v1/subscriptions/1/extension-requests')) return json(route, [])
    if (url.pathname.endsWith('/v1/subscriptions/1/delivery-change-requests')) return json(route, [])
    if (url.pathname.endsWith('/v1/payments/subscriptions/1/checkout') && route.request().method() === 'POST') {
      checkoutStarted = true
      return json(route, { sessionId: 91, subscriptionId: 1, provider: 'IYZICO', paymentPageUrl: 'https://sandbox-api.iyzipay.com/checkout/form', expiresAt: '2099-08-21T10:30:00Z' })
    }
    if (url.pathname.endsWith('/v1/payments/subscriptions/1')) return json(route, null)
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/subscriptions/1')
  await page.getByRole('button', { name: 'Güvenli ödemeye geç' }).click()

  await expect.poll(() => checkoutStarted).toBeTruthy()
  await expect(page).toHaveURL('https://sandbox-api.iyzipay.com/checkout/form')
})

test('müşteri abonelik listesindeki her yaşam döngüsü durumunu doğru görür', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  const statuses = [
    ['PENDING_APPROVAL', 'Onay bekliyor'],
    ['APPROVED', 'Onaylandı'],
    ['ACTIVE', 'Devam ediyor'],
    ['COMPLETED', 'Tamamlandı'],
    ['REJECTED', 'Reddedildi'],
    ['CANCELLED', 'İptal edildi'],
  ] as const
  const subscriptions = statuses.map(([status], index) => ({ id: index + 1, storeId: 2, storeName: 'Test Mutfağı ' + (index + 1), menuId: 3, menuName: 'Ev Menüsü', addressId: 11, personCount: 3, pricePerPerson: 120, deliveryTime: '12:30', startDate: '2099-09-01', endDate: '2099-09-05', serviceDayCount: 5, totalAmount: 1800, status, createdAt: '2099-08-20T10:00:00Z' }))
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/subscriptions')) return json(route, pageResult(subscriptions))
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [])
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/subscriptions')
  for (const [, label] of statuses) await expect(page.getByText(label, { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Aboneliği yenile' })).toBeVisible()
})

test('tamamlanan abonelik bildirimi ayrıntıya gider ve yenileme bilgilerini taşır', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  const subscription = { id: 1, storeId: 2, storeName: 'Test Mutfağı', menuId: 3, menuName: 'Ev Menüsü', addressId: 11, addressTitle: 'Ofis', deliveryAddress: 'Test adresi', personCount: 3, pricePerPerson: 120, deliveryTime: '12:30', startDate: '2099-09-01', endDate: '2099-09-05', serviceDayCount: 5, totalAmount: 1800, status: 'COMPLETED', createdAt: '2099-08-20T10:00:00Z', completedAt: '2099-09-06T12:00:00Z' }
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/notifications')) return json(route, pageResult([{ id: 9, title: 'Aboneliğiniz Tamamlandı', message: 'Test Mutfağı aboneliğiniz tamamlandı.', read: false, createdAt: '2099-09-06T12:00:00Z', referenceType: 'SUBSCRIPTION', referenceId: 1 }]))
    if (url.pathname.endsWith('/v1/notifications/9/read')) return route.fulfill({ status: 204 })
    if (url.pathname.endsWith('/v1/subscriptions/1')) return json(route, { subscription, deliveries: [], reviewed: true })
    if (url.pathname.includes('/delivery-change-requests')) return json(route, [])
    if (url.pathname.endsWith('/v1/subscriptions/1/events')) return json(route, [])
    if (url.pathname.includes('/v1/payments/subscriptions/1')) return json(route, null)
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [])
    if (url.pathname.includes('unread-count')) return json(route, { count: 1 })
    return json(route, [])
  })

  await page.goto('/notifications')
  await page.getByRole('button', { name: /Aboneliğiniz Tamamlandı/ }).click()
  await expect(page).toHaveURL('/subscriptions/1')
  const renew = page.getByRole('link', { name: 'Yenile' })
  await expect(renew).toBeVisible()
  await expect(renew).toHaveAttribute('href', '/subscribe?storeId=2&menuId=3&addressId=11&renewFrom=1')
})

test('teslimat değişikliği kararı bildirimi abonelik ayrıntısına yönlendirir', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/notifications')) return json(route, pageResult([{ id: 10, title: 'Teslimat değişikliği onaylandı', message: 'Teslimat saati değişikliği satıcı tarafından onaylandı.', read: false, createdAt: '2099-09-06T12:00:00Z', referenceType: 'DELIVERY_CHANGE_REQUEST', referenceId: 1 }]))
    if (url.pathname.endsWith('/v1/notifications/10/read')) return route.fulfill({ status: 204 })
    if (url.pathname.includes('unread-count')) return json(route, { count: 1 })
    return json(route, [])
  })

  await page.goto('/notifications')
  await page.getByRole('button', { name: /Teslimat değişikliği onaylandı/ }).click()
  await expect(page).toHaveURL('/subscriptions/1')
})

test('ödeme geçmişi eski API yanıtında eksik firma ve tarih alanlarıyla çökmez', async ({ page }) => {
  await loginAs(page, 'CUSTOMER')
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/v1/payments/history')) return json(route, [{
      id: 10,
      subscriptionId: 4,
      status: 'SUCCEEDED',
      currency: 'TRY',
      grossAmount: 1000,
      balanceAmount: 0,
      cardAmount: 1000,
      campaignContribution: 0,
      commissionAmount: 0,
      refundedAmount: 0,
      netAmount: 1000,
      cardLabel: 'Mastercard •••• 1234',
      createdAt: '2026-09-11T09:00:00Z',
    }])
    if (path.endsWith('/v1/payments/meal-balance')) return json(route, {
      availableAmount: 0,
      currency: 'TRY',
      recentTransactions: [],
    })
    if (path.endsWith('/v1/payments/methods')) return json(route, [])
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/payments')

  await expect(page.getByText('Abonelik #4')).toBeVisible()
  await expect(page.getByText('Hizmet tarihleri henüz belirlenmedi')).toBeVisible()
  await expect(page.getByText('Mastercard •••• 1234')).toBeVisible()
})

async function openDeliveryChangeScenario(page: Page) {
  await loginAs(page, 'CUSTOMER')
  const deliveryDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  const address = { id: 11, title: 'Ofis', city: 'Ankara', district: 'Etimesgut', fullAddress: 'Test adresi', latitude: 39.94, longitude: 32.86, defaultAddress: true }
  const subscription = { id: 1, storeId: 2, storeName: 'Test Mutfağı', menuId: 3, menuName: 'Ev Menüsü', addressId: 11, addressTitle: 'Ofis', deliveryAddress: 'Test adresi', personCount: 5, pricePerPerson: 50, deliveryTime: '12:30', startDate: deliveryDate, endDate: deliveryDate, serviceDayCount: 1, totalAmount: 250, status: 'ACTIVE', createdAt: '2099-08-20T10:00:00Z' }
  const delivery = { id: 11, subscriptionId: 1, deliveryDate, deliveryTime: '12:30', personCount: 5, menuName: 'Ev Menüsü', customerName: 'Test Kullanıcı', deliveryAddress: 'Test adresi', addressId: 11, menuId: 3, status: 'SCHEDULED' }
  const changes: Record<string, unknown>[] = []
  let requestBody: Record<string, unknown> | undefined
  let cancellationRequested = false
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/addresses')) return json(route, [address])
    if (url.pathname.endsWith('/v1/subscriptions/1')) return json(route, { subscription, deliveries: [delivery], reviewed: true })
    if (url.pathname.endsWith('/v1/subscriptions/1/events')) return json(route, [])
    if (url.pathname.endsWith('/v1/subscriptions/1/delivery-change-requests')) return json(route, changes)
    if (url.pathname.endsWith('/v1/subscriptions/1/deliveries/11/change')) {
      requestBody = route.request().postDataJSON() as Record<string, unknown>
      changes.push({ id: 9, subscriptionId: 1, deliveryId: 11, deliveryDate, requestType: 'CHANGE', oldDeliveryTime: '12:30', requestedDeliveryTime: requestBody.deliveryTime, oldPersonCount: 5, requestedPersonCount: requestBody.personCount, priceDifference: Number(requestBody.personCount || 5) === 7 ? 100 : 0, status: 'PENDING', requestedAt: '2099-08-20T10:00:00Z' })
      return json(route, changes[0])
    }
    if (url.pathname.endsWith('/v1/subscriptions/1/deliveries/11/cancel')) {
      cancellationRequested = true
      changes.push({ id: 10, subscriptionId: 1, deliveryId: 11, deliveryDate, requestType: 'CANCEL', oldDeliveryTime: '12:30', requestedDeliveryTime: '12:30', oldPersonCount: 5, requestedPersonCount: 5, priceDifference: -250, status: 'PENDING', requestedAt: '2099-08-20T10:00:00Z' })
      return json(route, changes[0])
    }
    if (url.pathname.includes('/v1/payments/subscriptions/1')) return json(route, null)
    if (url.pathname.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })
  await page.goto('/subscriptions/1')
  await page.locator('summary').filter({ hasText: 'Teslimat işlemleri' }).click()
  await page.getByRole('button', { name: /teslimatı$/i }).click()
  return { getRequestBody: () => requestBody, wasCancellationRequested: () => cancellationRequested }
}

test('yalnız teslimat saati değiştiğinde satıcı onay talebi gönderilir', async ({ page }) => {
  const scenario = await openDeliveryChangeScenario(page)
  await page.getByRole('button', { name: /Saat veya kişi sayısını değiştir/i }).click()
  await page.getByLabel('Teslimat saati', { exact: true }).selectOption('13:30')
  await page.getByRole('button', { name: 'Talep gönder', exact: true }).click()
  await expect(page.getByText(/Değişiklik talebiniz satıcı onayına gönderildi/)).toBeVisible()
  expect(scenario.getRequestBody()).toMatchObject({ deliveryTime: '13:30', personCount: 5 })
  await expect(page.getByText('Değişiklik onayı bekliyor')).toBeVisible()
  await expect(page.getByRole('button', { name: /talep onayı bekleniyor/i }).first()).toBeDisabled()
})

test('yalnız kişi sayısı değiştiğinde fiyat farkıyla satıcı onay talebi gönderilir', async ({ page }) => {
  const scenario = await openDeliveryChangeScenario(page)
  await page.getByRole('button', { name: /Saat veya kişi sayısını değiştir/i }).click()
  await page.getByLabel('Kişi sayısı', { exact: true }).selectOption('7')
  await page.getByRole('button', { name: 'Talep gönder', exact: true }).click()
  await expect(page.getByText(/Değişiklik talebiniz satıcı onayına gönderildi/)).toBeVisible()
  expect(scenario.getRequestBody()).toMatchObject({ deliveryTime: '12:30', personCount: 7 })
  await expect(page.getByText('5 → 7')).toBeVisible()
})

test('müşteri seçtiği teslimat için satıcı onaylı yemek servisi iptal talebi gönderir', async ({ page }) => {
  const scenario = await openDeliveryChangeScenario(page)
  await page.getByRole('button', { name: /Yemek servisini iptal et/i }).click()
  await expect(page.getByText(/Satıcı onaylayana kadar teslimat planlı kalacak/)).toBeVisible()
  await page.getByRole('button', { name: 'Onaya gönder' }).click()
  await expect(page.getByText(/Yemek servisi iptal talebiniz satıcı onayına gönderildi/)).toBeVisible()
  expect(scenario.wasCancellationRequested()).toBeTruthy()
  await expect(page.getByText('Yemek servisi iptal talebi', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /talep onayı bekleniyor/i }).first()).toBeDisabled()
})
