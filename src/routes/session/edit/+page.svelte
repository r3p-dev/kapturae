<script lang="ts">
	import { onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { page } from '$app/state'
	import RiAddLine from 'remixicon-svelte/icons/add-line'
	import RiArrowGoBackLine from 'remixicon-svelte/icons/arrow-go-back-line'
	import RiArrowGoForwardLine from 'remixicon-svelte/icons/arrow-go-forward-line'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import RiBrushLine from 'remixicon-svelte/icons/brush-line'
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import RiContrastDropLine from 'remixicon-svelte/icons/contrast-drop-line'
	import RiDeleteBinLine from 'remixicon-svelte/icons/delete-bin-line'
	import RiEmotionHappyLine from 'remixicon-svelte/icons/emotion-happy-line'
	import RiEqualizerLine from 'remixicon-svelte/icons/equalizer-line'
	import RiEraserLine from 'remixicon-svelte/icons/eraser-line'
	import RiImageAddLine from 'remixicon-svelte/icons/image-add-line'
	import RiImageLine from 'remixicon-svelte/icons/image-line'
	import RiPaletteLine from 'remixicon-svelte/icons/palette-line'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import RiSipLine from 'remixicon-svelte/icons/sip-line'
	import RiSubtractLine from 'remixicon-svelte/icons/subtract-line'
	import RiText from 'remixicon-svelte/icons/text'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import Corners from '$lib/components/atoms/corners.svelte'
	import Dropzone from '$lib/components/molecules/dropzone.svelte'
	import PhotoLibrary from '$lib/components/molecules/photo-library.svelte'
	import EditorStage from '$lib/components/organisms/editor-stage.svelte'
	import SlotCamera from '$lib/components/organisms/slot-camera.svelte'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import { Button } from '$lib/components/ui/button'
	import * as Sheet from '$lib/components/ui/sheet'
	import { Slider } from '$lib/components/ui/slider'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import {
		ADJUSTMENTS,
		FILTER_IDS,
		FILTER_KEYS,
		FONTS,
		FRAME_COLORS,
		History,
		ITEM_SIZE,
		SWATCHES,
		ZOOM,
		blankEdit,
		clamp,
		filterCss,
		filterTint,
		type Adjustment,
		type Edit,
		type FilterId,
		type Font,
		type Item,
		type SlotEdit,
		type Tool
	} from '$lib/editor.svelte'
	import { FRAMES } from '$lib/frames'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { recolor } from '$lib/recolor'
	import { PRINT_SIZES, SIZES, pick } from '$lib/session'
	import { STICKER_LABELS, UPLOAD_PROBLEMS } from '$lib/session-messages'
	import { addPhoto, photoFor, shots, useShots, type Photo } from '$lib/shots.svelte'
	import { UPLOAD_ACCEPT, UPLOAD_MAX_MB, UploadRejected, importPhoto, type UploadProblem } from '$lib/upload'
	import { STICKER_IDS, importSticker, stickerSrc } from '$lib/stickers'
	import { cn } from '$lib/utils'

	type Draft<T> = T extends unknown ? Omit<T, 'id'> : never

	const ZOOM_BUTTON_STEP = 10
	const RECOLOR_DELAY = 60
	const RAINBOW = 'conic-gradient(from 90deg, #e8483a, #e8b23a, #5fbf4a, #1f9fbf, #5a4fcf, #c84fb0, #e8483a)'

	const params = page.url.searchParams
	const requested = pick(PRINT_SIZES, params.get('size')) ?? '2x6'
	const frame =
		FRAMES.find((f) => f.id === params.get('frame')) ?? FRAMES.find((f) => f.size === requested) ?? FRAMES[0]
	const total = frame.slots.length
	const query = new URLSearchParams({ size: frame.size, frame: frame.id })
	const done = localizeHref(`/session/done?${query}`)

	if (browser) useShots(frame.size, frame.id)

	const history = new History<Edit>(shots.edit ?? blankEdit(total))

	onDestroy(() => {
		if (browser) shots.edit = $state.snapshot(history.value)
	})

	const empty = history.value.order.findIndex((shot) => !shots.photos[shot])

	let tool = $state<Tool | null>('color')
	let slot = $state<number | null>(empty === -1 ? null : empty)
	let item = $state<number | null>(null)
	let move = $state<{ from: number; target: number } | null>(null)
	let applyAll = $state(false)
	let brush = $state({ color: SWATCHES.white as string, size: 8, eraser: false })
	let draft = $state({ text: '', font: 'bold' as Font, color: SWATCHES.white as string })
	let src = $state(frame.src)
	let uploadFailed = $state(false)
	let replace = $state<'camera' | 'upload' | null>(null)
	let sheet = $state(false)
	let replacing = $state(false)
	let replaceProblem = $state<UploadProblem | null>(null)

	const edit = $derived(history.value)
	const shown = $derived({ ...frame, src })
	const photos = $derived(edit.order.map((shot) => shots.photos[shot]))
	const current = $derived(slot === null ? undefined : edit.slots[slot])
	const look = $derived(
		current ??
			(edit.slots.every((s) => s.filter === edit.slots[0].filter && s.intensity === edit.slots[0].intensity)
				? edit.slots[0]
				: undefined)
	)
	const hasPhoto = $derived(slot !== null && Boolean(photos[slot]))
	const preview = $derived((slot !== null && photos[slot]) || photos.find(Boolean))
	const missing = $derived(photos.some((photo) => !photo))
	const slotPhoto = $derived(slot === null ? undefined : photoFor(photos[slot]))
	const replacingSlot = $derived(slot !== null && replace !== null && !tool)
	const selected = $derived(edit.items.find((it) => it.id === item))
	const text = $derived(selected?.kind === 'text' ? selected : undefined)
	const sticker = $derived(selected?.kind === 'sticker' ? selected : undefined)

	const hint = $derived.by(() => {
		if (move) return m['session.edit.hint_move']()
		if (missing) return m['session.edit.hint_missing']()
		if (tool === 'brush') return brush.eraser ? m['session.edit.hint_eraser']() : m['session.edit.hint_brush']()
		if (selected) return m['session.edit.hint_item']()
		return null
	})

	$effect(() => {
		const color = edit.color
		if (!color) {
			src = frame.src
			return
		}

		let live = true
		const timer = setTimeout(() => {
			recolor(frame, color)
				.then((url) => live && (src = url))
				.catch(() => {})
		}, RECOLOR_DELAY)

		return () => {
			live = false
			clearTimeout(timer)
		}
	})

	function commit() {
		history.commit()
	}

	function shootHref(i: number) {
		return localizeHref(`/session/shoot?${query}&retake=${edit.order[i]}`)
	}

	function place(target: number, url: string) {
		const from = edit.order.findIndex((shot) => shots.photos[shot] === url)
		if (from === target) return

		if (from === -1) {
			shots.photos[edit.order[target]] = url
			Object.assign(edit.slots[target], { zoom: ZOOM.min, x: 0, y: 0 })
		} else {
			const { order, slots } = edit
			;[order[from], order[target]] = [order[target], order[from]]
			;[slots[from], slots[target]] = [slots[target], slots[from]]
		}

		commit()
	}

	async function replaceWith(files: File[]) {
		const target = slot
		const [file] = files
		if (target === null || !file || replacing) return

		replacing = true
		replaceProblem = null
		try {
			const url = await importPhoto(file)
			place(target, addPhoto({ url, source: 'upload', name: file.name, burst: [] }))
			sheet = false
		} catch (error) {
			replaceProblem = error instanceof UploadRejected ? error.problem : 'unreadable'
		} finally {
			replacing = false
		}
	}

	function pickReplaceFile(e: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(e.currentTarget.files ?? [])]
		e.currentTarget.value = ''
		replaceWith(files)
	}

	function openReplace(mode: 'camera' | 'upload') {
		replace = mode
		replaceProblem = null
		tool = null
	}

	function pickTool(next: Tool | null) {
		replace = null
		tool = next === tool ? null : next
		if (selected && selected.kind !== tool) item = null
	}

	function setAdjustment(key: Adjustment, value: number) {
		if (!current) return
		for (const target of applyAll ? edit.slots : [current]) target[key] = value
	}

	function setLook<K extends (typeof FILTER_KEYS)[number]>(key: K, value: SlotEdit[K]) {
		for (const target of applyAll || !current ? edit.slots : [current]) target[key] = value
	}

	function setApplyAll(on: boolean) {
		applyAll = on
		if (!on || !current) return
		const keys: readonly (keyof SlotEdit)[] = tool === 'filter' ? FILTER_KEYS : ADJUSTMENTS
		for (const target of edit.slots) for (const key of keys) Object.assign(target, { [key]: current[key] })
		commit()
	}

	function zoomBy(step: number) {
		if (!current) return
		current.zoom = clamp(current.zoom + step, ZOOM.min, ZOOM.max)
		commit()
	}

	function addItem(next: Draft<Item>) {
		const id = Math.max(0, ...edit.items.map((it) => it.id)) + 1
		edit.items.push({ ...next, id } as Item)
		item = id
		commit()
	}

	function removeItem() {
		edit.items = edit.items.filter((it) => it.id !== item)
		item = null
		commit()
	}

	function addText() {
		const value = draft.text.trim() || m['session.edit.text_placeholder']()
		addItem({
			kind: 'text',
			text: value,
			font: draft.font,
			color: draft.color,
			x: 50,
			y: 50,
			size: ITEM_SIZE.text.initial
		})
		draft.text = ''
	}

	function addSticker(sticker: string) {
		addItem({ kind: 'sticker', sticker, x: 50, y: 50, size: ITEM_SIZE.sticker.initial })
	}

	async function upload(e: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(e.currentTarget.files ?? [])]
		e.currentTarget.value = ''
		uploadFailed = false

		for (const file of files) {
			try {
				const url = await importSticker(file)
				shots.uploads.push(url)
				addSticker(url)
			} catch {
				uploadFailed = true
			}
		}
	}

	function setTextStyle(style: Partial<Pick<typeof draft, 'font' | 'color'>>) {
		Object.assign(draft, style)
		if (text) Object.assign(text, style)
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !(e.target as HTMLElement).closest('input, textarea')) {
			if (move) move = null
			else if (item !== null || slot !== null) {
				item = null
				slot = null
			} else return
			e.preventDefault()
			return
		}

		if (!(e.ctrlKey || e.metaKey)) return
		const key = e.key.toLowerCase()
		if (key !== 'z' && key !== 'y') return
		if ((e.target as HTMLElement).closest('input, textarea')) return

		e.preventDefault()
		if (key === 'y' || e.shiftKey) history.redo()
		else history.undo()
	}

	const tools = [
		{ value: 'adjust', icon: RiEqualizerLine, label: m['session.edit.tools.adjust'] },
		{ value: 'filter', icon: RiContrastDropLine, label: m['session.edit.tools.filter'] },
		{ value: 'sticker', icon: RiEmotionHappyLine, label: m['session.edit.tools.sticker'] },
		{ value: 'text', icon: RiText, label: m['session.edit.tools.text'] },
		{ value: 'brush', icon: RiBrushLine, label: m['session.edit.tools.brush'] },
		{
			value: 'color',
			icon: RiPaletteLine,
			label: m['session.edit.tools.color'],
			short: m['session.edit.tools.color_short']
		}
	] as const

	const adjustments = [
		{ key: 'brightness', label: m['session.edit.brightness'], min: -100 },
		{ key: 'contrast', label: m['session.edit.contrast'], min: -100 },
		{ key: 'saturation', label: m['session.edit.saturation'], min: -100 },
		{ key: 'warmth', label: m['session.edit.warmth'], min: -100 },
		{ key: 'grain', label: m['session.edit.grain'], min: 0 }
	] as const

	const filterLabels = {
		original: m['session.edit.filters.original'],
		mono: m['session.edit.filters.mono'],
		warm: m['session.edit.filters.warm'],
		film: m['session.edit.filters.film'],
		faded: m['session.edit.filters.faded'],
		punchy: m['session.edit.filters.punchy'],
		noir: m['session.edit.filters.noir'],
		golden: m['session.edit.filters.golden'],
		vintage: m['session.edit.filters.vintage'],
		dreamy: m['session.edit.filters.dreamy'],
		cool: m['session.edit.filters.cool'],
		vivid: m['session.edit.filters.vivid']
	}

	const colors = [
		{ key: 'original', hex: frame.color, label: m['session.edit.colors.original'] },
		...(
			[
				['green', m['session.edit.colors.green']],
				['red', m['session.edit.colors.red']],
				['black', m['session.edit.colors.black']],
				['cream', m['session.edit.colors.cream']],
				['gold', m['session.edit.colors.gold']],
				['navy', m['session.edit.colors.navy']],
				['pink', m['session.edit.colors.pink']],
				['brown', m['session.edit.colors.brown']],
				['purple', m['session.edit.colors.purple']],
				['white', m['session.edit.colors.white']]
			] as const
		).map(([key, label]) => ({ key, hex: FRAME_COLORS[key], label }))
	]

	const swatches = (
		[
			['white', m['session.edit.swatches.white']],
			['black', m['session.edit.swatches.black']],
			['red', m['session.edit.swatches.red']],
			['yellow', m['session.edit.swatches.yellow']],
			['blue', m['session.edit.swatches.blue']]
		] as const
	).map(([key, label]) => ({ hex: SWATCHES[key], label }))

	const fontLabels = {
		bold: m['session.edit.fonts.bold'],
		mono: m['session.edit.fonts.mono'],
		serif: m['session.edit.fonts.serif']
	}
	const fontClass = {
		bold: 'font-display font-extrabold text-sm',
		mono: 'font-mono',
		serif: 'font-serif italic text-[15px]'
	}

	const signed = (value: number, min: number) => (min < 0 && value > 0 ? `+${value}` : String(value))

	const mono = 'font-mono tracking-[0.14em] uppercase'
	const eyebrow = `${mono} text-[11px] text-muted-foreground rail:text-xs`
	const edge = 'border-[#2a2a28]'
	const square =
		'flex size-11 items-center justify-center border border-[#3a3936] text-foreground hover:border-foreground disabled:opacity-40 disabled:hover:border-[#3a3936]'
	const swatch =
		'h-11 min-w-0 border border-[#3a3936] px-0 outline-offset-3 outline-paper hover:bg-transparent data-[state=on]:outline-2'
	const outline = 'h-11 gap-2 border-[#3a3936] font-mono font-normal tracking-widest'
	const tile = `flex h-11 items-center justify-center border ${edge} bg-card hover:border-foreground rail:h-14`
</script>

<svelte:head>
	<title>{m['session.edit.meta_title']()}</title>
	<meta name="description" content={m['session.edit.meta_description']()} />
</svelte:head>

<svelte:window {onkeydown} />

{#snippet finish(cls: string, arrow = true)}
	<Button
		href={done}
		disabled={missing}
		class={cn('h-11 gap-2.5 font-mono font-medium aria-disabled:pointer-events-none aria-disabled:opacity-40', cls)}
	>
		{m['session.edit.done']()}
		{#if arrow}<RiArrowRightLine aria-hidden="true" class="size-4" />{/if}
	</Button>
{/snippet}

{#snippet headerAction()}
	{@render finish('px-3.5', false)}
{/snippet}

{#snippet historyButtons()}
	<button
		type="button"
		onclick={() => history.undo()}
		disabled={!history.canUndo}
		aria-label={m['session.edit.undo']()}
		class={square}
	>
		<RiArrowGoBackLine aria-hidden="true" class="size-4.5" />
	</button>

	<button
		type="button"
		onclick={() => history.redo()}
		disabled={!history.canRedo}
		aria-label={m['session.edit.redo']()}
		class={square}
	>
		<RiArrowGoForwardLine aria-hidden="true" class="size-4.5" />
	</button>
{/snippet}

{#snippet range(
	label: string,
	shown: string,
	value: number,
	set: (value: number) => void,
	opts: { min: number; max: number; step?: number; disabled?: boolean }
)}
	<div class="flex flex-col gap-2.5">
		<div class="flex justify-between text-[13px]">
			<span>{label}</span>
			<span class="font-mono text-muted-foreground">{shown}</span>
		</div>

		<Slider
			type="single"
			{value}
			onValueChange={set}
			onValueCommit={commit}
			min={opts.min}
			max={opts.max}
			step={opts.step ?? 1}
			disabled={opts.disabled}
			aria-label={label}
		/>
	</div>
{/snippet}

{#snippet customSwatch(value: string, active: boolean, set: (hex: string) => void)}
	<label
		class={cn(
			swatch,
			'relative flex cursor-pointer items-center justify-center outline-primary has-focus-visible:outline-2',
			active && 'outline-2 outline-paper'
		)}
		style:background={active ? value : RAINBOW}
	>
		<RiSipLine aria-hidden="true" class="size-4 text-white mix-blend-difference" />

		<input
			type="color"
			aria-label={m['session.edit.swatches.custom']()}
			{value}
			oninput={(e) => set(e.currentTarget.value)}
			onchange={commit}
			class="absolute inset-0 size-full cursor-pointer opacity-0"
		/>
	</label>
{/snippet}

{#snippet colorPicker(label: string, value: string, set: (hex: string) => void)}
	<ToggleGroup.Root
		type="single"
		spacing={2}
		aria-label={label}
		bind:value={
			() => value,
			(next) => {
				if (!next) return
				set(next)
				commit()
			}
		}
		class="grid w-full grid-cols-6 gap-2.5"
	>
		{#each swatches as s (s.hex)}
			<ToggleGroup.Item value={s.hex} aria-label={s.label()} class={swatch} style="background-color: {s.hex}" />
		{/each}

		{@render customSwatch(value, !swatches.some((s) => s.hex === value), set)}
	</ToggleGroup.Root>
{/snippet}

{#snippet panelHead(title: string, note?: string)}
	<div class="flex items-center justify-between gap-3">
		<h2 class="m-0 min-w-0 font-normal {eyebrow}">{title}</h2>

		<div class="flex shrink-0 items-center gap-2">
			{#if note}<span class="text-xs text-muted-foreground rail:hidden">{note}</span>{/if}

			<button
				type="button"
				onclick={() => pickTool(null)}
				aria-label={m['session.edit.close_panel']()}
				class="-my-2 -mr-2 flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
			>
				<RiCloseLine aria-hidden="true" class="size-4.5" />
			</button>
		</div>
	</div>
{/snippet}

{#snippet sourceLine(photo: Photo)}
	<span class="{mono} flex min-w-0 items-center gap-1.5 text-[11px] tracking-[0.08em] text-body">
		{#if photo.source === 'upload'}
			<RiUploadLine aria-hidden="true" class="size-3.25 shrink-0" />
			<span class="truncate">{m['session.source.upload']()}{photo.name ? ` · ${photo.name}` : ''}</span>
		{:else}
			<RiCameraLine aria-hidden="true" class="size-3.25 shrink-0" />
			<span class="truncate">{m['session.source.camera']()}</span>
		{/if}
	</span>
{/snippet}

{#snippet replaceInput()}
	<input type="file" accept={UPLOAD_ACCEPT} disabled={replacing} onchange={pickReplaceFile} class="sr-only" />
{/snippet}

{#snippet replaceError()}
	{#if replaceProblem}
		<p role="alert" class="m-0 border-l-2 border-primary pl-2.5 text-xs leading-normal text-body">
			{UPLOAD_PROBLEMS[replaceProblem]()}
		</p>
	{/if}
{/snippet}

{#snippet uploadDrop()}
	<Dropzone
		onfiles={replaceWith}
		disabled={replacing}
		class="relative flex h-47 shrink-0 flex-col items-center justify-center gap-3 border-2 border-dashed border-[#5a5853] p-4 text-center"
	>
		<RiUploadLine aria-hidden="true" class="size-8 text-primary" />
		<span class="font-display text-lg font-extrabold uppercase font-stretch-112%"
			>{m['session.upload.drop_title']()}</span
		>
		<label
			class={cn(
				'flex h-11 items-center bg-paper px-5 font-mono text-xs font-medium tracking-[0.1em] text-ink uppercase hover:bg-paper-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-paper',
				replacing ? 'pointer-events-none opacity-50' : 'cursor-pointer'
			)}
		>
			{@render replaceInput()}
			{replacing ? m['session.upload.loading']() : m['session.replace.pick_file']()}
		</label>
	</Dropzone>

	<span class="{mono} text-[11px] tracking-[0.1em] text-muted-foreground">
		{m['session.upload.formats']()} · {m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}
	</span>

	{@render replaceError()}
{/snippet}

{#snippet libraryBlock(cols: string)}
	{#if slot !== null && shots.library.length}
		<div class="h-px shrink-0 bg-[#2a2a28]"></div>
		<span class={eyebrow}>{m['session.library.title']()}</span>
		<PhotoLibrary
			order={edit.order}
			current={photos[slot]}
			onpick={(url) => {
				if (slot !== null) place(slot, url)
				sheet = false
			}}
			class={cols}
		/>
		<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.library.note']()}</p>
	{/if}
{/snippet}

{#snippet applyAllToggle()}
	<label class="flex min-h-11 items-center gap-2.5 text-[13px] text-body">
		<input
			type="checkbox"
			checked={applyAll}
			onchange={(e) => setApplyAll(e.currentTarget.checked)}
			class="size-4.5 accent-primary"
		/>
		{m['session.edit.apply_all']()}
	</label>
{/snippet}

{#snippet removeButton()}
	<Button variant="outline" onclick={removeItem} class={outline}>
		<RiDeleteBinLine aria-hidden="true" class="size-4" />
		{m['session.edit.remove']()}
	</Button>
{/snippet}

<div class="dark flex h-svh flex-col overflow-hidden bg-background text-foreground scheme-dark">
	<SessionHeader step="edit" action={headerAction} />

	<div class="flex min-h-0 flex-1 flex-col rail:flex-row">
		<ToggleGroup.Root
			type="single"
			orientation="vertical"
			rovingFocus={false}
			spacing={1}
			aria-label={m['session.edit.tools_label']()}
			bind:value={() => tool ?? '', (next) => pickTool((next || null) as Tool | null)}
			class="order-last h-19 w-full shrink-0 flex-row! items-center! justify-around border-t {edge} px-1 pb-2 rail:order-first rail:h-auto rail:w-24 rail:flex-col! rail:justify-start rail:gap-1.5 rail:border-t-0 rail:border-r rail:px-0 rail:pt-4 rail:pb-0"
		>
			{#each tools as t (t.value)}
				<ToggleGroup.Item
					value={t.value}
					class="h-14.5 w-14.5 flex-col gap-1 px-0 font-mono text-[9px] font-normal tracking-[0.04em] text-body hover:bg-[#232321] data-[state=on]:bg-[#232321] data-[state=on]:text-primary-text rail:h-16 rail:w-20 rail:text-[10px] rail:tracking-[0.06em]"
				>
					<t.icon aria-hidden="true" class="size-5" />
					{#if 'short' in t}
						<span class="rail:hidden">{t.short()}</span>
						<span class="hidden rail:inline">{t.label()}</span>
					{:else}
						{t.label()}
					{/if}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>

		<section
			aria-label={m['session.edit.canvas_label']()}
			class={cn('flex shrink-0 flex-col bg-[#0a0a09] rail:min-w-0 rail:flex-1', !tool && 'min-h-0 flex-1')}
		>
			<div class="hidden h-14 shrink-0 items-center justify-between gap-4 border-b {edge} px-4 rail:flex">
				<div class="flex gap-2">{@render historyButtons()}</div>

				<span class="{mono} min-w-0 truncate text-xs tracking-[0.12em] text-muted-foreground" aria-live="polite">
					{hint ?? (slot === null ? m['session.edit.hint_none']() : m['session.edit.hint_slot']({ n: slot + 1 }))}
				</span>

				{@render finish('px-5')}
			</div>

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				onpointerdown={(e) => {
					if (e.target !== e.currentTarget) return
					slot = null
					item = null
					move = null
				}}
				class={cn(
					'@container-size relative flex h-[min(470px,56svh)] items-center justify-center rail:h-auto rail:flex-1 desktop:gap-7',
					!tool && 'h-auto flex-1'
				)}
				style:--r={1 / SIZES[frame.size].ratio}
			>
				<Corners inset="18px" size="24px" weight="2px" class="hidden text-[#3a3936] rail:block" />

				<div class="absolute top-2.5 left-2.5 flex gap-1.5 rail:hidden">{@render historyButtons()}</div>

				<EditorStage
					frame={shown}
					{photos}
					{tool}
					{brush}
					bind:edit={history.value}
					bind:slot
					bind:item
					bind:move
					onselect={(it) => (tool = it.kind)}
					oncommit={commit}
					class="[--h:min(calc(100cqh-50px),calc((100cqw-220px)*var(--r)))] desktop:[--h:min(calc(100cqh-148px),calc((100cqw-380px)*var(--r)))]"
				/>

				<div class="mt-22 hidden w-59 flex-col gap-3.5 border {edge} bg-card p-4.5 desktop:flex">
					{#if slot === null || !current}
						<p class="m-0 text-[13px] leading-normal text-muted-foreground">{m['session.edit.select_slot']()}</p>
					{:else}
						<div class="flex flex-col gap-1.5">
							<span class="{mono} text-[11px] text-muted-foreground">{m['session.edit.slot']({ n: slot + 1 })}</span>
							{#if slotPhoto}
								{@render sourceLine(slotPhoto)}
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<div class="flex justify-between text-[13px]">
								<span>{m['session.edit.zoom']()}</span>
								<span class="font-mono text-muted-foreground">{current.zoom}%</span>
							</div>

							<div class="flex items-center gap-1.5">
								<button
									type="button"
									onclick={() => zoomBy(-ZOOM_BUTTON_STEP)}
									disabled={!hasPhoto || current.zoom <= ZOOM.min}
									aria-label={m['session.edit.zoom_out']()}
									class={square}
								>
									<RiSubtractLine aria-hidden="true" class="size-4.5" />
								</button>

								<Slider
									type="single"
									value={current.zoom}
									onValueChange={(v) => (current.zoom = v)}
									onValueCommit={commit}
									min={ZOOM.min}
									max={ZOOM.max}
									step={ZOOM.step}
									disabled={!hasPhoto}
									aria-label={m['session.edit.zoom']()}
									class="min-w-0 flex-1"
								/>

								<button
									type="button"
									onclick={() => zoomBy(ZOOM_BUTTON_STEP)}
									disabled={!hasPhoto || current.zoom >= ZOOM.max}
									aria-label={m['session.edit.zoom_in']()}
									class={square}
								>
									<RiAddLine aria-hidden="true" class="size-4.5" />
								</button>
							</div>

							<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.edit.no_crop']()}</p>
						</div>

						<div class="h-px bg-[#2a2a28]"></div>

						<span class="{mono} text-[11px] text-muted-foreground">
							{hasPhoto ? m['session.replace.title']() : m['session.replace.fill']()}
						</span>

						<ToggleGroup.Root
							type="single"
							orientation="vertical"
							spacing={2}
							aria-label={hasPhoto ? m['session.replace.title']() : m['session.replace.fill']()}
							bind:value={
								() => (replacingSlot ? (replace ?? '') : ''),
								(next) => (next ? openReplace(next as 'camera' | 'upload') : (replace = null))
							}
							class="w-full"
						>
							{#each [['camera', RiRestartLine, m['session.replace.camera']()], ['upload', RiUploadLine, m['session.replace.upload']()]] as const as [value, Icon, label] (value)}
								<ToggleGroup.Item
									{value}
									class="h-12 w-full justify-start gap-2.5 border-[1.5px] border-paper px-3.5 font-mono text-xs font-medium tracking-[0.1em] hover:bg-paper/10 data-[state=on]:bg-paper data-[state=on]:text-ink"
								>
									<Icon aria-hidden="true" class="size-4" />
									{label}
								</ToggleGroup.Item>
							{/each}
						</ToggleGroup.Root>

						<p class="m-0 text-xs leading-[1.45] text-muted-foreground">{m['session.replace.note']()}</p>
					{/if}
				</div>

				{#if slot !== null && current}
					<div class="absolute top-1/2 right-3.5 flex flex-col items-end gap-2 desktop:hidden">
						{#if hasPhoto}
							<div class="flex items-center gap-1.5">
								<button
									type="button"
									onclick={() => zoomBy(-ZOOM_BUTTON_STEP)}
									disabled={current.zoom <= ZOOM.min}
									aria-label={m['session.edit.zoom_out']()}
									class="{square} hidden rail:flex"
								>
									<RiSubtractLine aria-hidden="true" class="size-4" />
								</button>

								<span class="bg-paper px-2 py-1.25 font-mono text-[11px] text-ink">
									{m['session.edit.zoom_value']({ n: current.zoom })}
								</span>

								<button
									type="button"
									onclick={() => zoomBy(ZOOM_BUTTON_STEP)}
									disabled={current.zoom >= ZOOM.max}
									aria-label={m['session.edit.zoom_in']()}
									class="{square} hidden rail:flex"
								>
									<RiAddLine aria-hidden="true" class="size-4" />
								</button>
							</div>
						{/if}

						<Button
							onclick={() => {
								replaceProblem = null
								sheet = true
							}}
							class="h-11 gap-1.5 bg-paper px-3 font-mono text-[11px] font-medium text-ink hover:bg-paper-2"
						>
							<RiRestartLine aria-hidden="true" class="size-3.5 text-primary" />
							{hasPhoto ? m['session.replace.short']() : m['session.edit.take']()}
						</Button>
					</div>
				{/if}

				<span
					class="{mono} absolute inset-x-0 bottom-2.5 text-center text-[10px] tracking-widest text-muted-foreground rail:hidden"
				>
					{hint ?? m['session.edit.hint_touch']()}
				</span>
			</div>
		</section>

		{#if tool || replacingSlot}
			<aside
				class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t {edge} p-4 rail:w-72 rail:flex-none rail:gap-4.5 rail:border-t-0 rail:border-l rail:p-6 desktop:w-80"
			>
				{#if replacingSlot && slot !== null}
					{@const n = slot + 1}

					<div class="flex items-center justify-between gap-3">
						<h2 class="m-0 min-w-0 font-normal {eyebrow}">
							{replace === 'camera'
								? m['session.replace.camera_title']({ n })
								: m['session.replace.upload_title']({ n })}
						</h2>
						<button
							type="button"
							onclick={() => (replace = null)}
							aria-label={m['session.edit.close_panel']()}
							class="-my-2 -mr-2 flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
						>
							<RiCloseLine aria-hidden="true" class="size-4.5" />
						</button>
					</div>

					{#if replace === 'camera'}
						{#key slot}
							<SlotCamera
								label={m['session.replace.shutter']({ n })}
								onshot={(url, burst) => slot !== null && place(slot, addPhoto({ url, source: 'camera', burst }))}
							/>
						{/key}
						<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.replace.camera_note']({ n })}</p>
					{:else}
						{@render uploadDrop()}
						{@render libraryBlock('grid-cols-3')}
					{/if}
				{:else if tool === 'color'}
					{@render panelHead(m['session.edit.frame_title'](), m['session.edit.frame_note_short']())}

					<p class="m-0 hidden text-sm leading-normal text-body rail:block">
						{m['session.edit.frame_note']({ name: frame.name })}
					</p>

					<ToggleGroup.Root
						type="single"
						spacing={2}
						aria-label={m['session.edit.frame_title']()}
						bind:value={
							() => (edit.color ? (colors.find((c) => c.hex === edit.color)?.key ?? '') : 'original'),
							(next) => {
								if (!next) return
								edit.color = next === 'original' ? null : (colors.find((c) => c.key === next)?.hex ?? null)
								commit()
							}
						}
						class="grid w-full grid-cols-6 gap-2 rail:gap-2.5"
					>
						{#each colors as c (c.key)}
							<ToggleGroup.Item value={c.key} aria-label={c.label()} class={swatch} style="background-color: {c.hex}" />
						{/each}

						{@render customSwatch(
							edit.color ?? frame.color,
							edit.color !== null && !colors.some((c) => c.hex === edit.color),
							(hex) => (edit.color = hex)
						)}
					</ToggleGroup.Root>

					<div class="flex justify-between text-[13px] text-body">
						<span>{m['session.edit.ink']()}</span>
						<span class="font-mono text-muted-foreground uppercase">{m['session.edit.ink_auto']()}</span>
					</div>
				{:else if tool === 'adjust'}
					{#if slot === null || !current}
						{@render panelHead(m['session.edit.tools.adjust']())}

						<p class="m-0 text-[13px] leading-normal text-muted-foreground">{m['session.edit.select_slot']()}</p>
					{:else}
						{@const adjusting = current}

						{@render panelHead(m['session.edit.adjust_title']({ n: slot + 1 }))}

						{#each adjustments as a (a.key)}
							{@render range(
								a.label(),
								signed(adjusting[a.key], a.min),
								adjusting[a.key],
								(v) => setAdjustment(a.key, v),
								{
									min: a.min,
									max: 100,
									disabled: !hasPhoto
								}
							)}
						{/each}
					{/if}

					{@render applyAllToggle()}
				{:else if tool === 'filter'}
					{@const filterTitle =
						slot === null ? m['session.edit.filter_title']() : m['session.edit.filter_title_slot']({ n: slot + 1 })}
					{@const intensity = look?.intensity ?? 100}

					{@render panelHead(filterTitle)}

					{#if slot === null}
						<p class="m-0 text-[13px] leading-normal text-muted-foreground">
							{m['session.edit.filter_pick_slot']()}
						</p>
					{/if}

					<ToggleGroup.Root
						type="single"
						spacing={2}
						aria-label={filterTitle}
						bind:value={
							() => look?.filter ?? '',
							(next) => {
								if (!next) return
								setLook('filter', next as FilterId)
								commit()
							}
						}
						class="grid w-full grid-cols-4 gap-2 rail:grid-cols-3 rail:gap-2.5"
					>
						{#each FILTER_IDS as id (id)}
							{@const tint = filterTint(id, intensity)}

							<ToggleGroup.Item
								value={id}
								class="h-auto min-w-0 flex-col items-stretch gap-1.5 px-0 font-mono text-[10px] font-normal tracking-[0.08em] text-body hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary-text"
							>
								<span
									class="relative block h-14 overflow-hidden bg-[#8a7560] outline-offset-2 outline-primary group-data-[state=on]/toggle:outline-2 rail:h-18"
									style:filter={preview ? undefined : filterCss(id, intensity)}
								>
									{#if preview}
										<img src={preview} alt="" class="size-full object-cover" style:filter={filterCss(id, intensity)} />
									{/if}

									{#if tint}
										<span
											class="absolute inset-0 mix-blend-soft-light"
											style:background-color={tint.color}
											style:opacity={tint.opacity}
										></span>
									{/if}
								</span>
								{filterLabels[id]()}
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>

					{@render range(m['session.edit.intensity'](), String(intensity), intensity, (v) => setLook('intensity', v), {
						min: 0,
						max: 100,
						disabled: !look || look.filter === 'original'
					})}

					{#if slot !== null}
						{@render applyAllToggle()}
					{/if}

					<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.edit.filter_note']()}</p>
				{:else if tool === 'sticker'}
					{@render panelHead(m['session.edit.sticker_title']())}

					<div class="grid grid-cols-8 gap-1.5 rail:grid-cols-4 rail:gap-2.5">
						<label
							title={m['session.edit.sticker_upload_add']()}
							class="{tile} cursor-pointer border-dashed border-[#5e5c57] text-muted-foreground hover:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-primary"
						>
							<RiImageAddLine aria-hidden="true" class="size-5 rail:size-6" />
							<input
								type="file"
								accept="image/*"
								multiple
								aria-label={m['session.edit.sticker_upload_add']()}
								onchange={upload}
								class="sr-only"
							/>
						</label>

						{#each shots.uploads as url, i (url)}
							<button
								type="button"
								aria-label={m['session.edit.sticker_add']({ name: `${m['session.edit.sticker_upload']()} ${i + 1}` })}
								onclick={() => addSticker(url)}
								class="{tile} p-1.5"
							>
								<img src={url} alt="" class="max-h-full max-w-full object-contain" />
							</button>
						{/each}

						{#each STICKER_IDS as id (id)}
							<button
								type="button"
								aria-label={m['session.edit.sticker_add']({ name: STICKER_LABELS[id]() })}
								onclick={() => addSticker(id)}
								class={tile}
							>
								<img src={stickerSrc(id)} alt="" class="size-6.5 rail:size-7.5" />
							</button>
						{/each}
					</div>

					<p class="m-0 text-xs leading-normal text-muted-foreground" aria-live="polite">
						{uploadFailed ? m['session.edit.sticker_upload_error']() : m['session.edit.sticker_upload_note']()}
					</p>

					{#if sticker}
						{@render range(
							m['session.edit.size'](),
							`${sticker.size}%`,
							sticker.size,
							(v) => (sticker.size = v),
							ITEM_SIZE.sticker
						)}
						{@render removeButton()}
					{/if}
				{:else if tool === 'text'}
					{@render panelHead(m['session.edit.text_title']())}

					<div class="flex flex-col gap-2">
						<label for="edit-text" class="text-[13px] text-body">{m['session.edit.text_label']()}</label>
						<input
							id="edit-text"
							type="text"
							maxlength="40"
							placeholder={m['session.edit.text_placeholder']()}
							value={text ? text.text : draft.text}
							oninput={(e) => {
								if (text) text.text = e.currentTarget.value
								else draft.text = e.currentTarget.value
							}}
							onchange={commit}
							onkeydown={(e) => e.key === 'Enter' && !text && addText()}
							class="h-11 border border-[#3a3936] bg-card px-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
						/>
					</div>

					<ToggleGroup.Root
						type="single"
						spacing={2}
						aria-label={m['session.edit.fonts_label']()}
						bind:value={
							() => text?.font ?? draft.font,
							(next) => {
								if (!next) return
								setTextStyle({ font: next as Font })
								commit()
							}
						}
						class="grid w-full grid-cols-3 gap-2"
					>
						{#each FONTS as font (font)}
							<ToggleGroup.Item
								value={font}
								class="h-11 border border-[#3a3936] px-0 font-normal tracking-normal normal-case data-[state=on]:border-paper data-[state=on]:bg-paper data-[state=on]:text-ink {fontClass[
									font
								]}"
							>
								{fontLabels[font]()}
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>

					{@render colorPicker(m['session.edit.color_label'](), text?.color ?? draft.color, (hex) =>
						setTextStyle({ color: hex })
					)}

					{#if text}
						{@render range(
							m['session.edit.size'](),
							`${text.size}%`,
							text.size,
							(v) => (text.size = v),
							ITEM_SIZE.text
						)}
						{@render removeButton()}
					{:else}
						<Button onclick={addText} class="h-11 gap-2 font-mono font-medium">
							<RiAddLine aria-hidden="true" class="size-4" />
							{m['session.edit.text_add']()}
						</Button>
					{/if}
				{:else if tool === 'brush'}
					{@render panelHead(m['session.edit.brush_title']())}

					{@render range(m['session.edit.size'](), `${brush.size} px`, brush.size, (v) => (brush.size = v), {
						min: 1,
						max: 40
					})}

					{@render colorPicker(m['session.edit.color_label'](), brush.color, (hex) => {
						brush.color = hex
						brush.eraser = false
					})}

					<Button
						variant="outline"
						aria-pressed={brush.eraser}
						onclick={() => (brush.eraser = !brush.eraser)}
						class="{outline} aria-pressed:border-paper aria-pressed:bg-paper aria-pressed:text-ink"
					>
						<RiEraserLine aria-hidden="true" class="size-4" />
						{m['session.edit.eraser']()}
					</Button>
				{/if}
			</aside>
		{/if}
	</div>
</div>

<Sheet.Root bind:open={() => sheet && slot !== null, (open) => (sheet = open)}>
	<Sheet.Content
		side="bottom"
		showCloseButton={false}
		class="dark max-h-[85svh] gap-3.5 overflow-y-auto border-[#3a3936] bg-card px-4 pt-2.5 pb-4 text-foreground scheme-dark"
	>
		{#if slot !== null}
			<span aria-hidden="true" class="h-1 w-10 shrink-0 self-center bg-[#5a5853]"></span>

			<Sheet.Header class="gap-1 p-0">
				<Sheet.Title class="m-0 font-display text-xl font-extrabold uppercase font-stretch-112%">
					{hasPhoto
						? m['session.replace.sheet_title']({ n: slot + 1 })
						: m['session.replace.sheet_fill']({ n: slot + 1 })}
				</Sheet.Title>
				<Sheet.Description class="m-0">
					{#if slotPhoto}
						{m['session.replace.now']()}
						{@render sourceLine(slotPhoto)}
					{:else}
						<span class="text-xs text-muted-foreground">{m['session.edit.select_slot']()}</span>
					{/if}
				</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-col gap-2">
				<a
					href={shootHref(slot)}
					class="flex h-16 items-center gap-3.5 border border-[#3a3936] bg-[#232321] px-3.5 text-foreground no-underline"
				>
					<span class="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
						<RiCameraLine aria-hidden="true" class="size-5" />
					</span>
					<span class="flex flex-col gap-0.5">
						<span class="{mono} text-xs font-medium tracking-[0.1em]">{m['session.replace.camera']()}</span>
						<span class="text-[13px] text-muted-foreground">{m['session.replace.camera_hint']()}</span>
					</span>
				</a>

				<label
					class={cn(
						'flex h-16 items-center gap-3.5 border border-[#3a3936] bg-[#232321] px-3.5 has-focus-visible:outline-2 has-focus-visible:outline-paper',
						replacing ? 'pointer-events-none opacity-50' : 'cursor-pointer'
					)}
				>
					{@render replaceInput()}
					<span class="flex size-10 shrink-0 items-center justify-center bg-paper text-ink">
						<RiImageLine aria-hidden="true" class="size-5" />
					</span>
					<span class="flex flex-col gap-0.5">
						<span class="{mono} text-xs font-medium tracking-[0.1em]">
							{replacing ? m['session.upload.loading']() : m['session.replace.gallery']()}
						</span>
						<span class="text-[13px] text-muted-foreground">
							{m['session.upload.formats']()} · {m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}
						</span>
					</span>
				</label>

				{@render replaceError()}
			</div>

			{@render libraryBlock('grid-cols-4')}

			<Sheet.Close class="mt-1 h-12 shrink-0 border border-[#3a3936] font-mono text-xs tracking-[0.12em] uppercase">
				{m['session.replace.cancel']()}
			</Sheet.Close>
		{/if}
	</Sheet.Content>
</Sheet.Root>
