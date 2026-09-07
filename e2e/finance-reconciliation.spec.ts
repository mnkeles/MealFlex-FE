import { expect, test } from '@playwright/test'

test('sağlayıcı verisi olmayan mutabakat başarılı veya sıfır fark olarak gösterilmez', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-token')
    localStorage.setItem('user', JSON.stringify({ userId: 1, firstName: 'Test', lastName: 'Admin', role: 'ADMIN' }))
  })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/finance-reconciliations') ? [{
      id: 1, date: '2026-09-07', providerCollectedAmount: null,
      ledgerCollectedAmount: 100, paidPayoutAmount: 0, discrepancyAmount: null,
      status: 'PROVIDER_UNAVAILABLE', assignedAdmin: '', resolutionNote: '',
    }] : path.endsWith('/operations/summary') ? {
      taskCount: 0, alerts: [], openComplaints: 0, slaComplaints: 0,
      delayedDeliveries: 0, failedPayments: 0, pendingSubscriptions: 0, openRiskCases: 0,
    } : []
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto('/admin/reconciliation')
  await expect(page.getByText('Sağlayıcı verisi bekleniyor')).toBeVisible()
  await expect(page.getByText('Veri yok', { exact: true })).toHaveCount(2)
  await expect(page.getByText('Mutabık', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'İncele', exact: true })).toHaveCount(0)
})
