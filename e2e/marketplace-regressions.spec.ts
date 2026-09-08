import { expect, test, type Page, type Route } from '@playwright/test'

const json = (route: Route, body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
async function login(page: Page, role: string) {
  await page.addInitScript(role => {
    localStorage.setItem('accessToken', 'qa-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1, firstName: 'Test', lastName: 'İşletme', role }))
    localStorage.setItem('mealflex-active-address-id', '11')
  }, role)
}

test('satıcı iki ayrı aralığı çakışmaları tekrarlamadan kaydeder ve yeniden açınca görür', async ({ page }) => {
  await login(page, 'SELLER')
  const store = { id: 2, name: 'Test Catering', status: 'ACTIVE', categories: [], availableDeliveryTimes: [], rating: 0, reviewCount: 0 }
  let slots: { id: number; deliveryTime: string }[] = []
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/seller/stores/2/delivery-slots')) {
      if (route.request().method() === 'PUT') slots = route.request().postDataJSON().map((slot: { deliveryTime: string }, index: number) => ({ ...slot, id: index + 1 }))
      return json(route, slots)
    }
    if (path.endsWith('/seller/stores/2')) return json(route, store)
    if (path.endsWith('/seller/stores')) return json(route, [store])
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })
  await page.goto('/seller/stores/2/settings')
  await expect(page.locator('#store-status').locator('..').getByText('Aktif', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Kapalı gün tarihi')).toBeVisible()
  await expect(page.getByLabel('Kapalı gün sebebi')).toBeVisible()
  const rangeStart = page.getByRole('combobox', { name: 'Başlangıç saati' })
  const rangeEnd = page.getByRole('combobox', { name: 'Bitiş saati' })
  await page.getByRole('button', { name: 'Aralığı ekle' }).click()
  await page.getByRole('button', { name: 'Aralığı ekle' }).click()
  await rangeStart.selectOption('18:00')
  await rangeEnd.selectOption('20:00')
  await page.getByRole('button', { name: 'Aralığı ekle' }).click()
  await page.getByRole('button', { name: 'Teslimat saatlerini kaydet' }).click()
  await expect(page.getByText('Teslimat saatleri kaydedildi.')).toBeVisible()
  expect(slots).toHaveLength(18)
  expect(slots.map(slot => slot.deliveryTime)).not.toContain('15:00')
  expect(slots.map(slot => slot.deliveryTime)).toEqual(expect.arrayContaining(['12:00', '12:15', '14:00', '18:00', '20:00']))
  await page.reload()
  await expect(page.getByRole('button', { name: '18:00 teslimat saatini kaldır', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /teslimat saatini kaldır/ })).toHaveCount(18)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  await rangeStart.selectOption('20:00')
  await rangeEnd.selectOption('12:00')
  await page.getByRole('button', { name: 'Aralığı ekle' }).click()
  await expect(page.getByText('Bitiş saati başlangıç saatinden önce olamaz.')).toBeVisible()
})

test('mağaza ayarları taslağı korunur ve mesafe kaydı yalnız sunucudaki mağaza verisini kullanır', async ({ page }) => {
  await login(page, 'SELLER')
  const store = { id: 2, name: 'Kayıtlı Catering', description: 'Kayıtlı açıklama', status: 'ACTIVE', categories: [], availableDeliveryTimes: [], rating: 0, reviewCount: 0, latitude: 39.93, longitude: 32.85 }
  const secondStore = { ...store, id: 3, name: 'İkinci Mağaza' }
  let distanceRules = [{ id: 1, distanceKm: 5, minPersonCount: 3 }]
  let updatePayload: Record<string, unknown> | undefined
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/seller/stores/2/distance-rules')) return json(route, distanceRules)
    if (path.endsWith('/seller/stores/2') && route.request().method() === 'PUT') {
      updatePayload = route.request().postDataJSON()
      distanceRules = (updatePayload.distanceRules as typeof distanceRules).map((rule, index) => ({ ...rule, id: index + 1 }))
      return json(route, { ...store, ...updatePayload })
    }
    if (path.endsWith('/seller/stores/2')) return json(route, store)
    if (path.endsWith('/seller/stores')) return json(route, [store, secondStore])
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })

  await page.goto('/seller/stores/2/settings')
  const nameInput = page.locator('#store-profile form input[type="text"]').first()
  await nameInput.fill('Kaydedilmemiş Taslak')
  await expect(page.getByText(/Kaydedilmemiş değişiklikler var/)).toBeVisible()
  await expect(page.getByLabel('Kaydedilmemiş değişiklik var')).toHaveCount(1)

  await page.getByLabel('1. kural minimum kişi sayısı').fill('4')
  await expect(page.getByLabel('Kaydedilmemiş değişiklik var')).toHaveCount(2)
  await page.getByRole('button', { name: 'Mesafe Kurallarını Kaydet' }).click()
  await expect(page.getByText('Mesafe kuralları kaydedildi.')).toBeVisible()
  expect(updatePayload?.name).toBe('Kayıtlı Catering')
  expect(updatePayload?.description).toBe('Kayıtlı açıklama')
  await expect(nameInput).toHaveValue('Kaydedilmemiş Taslak')
  await expect(page.getByLabel('Kaydedilmemiş değişiklik var')).toHaveCount(1)

  page.once('dialog', dialog => dialog.dismiss())
  if (await page.getByLabel('Aktif mağaza').isVisible()) {
    await page.getByLabel('Aktif mağaza').selectOption('3')
  } else {
    await page.locator('nav[aria-label="Satıcı mobil navigasyonu"]').getByRole('link', { name: 'Bildirimler' }).click()
  }
  await expect(page).toHaveURL(/\/seller\/stores\/2\/settings$/)
})

async function subscriptionScenario(page: Page, times: string[]) {
  await login(page, 'CUSTOMER')
  const start = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  const end = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10)
  let created = 0
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/addresses')) return json(route, [{ id: 11, title: 'Ofis', fullAddress: 'Ankara', defaultAddress: true }])
    if (path.endsWith('/stores/2')) return json(route, { id: 2, name: 'Test Catering', status: 'ACTIVE', minPersonCount: 3, maxPersonCount: 20, categories: [], availableDeliveryTimes: ['12:00', '18:00'], nextAvailableDeliveryDate: start })
    if (path.endsWith('/stores/2/menus/3')) return json(route, { id: 3, name: 'Öğle Yemeği', pricePerPerson: 100, active: true, items: [], dietTags: [], allergens: [] })
    if (path.endsWith('/stores/2/delivery-times')) return json(route, times)
    if (path.endsWith('/payments/methods')) return json(route, [{ id: 1, brand: 'Visa', lastFour: '4242', defaultMethod: true }])
    if (path.endsWith('/subscriptions/preview')) {
      if (route.request().postDataJSON().couponCode) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Kupon geçersiz.' }) })
      return json(route, { serviceDayCount: 5, serviceDates: [start], excludedDates: [], pricePerPerson: 100, totalAmount: 1500, distanceKm: 1 })
    }
    if (path.endsWith('/subscriptions') && route.request().method() === 'POST') { created++; return json(route, { id: 77 }) }
    if (path.includes('unread-count')) return json(route, { count: 0 })
    return json(route, [])
  })
  await page.goto('/subscribe?storeId=2&menuId=3&addressId=11')
  await page.getByRole('button', { name: /Devam Et/ }).click()
  await page.getByLabel('Başlangıç tarihi').fill(start)
  await page.getByLabel('Bitiş tarihi').fill(end)
  await page.getByRole('button', { name: /Devam Et/ }).click()
  return { created: () => created }
}

test('dönemde ortak saat yoksa müşteri serbest saat girerek devam edemez', async ({ page }) => {
  await subscriptionScenario(page, [])
  await expect(page.getByText(/Seçilen dönemin tüm hizmet günlerine uygun/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Devam Et/ })).toBeDisabled()
  await expect(page.locator('input[type=time]')).toHaveCount(0)
})

test('geçersiz kupon sonrası eski toplamla abonelik gönderilemez', async ({ page }) => {
  const scenario = await subscriptionScenario(page, ['12:00'])
  await expect(page.getByLabel('Uygun teslimat saati').locator('option')).toHaveCount(1)
  await page.getByRole('button', { name: /Devam Et/ }).click()
  await page.getByLabel(/Kupon veya kurumsal kod/).fill('GECERSIZ')
  await expect(page.getByText('Kupon geçersiz.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abonelik Talebini Gönder' })).toBeDisabled()
  expect(scenario.created()).toBe(0)
  await page.getByLabel(/Kupon veya kurumsal kod/).fill('')
  await expect(page.getByRole('button', { name: 'Abonelik Talebini Gönder' })).toBeEnabled()
})
