import { expect, test, type Page, type Request } from '@playwright/test'
import en from '../../messages/en.json' with { type: 'json' }
import { stickerOnWhite } from './images'

const text = en.session

function visible(page: Page, role: 'button' | 'link' | 'radio', name: string) {
	return page.getByRole(role, { name, exact: true }).filter({ visible: true }).first()
}

async function pickFrame(page: Page) {
	await page.locator('label:has(input[name="size"][value="5x7"])').first().click()
	await page.locator('label:has(input[name="frame"])').first().click()
	await visible(page, 'link', text.frame.cta).click()
	await page.waitForURL(/\/session\/shoot/)
}

async function shootAll(page: Page) {
	const shutter = visible(page, 'button', text.shoot.shutter)

	while (!page.url().includes('/session/edit')) {
		await expect(shutter).toHaveAttribute('aria-disabled', 'false', { timeout: 15_000 })
		await shutter.click()
		await page.waitForFunction(
			(label) => {
				const button = [...document.querySelectorAll(`[aria-label="${label}"]`)].find(
					(element) => (element as HTMLElement).offsetParent
				)
				return !button || button.getAttribute('aria-disabled') === 'false' || location.pathname.includes('/edit')
			},
			text.shoot.shutter,
			{ timeout: 15_000 }
		)
	}
	await expect(page.getByRole('button', { name: 'Slot 1', exact: true })).toBeVisible()
}

function mediaCount(page: Page) {
	return page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				const opening = indexedDB.open('kapturae')
				opening.onsuccess = () => {
					const database = opening.result
					if (!database.objectStoreNames.contains('media')) {
						resolve(0)
						return
					}
					const counting = database.transaction('media').objectStore('media').count()
					counting.onsuccess = () => resolve(counting.result)
				}
			})
	)
}

async function waitForServiceWorker(page: Page) {
	await page.evaluate(() => navigator.serviceWorker.ready)
	await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
}

test('a full session works offline and sends nothing', async ({ page, context }) => {
	await page.goto('/session/frame')
	await waitForServiceWorker(page)

	await context.setOffline(true)
	const requests: Request[] = []
	page.on('request', (request) => requests.push(request))

	await pickFrame(page)
	await shootAll(page)

	await visible(page, 'radio', text.edit.tools.sticker).click()
	await page.locator(`input[aria-label="${text.edit.sticker_upload_add}"]`).setInputFiles({
		name: 'sticker.png',
		mimeType: 'image/png',
		buffer: stickerOnWhite()
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog.getByText(text.edit.sticker_prep.title)).toBeVisible()
	await dialog.getByLabel(text.edit.sticker_prep.remove_bg).check()
	await dialog.getByRole('button', { name: text.edit.sticker_prep.add }).click()
	await expect(dialog).toBeHidden()

	const sticker = page.getByRole('button', { name: text.edit.sticker_upload, exact: true }).locator('img')
	await expect(sticker).toBeVisible()
	const [width, height] = await sticker.evaluate(async (image: HTMLImageElement) => {
		await image.decode()
		return [image.naturalWidth, image.naturalHeight]
	})
	expect(width).toBeLessThan(130)
	expect(height).toBeLessThan(130)

	await visible(page, 'link', text.edit.done).click()
	await page.waitForURL(/\/session\/done/)
	await expect(page.getByRole('status')).toHaveText(text.done.ready, { timeout: 60_000 })

	const photoDownload = page.waitForEvent('download')
	await visible(page, 'link', text.done.download_photo).click()
	const photo = await photoDownload
	expect(photo.suggestedFilename()).toMatch(/^kapturae-.+\.png$/)

	const zipDownload = page.waitForEvent('download')
	await visible(page, 'button', text.done.download_all).click()
	const zip = await zipDownload
	expect(zip.suggestedFilename()).toMatch(/^kapturae-.+\.zip$/)

	const origin = new URL(page.url()).origin
	for (const request of requests) {
		expect(request.method(), request.url()).toBe('GET')
		expect(request.postDataBuffer(), request.url()).toBeNull()
		expect(new URL(request.url()).origin, request.url()).toBe(origin)
	}
})

test('an imported sticker keeps its background unless removal is on', async ({ page }) => {
	await page.goto('/session/frame')
	await pickFrame(page)
	await shootAll(page)

	await visible(page, 'radio', text.edit.tools.sticker).click()
	await page.locator(`input[aria-label="${text.edit.sticker_upload_add}"]`).setInputFiles({
		name: 'sticker.png',
		mimeType: 'image/png',
		buffer: stickerOnWhite()
	})
	await page.getByRole('dialog').getByRole('button', { name: text.edit.sticker_prep.add }).click()

	const size = await page
		.getByRole('button', { name: text.edit.sticker_upload, exact: true })
		.locator('img')
		.evaluate(async (image: HTMLImageElement) => {
			await image.decode()
			return [image.naturalWidth, image.naturalHeight]
		})
	expect(size).toEqual([300, 300])
})

test('work survives a reload and is cleared by a new session', async ({ page }) => {
	await page.goto('/session/frame')
	await pickFrame(page)
	await shootAll(page)
	await page.waitForTimeout(600)

	expect(await mediaCount(page)).toBeGreaterThan(0)
	await page.reload()
	await expect(page.locator('img[src^="blob:"]')).not.toHaveCount(0)

	await visible(page, 'link', text.edit.done).click()
	await expect(page.getByRole('status')).toHaveText(text.done.ready, { timeout: 60_000 })
	await visible(page, 'link', text.done.again).click()
	await page.waitForURL(/\/session\/frame/)
	await page.waitForTimeout(600)

	expect(await page.evaluate(() => sessionStorage.getItem('kapturae:session'))).toBeNull()
	expect(await mediaCount(page)).toBe(0)
})

test('media left by a closed tab is removed on the next visit to any page', async ({ context }) => {
	const first = await context.newPage()
	await first.goto('/session/frame')
	await pickFrame(first)
	await shootAll(first)
	await first.waitForTimeout(600)
	expect(await mediaCount(first)).toBeGreaterThan(0)
	await first.close()

	const second = await context.newPage()
	await second.goto('/')
	await expect.poll(() => mediaCount(second)).toBe(0)
})

test('the service worker keeps one cache per build and deletes older ones', async ({ page }) => {
	await page.goto('/')
	await waitForServiceWorker(page)

	await page.evaluate(async () => {
		await caches.open('kapturae-stale-build')
		const registrations = await navigator.serviceWorker.getRegistrations()
		await Promise.all(registrations.map((registration) => registration.unregister()))
	})

	await page.reload()
	await waitForServiceWorker(page)

	const { version, keys } = await page.evaluate(async () => {
		const response = await fetch('/_app/version.json')
		const current = await response.json()
		return { version: current.version as string, keys: await caches.keys() }
	})
	expect(keys).toEqual([`kapturae-${version}`])
})
