<script lang="ts">
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { page } from '$app/state'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import RiCheckLine from 'remixicon-svelte/icons/check-line'
	import RiDownload2Line from 'remixicon-svelte/icons/download-2-line'
	import RiLinksLine from 'remixicon-svelte/icons/links-line'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import RiShareForwardLine from 'remixicon-svelte/icons/share-forward-line'
	import Corners from '$lib/components/atoms/corners.svelte'
	import FramePlaceholder from '$lib/components/atoms/frame-placeholder.svelte'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import { Button } from '$lib/components/ui/button'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { hms, useClock } from '$lib/clock.svelte'
	import { blankEdit } from '$lib/editor.svelte'
	import { FRAMES } from '$lib/frames'
	import { buildOutputs, outputCount, shareForm, type Output } from '$lib/outputs'
	import { m } from '$lib/paraglide/messages'
	import { getLocale, localizeHref } from '$lib/paraglide/runtime'
	import { recolor } from '$lib/recolor'
	import { PRINT_SIZES, SESSION_STEPS, SIZES, pick } from '$lib/session'
	import { MAX_ATTEMPTS, UploadError, uploadShare, type UploadFailure } from '$lib/share-upload'
	import { clearShots, photoFor, shots, useShots, type Share } from '$lib/shots.svelte'
	import { cn } from '$lib/utils'

	type Stage = 'idle' | 'rendering' | 'uploading' | 'done' | 'failed' | 'empty'

	const STORAGE_KEY = 'kapturae:share'
	const COPIED_MS = 2000

	const params = page.url.searchParams
	const requested = pick(PRINT_SIZES, params.get('size')) ?? '2x6'
	const frame =
		FRAMES.find((f) => f.id === params.get('frame')) ?? FRAMES.find((f) => f.size === requested) ?? FRAMES[0]
	const total = frame.slots.length
	const again = localizeHref('/session/frame')
	const pad = (n: number) => String(n).padStart(2, '0')
	const step = { n: pad(SESSION_STEPS.indexOf('done') + 1), total: pad(SESSION_STEPS.length) }

	if (browser) useShots(frame.size, frame.id)

	const errors: Record<UploadFailure | 'render', () => string> = {
		network: m['session.done.errors.network'],
		timeout: m['session.done.errors.timeout'],
		too_large: m['session.done.errors.too_large'],
		server: m['session.done.errors.server'],
		render: m['session.done.errors.render']
	}

	let stage = $state<Stage>('idle')
	let progress = $state({ done: 0, total: 0 })
	let attempt = $state(1)
	let failure = $state('')
	let share = $state<Share | null>(null)
	let local = $state<{ sheet?: string; gif?: string }>({})
	let format = $state('photo')
	let copied = $state(false)

	const clock = useClock()
	const remaining = $derived(share ? share.expiresAt - clock.now : 0)
	const expired = $derived(share !== null && remaining <= 0)
	const ready = $derived(stage === 'done' && share !== null && !expired)
	const busy = $derived(stage === 'idle' || stage === 'rendering' || stage === 'uploading')
	const sheet = $derived(share?.sheet ?? local.sheet)
	const gif = $derived(share?.gif ?? local.gif)
	const zip = $derived(share ? `/p/${share.id}/download.zip` : undefined)

	const status = $derived.by(() => {
		if (stage === 'rendering') return m['session.done.rendering'](progress)
		if (stage === 'uploading') return m['session.done.uploading']({ attempt, total: MAX_ATTEMPTS })
		if (stage === 'failed') return `${m['session.done.failed']()}: ${failure}`
		if (expired) return m['session.done.expired']()
		if (stage === 'done') return m['session.done.ready']()
		return ''
	})

	const sessionKey = () => JSON.stringify([frame.id, shots.photos, shots.edit])

	function remember(result: Share) {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...result, frame: frame.id }))
		} catch {}
	}

	function restore() {
		try {
			const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
			if (saved?.frame !== frame.id || saved.expiresAt <= Date.now()) return false
			share = saved
			stage = 'done'
			return true
		} catch {
			return false
		}
	}

	function forget() {
		try {
			sessionStorage.removeItem(STORAGE_KEY)
		} catch {}
	}

	function setLocal(next: typeof local) {
		const owned = new Set(Object.values(shots.published?.share ?? {}))
		for (const url of [local.sheet, local.gif]) if (url && !owned.has(url)) URL.revokeObjectURL(url)
		local = next
	}

	async function publish() {
		const edit = shots.edit ?? blankEdit(total)
		const photos = edit.order.map((shot) => shots.photos[shot])
		const bursts = edit.order.map((shot) => photoFor(shots.photos[shot])?.burst ?? [])
		const key = sessionKey()

		failure = ''
		attempt = 1
		stage = 'rendering'
		progress = { done: 0, total: outputCount({ photos, edit }) }

		let outputs: Output[]
		try {
			const artwork = edit.color ? await recolor(frame, edit.color) : frame.src
			outputs = await buildOutputs(
				{ frame, artwork, photos, bursts, edit },
				(done, total) => (progress = { done, total })
			)
		} catch {
			failure = errors.render()
			stage = 'failed'
			return
		}

		const find = (...keys: string[]) => keys.map((k) => outputs.find((o) => o.key === k)).find(Boolean)!
		const sheetOut = find('frame-filtered', 'frame')
		const gifOut = find('frame-filtered-gif', 'frame-gif')
		setLocal({ sheet: URL.createObjectURL(sheetOut.blob), gif: URL.createObjectURL(gifOut.blob) })

		stage = 'uploading'
		try {
			const result = await uploadShare(shareForm(outputs, frame, getLocale()), (n) => (attempt = n))
			const asset = (o: Output) => `/p/${result.id}/${o.key}.${o.kind}`

			const stale = shots.published?.share
			if (stale) for (const url of [stale.sheet, stale.gif]) if (url.startsWith('blob:')) URL.revokeObjectURL(url)

			share = { ...result, sheet: local.sheet!, gif: local.gif! }
			shots.published = { key, share }
			remember({ ...result, sheet: asset(sheetOut), gif: asset(gifOut) })
			stage = 'done'
		} catch (error) {
			failure = errors[error instanceof UploadError ? error.reason : 'network']()
			stage = 'failed'
		}
	}

	async function copy() {
		if (!share) return
		try {
			await navigator.clipboard.writeText(share.url)
			copied = true
			setTimeout(() => (copied = false), COPIED_MS)
		} catch {}
	}

	async function send() {
		if (!share) return
		if (!navigator.share) return copy()
		await navigator.share({ title: m['share.meta_title'](), url: share.url }).catch(() => {})
	}

	function startOver() {
		forget()
		clearShots()
	}

	onMount(() => {
		if (shots.published?.key === sessionKey()) {
			share = shots.published.share
			stage = 'done'
			return
		}

		const edit = shots.edit ?? blankEdit(total)
		if (edit.order.every((shot) => shots.photos[shot])) publish()
		else if (!restore()) stage = 'empty'
	})

	const mono = 'font-mono tracking-[0.14em] uppercase'
	const bracket = 'h-3.5 w-1.75 border-2 border-current'
	const disabled = 'aria-disabled:pointer-events-none aria-disabled:opacity-40'
</script>

<svelte:head>
	<title>{m['session.done.meta_title']()}</title>
	<meta name="description" content={m['session.done.meta_description']()} />
</svelte:head>

{#snippet preview(cls: string)}
	{@const src = format === 'gif' ? gif : sheet}

	<div class={cn('flex items-center justify-center', cls)} style:--r={SIZES[frame.size].ratio}>
		{#if src}
			<img
				{src}
				alt={format === 'gif' ? m['session.done.gif_alt']() : m['session.done.sheet_alt']()}
				class="block h-(--h) w-auto ring-1 ring-paper/14"
			/>
		{:else}
			<FramePlaceholder size={frame.size} class="animate-pulse motion-reduce:animate-none" />
		{/if}
	</div>
{/snippet}

{#snippet formatToggle()}
	<ToggleGroup.Root
		type="single"
		variant="outline"
		aria-label={m['session.done.preview_label']()}
		bind:value={() => format, (next) => next && (format = next)}
		class="border-[1.5px] border-foreground"
	>
		{#each [['photo', m['session.done.photo']()], ['gif', m['session.done.gif']()]] as [value, label] (value)}
			<ToggleGroup.Item
				{value}
				class="h-11 border-0 px-4.5 font-mono text-xs font-normal tracking-widest hover:bg-foreground/10 data-[state=on]:bg-foreground data-[state=on]:text-background"
			>
				{label}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
{/snippet}

{#snippet qr(cls: string, inset: string, size: string, weight: string)}
	<div class={cn('relative shrink-0 bg-white', cls)}>
		<Corners {inset} {size} {weight} class="text-primary" />

		{#if share && !expired}
			<img src={share.qr} alt={m['session.done.qr_alt']()} class="block size-full" />
		{:else}
			<span aria-hidden="true" class="flex size-full items-center justify-center bg-paper-3">
				<span
					class={cn(
						'size-2.5 rounded-full bg-primary',
						busy && 'animate-rec-blink motion-reduce:animate-none',
						!busy && 'bg-[#8c8983]'
					)}
				></span>
			</span>
		{/if}
	</div>
{/snippet}

{#snippet timer(label: string, cls: string)}
	<div class="flex flex-col gap-0.5">
		<span class="{mono} flex items-center gap-2 text-[11px] text-primary-text rail:justify-start">
			<span
				aria-hidden="true"
				class={cn('size-2 rounded-full bg-primary', !expired && 'animate-rec-blink motion-reduce:animate-none')}
			></span>
			{busy || stage === 'failed' || expired ? status : label}
		</span>

		<span
			class={cn(
				'font-display leading-[1.1] font-black font-stretch-118% tabular-nums',
				!ready && 'text-muted-foreground',
				cls
			)}
		>
			{share ? hms(remaining) : '24:00:00'}
		</span>
	</div>
{/snippet}

{#snippet failed()}
	{#if stage === 'failed'}
		<div class="flex flex-col items-stretch gap-3 border border-primary p-4 text-left rail:flex-row rail:items-center">
			<p class="m-0 flex-1 text-[13px] leading-normal text-body">{failure}</p>

			<Button onclick={publish} class="h-11 gap-2 font-mono font-medium">
				<RiRestartLine aria-hidden="true" class="size-4" />
				{m['session.done.retry']()}
			</Button>
		</div>
	{/if}
{/snippet}

{#snippet copyLabel()}
	{#if copied}
		<RiCheckLine aria-hidden="true" class="size-4.5" />
		{m['session.done.copied']()}
	{:else}
		<RiLinksLine aria-hidden="true" class="size-4.5" />
		{m['session.done.copy']()}
	{/if}
{/snippet}

<div class="dark flex min-h-svh flex-col bg-background text-foreground scheme-dark">
	<SessionHeader step="done" />

	<p class="sr-only" role="status" aria-live="polite">{status}</p>

	{#if stage === 'empty'}
		<main class="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
			<h1
				class="m-0 font-display text-[40px] leading-[0.9] font-black uppercase font-stretch-115% rail:text-6xl rail:font-stretch-118%"
			>
				{m['session.done.empty_title']()}
			</h1>

			<p class="m-0 max-w-md text-[15px] leading-normal text-body">{m['session.done.empty_body']()}</p>

			<Button href={again} onclick={startOver} class="h-13 gap-2.5 px-6 font-mono font-medium">
				{m['session.done.again']()}
				<RiArrowRightLine aria-hidden="true" class="size-4" />
			</Button>
		</main>
	{:else}
		<main class="flex flex-1 flex-col items-center gap-5.5 px-5 py-6 text-center rail:hidden">
			<h1 class="m-0 font-display text-[40px] leading-[0.9] font-black uppercase font-stretch-115%">
				{m['session.done.title']()}
				<span class="text-primary">{m['session.done.title_accent']()}</span>
			</h1>

			<div class="flex flex-wrap items-center justify-center gap-5">
				{@render preview('[--h:min(300px,calc(150px/var(--r)))]')}

				<div class="flex flex-col items-center gap-2.5">
					{@render qr('size-41.5 p-2', '-7px', '14px', '2px')}
					<span class="max-w-42.5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
						{m['session.done.scan_short']()}
					</span>
				</div>
			</div>

			{@render formatToggle()}
			{@render timer(m['session.done.valid_short'](), 'text-[34px]')}
			{@render failed()}

			<div class="flex flex-col gap-2.5 self-stretch">
				<Button
					href={zip}
					download
					disabled={!ready}
					class="h-13 gap-2.5 font-mono font-medium tracking-[0.1em] {disabled}"
				>
					<RiDownload2Line aria-hidden="true" class="size-4.5" />
					{m['session.done.download_short']()}
				</Button>

				<Button
					variant="outline"
					onclick={send}
					disabled={!ready}
					class="h-13 gap-2.5 border-[1.5px] border-foreground font-mono font-normal tracking-[0.1em]"
				>
					{#if copied}
						{@render copyLabel()}
					{:else}
						<RiShareForwardLine aria-hidden="true" class="size-4.5" />
						{m['session.done.share']()}
					{/if}
				</Button>
			</div>

			<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.done.note_short']()}</p>

			<a
				href={again}
				onclick={startOver}
				class="{mono} inline-flex min-h-11 items-center gap-2 text-xs tracking-[0.12em] text-foreground"
			>
				{m['session.done.again']()}
				<RiArrowRightLine aria-hidden="true" class="size-4" />
			</a>
		</main>

		<main class="hidden flex-1 items-center justify-center gap-12 px-8 py-6 rail:flex desktop:gap-27.5 desktop:px-16">
			<div class="flex shrink-0 flex-col items-center gap-5.5">
				<div class="relative p-6.5">
					<Corners size="26px" weight="2px" class="text-paper" />
					{@render preview('[--h:min(570px,calc(100svh-250px))]')}
				</div>

				{@render formatToggle()}
			</div>

			<div class="flex w-full max-w-140 min-w-0 flex-col gap-6.5">
				<p class="{mono} m-0 flex items-center gap-2.5 text-xs tracking-[0.16em]">
					<span aria-hidden="true" class="{bracket} border-r-0"></span>
					{m['session.done.eyebrow'](step)}
					<span aria-hidden="true" class="{bracket} border-l-0"></span>
				</p>

				<h1 class="m-0 font-display text-5xl leading-[0.9] font-black uppercase font-stretch-118% desktop:text-7xl">
					{m['session.done.title']()}
					<span class="block text-primary">{m['session.done.title_accent']()}</span>
				</h1>

				<div class="flex items-center gap-7">
					{@render qr('size-56 p-3.5', '-10px', '22px', '3px')}

					<div class="flex min-w-0 flex-col gap-2.5">
						<span class="{mono} text-xs text-muted-foreground">{m['session.done.scan']()}</span>
						<p class="m-0 text-base leading-normal text-body">{m['session.done.scan_body']()}</p>

						<div class="mt-1.5 flex flex-col gap-0.5">
							{@render timer(m['session.done.valid'](), 'text-[40px]')}
							<span class="text-[13px] text-muted-foreground">{m['session.done.deleted_after']()}</span>
						</div>
					</div>
				</div>

				{@render failed()}

				<div class="flex flex-wrap gap-2.5">
					<Button
						href={zip}
						download
						disabled={!ready}
						class="h-13 gap-2.5 bg-paper px-5.5 font-mono font-medium tracking-[0.1em] text-ink hover:bg-paper-2 {disabled}"
					>
						<RiDownload2Line aria-hidden="true" class="size-4.5" />
						{m['session.done.download']()}
					</Button>

					<Button
						variant="outline"
						onclick={copy}
						disabled={!ready}
						class="h-13 gap-2.5 border-[1.5px] border-paper px-5.5 font-mono font-normal tracking-[0.1em]"
					>
						{@render copyLabel()}
					</Button>
				</div>

				<div class="flex items-start gap-3 border border-[#3a3936] px-4 py-3.5">
					<span class="pt-0.5 font-mono text-[11px] tracking-[0.1em] text-primary-text uppercase">
						{m['session.done.important']()}
					</span>
					<p class="m-0 text-[13px] leading-[1.55] text-body">{m['session.done.note']()}</p>
				</div>

				<div class="{mono} flex flex-wrap gap-x-7 text-xs tracking-[0.12em]">
					<a href={again} onclick={startOver} class="inline-flex min-h-11 items-center gap-2 text-foreground">
						{m['session.done.again']()}
						<RiArrowRightLine aria-hidden="true" class="size-4" />
					</a>

					{#if ready && share}
						<a
							href={share.url}
							target="_blank"
							rel="noopener"
							class="inline-flex min-h-11 items-center gap-2 text-muted-foreground hover:text-foreground"
						>
							{m['session.done.open']()}
							<RiArrowRightLine aria-hidden="true" class="size-4" />
						</a>
					{/if}
				</div>
			</div>
		</main>
	{/if}
</div>
