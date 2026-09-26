import { chromium, expect, test, type Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import en from '../../messages/en.json' with { type: 'json' }

async function waitForServiceWorker(page: Page) {
	await page.evaluate(() => navigator.serviceWorker.ready)
	await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
}

for (const [path, manifest] of [
	['/', '/manifest.webmanifest'],
	['/id', '/manifest-id.webmanifest']
]) {
	test(`${path} passes Chrome's installability checks`, async ({ baseURL }) => {
		const profile = mkdtempSync(join(tmpdir(), 'kapturae-install-'))
		const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', baseURL })

		try {
			const page = context.pages()[0] ?? (await context.newPage())
			const cdp = await context.newCDPSession(page)
			await page.goto('/robots.txt')

			const control = await cdp.send('Page.getInstallabilityErrors')
			expect(control.installabilityErrors.map((error) => error.errorId)).toContain('no-manifest')

			await page.goto(path)
			await waitForServiceWorker(page)
			const { url, errors } = await cdp.send('Page.getAppManifest')
			const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors')

			expect(new URL(url).pathname).toBe(manifest)
			expect(errors).toEqual([])
			expect(installabilityErrors).toEqual([])
		} finally {
			await context.close()
			rmSync(profile, { recursive: true, force: true })
		}
	})
}

test('the install button only appears when the browser offers an install', async ({ page }) => {
	await page.goto('/')
	await page.waitForLoadState('networkidle')

	const button = page.getByRole('button', { name: en.common.install, exact: true })
	await expect(button).toHaveCount(0)

	await expect(async () => {
		await page.evaluate(() => {
			const offer = new Event('beforeinstallprompt', { cancelable: true })
			Object.assign(offer, {
				prompt: () => {
					document.body.dataset.prompted = 'true'
					return Promise.resolve()
				}
			})
			dispatchEvent(offer)
		})
		await expect(button).toBeVisible({ timeout: 500 })
	}).toPass()
	await button.click()

	await expect(page.locator('body')).toHaveAttribute('data-prompted', 'true')
	await expect(button).toHaveCount(0)
})
