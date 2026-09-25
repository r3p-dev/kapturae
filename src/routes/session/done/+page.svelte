<script lang="ts">
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { page } from '$app/state'
	import RiArchiveLine from 'remixicon-svelte/icons/archive-line'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import RiDownload2Line from 'remixicon-svelte/icons/download-2-line'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import RiShareForwardLine from 'remixicon-svelte/icons/share-forward-line'
	import Corners from '$lib/components/atoms/corners.svelte'
	import FramePlaceholder from '$lib/components/atoms/frame-placeholder.svelte'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import { Button } from '$lib/components/ui/button'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { objectUrl, revoke } from '$lib/blobs'
	import { blankEdit } from '$lib/editor.svelte'
	import { FRAMES } from '$lib/frames'
	import { buildOutputs, outputCount, type Output } from '$lib/outputs'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { recolor } from '$lib/recolor'
	import { PRINT_SIZES, SESSION_STEPS, SIZES, pick } from '$lib/session'
	import { endSession, photoFor, shots, useShots } from '$lib/shots.svelte'
	import { cn } from '$lib/utils'

	type Stage = 'rendering' | 'done' | 'failed' | 'empty'
	type Format = 'photo' | 'gif'
	type Result = { output: Output; url: string; file: File }

	const query = page.url.searchParams
	const requested = pick(PRINT_SIZES, query.get('size')) ?? '2x6'
	const frame =
		FRAMES.find((candidate) => candidate.id === query.get('frame')) ??
		FRAMES.find((candidate) => candidate.size === requested) ??
		FRAMES[0]
	const total = frame.slots.length
	const again = localizeHref('/session/frame')
	function pad(value: number) {
		return String(value).padStart(2, '0')
	}
	const step = { n: pad(SESSION_STEPS.indexOf('done') + 1), total: pad(SESSION_STEPS.length) }
	const baseName = `kapturae-${frame.id}`

	if (browser) {
		useShots(frame.size, frame.id)
	}

	let stage = $state<Stage>('rendering')
	let progress = $state({ done: 0, total: 0 })
	let outputs: Output[] = []
	let results = $state<Record<Format, Result | null>>({ photo: null, gif: null })
	let format = $state<Format>('photo')
	let canShareFiles = $state(false)
	let isZipping = $state(false)
	let hasShareFailed = $state(false)

	const current = $derived(results[format])
	const isReady = $derived(stage === 'done')

	const status = $derived.by(() => {
		if (stage === 'rendering') {
			return m['session.done.rendering'](progress)
		}
		if (stage === 'failed') {
			return `${m['session.done.failed']()}: ${m['session.done.errors.render']()}`
		}
		if (stage === 'done') {
			return m['session.done.ready']()
		}
		return ''
	})

	function releaseResults() {
		for (const result of Object.values(results)) {
			if (result) {
				revoke(result.url)
			}
		}
		results = { photo: null, gif: null }
	}

	function keep(output: Output) {
		const target: Format = output.kind === 'gif' ? 'gif' : 'photo'
		const isFramed = output.category === 'frame-filtered' || output.category === 'frame'
		if (!isFramed || results[target]) {
			return
		}

		const file = new File([output.blob], `${baseName}.${output.kind}`, { type: output.blob.type })
		results[target] = { output, url: objectUrl(output.blob), file }
	}

	async function render() {
		const edit = shots.edit ?? blankEdit(total)
		const photos = edit.order.map((shot) => shots.photos[shot])
		const bursts = edit.order.map((shot) => photoFor(shots.photos[shot])?.burst ?? [])

		releaseResults()
		stage = 'rendering'
		progress = { done: 0, total: outputCount({ photos, edit }) }

		try {
			const artwork = edit.color ? await recolor(frame, edit.color) : frame.src
			outputs = await buildOutputs({ frame, artwork, photos, bursts, edit }, (done, count, output) => {
				progress = { done, total: count }
				keep(output)
			})
		} catch {
			stage = 'failed'
			return
		}

		const sample = results.photo?.file
		canShareFiles = Boolean(sample && navigator.canShare?.({ files: [sample] }))
		stage = 'done'
	}

	async function share() {
		if (!current) {
			return
		}

		hasShareFailed = false
		try {
			await navigator.share({ files: [current.file], title: 'Kapturae' })
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				hasShareFailed = true
			}
		}
	}

	function save(url: string, name: string) {
		const link = document.createElement('a')
		link.href = url
		link.download = name
		link.click()
	}

	async function downloadAll() {
		if (isZipping || !isReady) {
			return
		}

		isZipping = true
		try {
			const { zipSync } = await import('fflate')
			const entries: Record<string, [Uint8Array, { level: 0 }]> = {}
			for (const output of outputs) {
				const buffer = await output.blob.arrayBuffer()
				entries[`${output.key}.${output.kind}`] = [new Uint8Array(buffer), { level: 0 }]
			}

			const url = objectUrl(new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' }))
			save(url, `${baseName}.zip`)
			setTimeout(() => revoke(url), 10_000)
		} finally {
			isZipping = false
		}
	}

	function startOver() {
		releaseResults()
		endSession()
	}

	onMount(() => {
		const edit = shots.edit ?? blankEdit(total)
		if (edit.order.every((shot) => shots.photos[shot])) {
			render()
		} else {
			stage = 'empty'
		}

		return releaseResults
	})

	const mono = 'font-mono tracking-[0.14em] uppercase'
	const bracket = 'h-3.5 w-1.75 border-2 border-current'
	const disabled = 'aria-disabled:pointer-events-none aria-disabled:opacity-40'
</script>

<svelte:head>
	<title>{m['session.done.meta_title']()}</title>
	<meta name="description" content={m['session.done.meta_description']()} />
</svelte:head>

{#snippet preview(className: string)}
	<div class={cn('flex items-center justify-center', className)} style:--r={SIZES[frame.size].ratio}>
		{#if current}
			<img
				src={current.url}
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
		bind:value={() => format, (next) => next && (format = next as Format)}
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

{#snippet statusLine()}
	<span class="{mono} flex items-center gap-2 text-[11px] text-primary-text">
		<span
			aria-hidden="true"
			class={cn(
				'size-2 rounded-full bg-primary',
				stage === 'rendering' && 'animate-rec-blink motion-reduce:animate-none'
			)}
		></span>
		{status}
	</span>
{/snippet}

{#snippet failed()}
	{#if stage === 'failed'}
		<div class="flex flex-col items-stretch gap-3 border border-primary p-4 text-left rail:flex-row rail:items-center">
			<p class="m-0 flex-1 text-[13px] leading-normal text-body">{m['session.done.errors.render']()}</p>

			<Button onclick={render} class="h-11 gap-2 font-mono font-medium">
				<RiRestartLine aria-hidden="true" class="size-4" />
				{m['session.done.retry']()}
			</Button>
		</div>
	{/if}
{/snippet}

{#snippet actions(primary: string, outline: string)}
	<Button
		href={current?.url}
		download={current?.file.name}
		disabled={!current}
		class="h-13 gap-2.5 font-mono font-medium tracking-widest {primary} {disabled}"
	>
		<RiDownload2Line aria-hidden="true" class="size-4.5" />
		{format === 'gif' ? m['session.done.download_gif']() : m['session.done.download_photo']()}
	</Button>

	{#if canShareFiles}
		<Button
			variant="outline"
			onclick={share}
			disabled={!current}
			class="h-13 gap-2.5 border-[1.5px] font-mono font-normal tracking-widest {outline}"
		>
			<RiShareForwardLine aria-hidden="true" class="size-4.5" />
			{m['session.done.share']()}
		</Button>
	{/if}

	<Button
		variant="outline"
		onclick={downloadAll}
		disabled={!isReady || isZipping}
		class="h-13 gap-2.5 border-[1.5px] font-mono font-normal tracking-widest {outline}"
	>
		<RiArchiveLine aria-hidden="true" class="size-4.5" />
		{isZipping ? m['session.done.zipping']() : m['session.done.download_all']()}
	</Button>
{/snippet}

{#snippet shareError()}
	{#if hasShareFailed}
		<p role="alert" class="m-0 border-l-2 border-primary pl-2.5 text-left text-xs leading-normal text-body">
			{m['session.done.share_failed']()}
		</p>
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

			{@render preview('[--h:min(360px,calc(220px/var(--r)))]')}
			{@render formatToggle()}
			{@render statusLine()}
			{@render failed()}

			<div class="flex flex-col gap-2.5 self-stretch">
				{@render actions('', 'border-foreground')}
				{@render shareError()}
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

				<div class="flex flex-col gap-2.5">
					{@render statusLine()}
					<p class="m-0 text-base leading-normal text-body">{m['session.done.local_body']()}</p>
				</div>

				{@render failed()}

				<div class="flex flex-col gap-2.5">
					<div class="flex flex-wrap gap-2.5">
						{@render actions('bg-paper px-5.5 text-ink hover:bg-paper-2', 'border-paper px-5.5')}
					</div>
					{@render shareError()}
				</div>

				<div class="flex items-start gap-3 border border-[#3a3936] px-4 py-3.5">
					<span class="pt-0.5 font-mono text-[11px] tracking-widest text-primary-text uppercase">
						{m['session.done.important']()}
					</span>
					<p class="m-0 text-[13px] leading-[1.55] text-body">{m['session.done.note']()}</p>
				</div>

				<div class="{mono} flex flex-wrap gap-x-7 text-xs tracking-[0.12em]">
					<a href={again} onclick={startOver} class="inline-flex min-h-11 items-center gap-2 text-foreground">
						{m['session.done.again']()}
						<RiArrowRightLine aria-hidden="true" class="size-4" />
					</a>
				</div>
			</div>
		</main>
	{/if}
</div>
