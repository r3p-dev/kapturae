<script lang="ts">
	import RiAddLine from 'remixicon-svelte/icons/add-line'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import * as Sheet from '$lib/components/ui/sheet'
	import { Button } from '$lib/components/ui/button'
	import { Slider } from '$lib/components/ui/slider'
	import { objectUrl } from '$lib/blobs'
	import { m } from '$lib/paraglide/messages'
	import {
		FULL_CROP,
		HANDLES,
		STRENGTH,
		cropPixels,
		moveCrop,
		opaqueBounds,
		removeBackground,
		resizeCrop,
		type Crop,
		type Handle
	} from '$lib/sticker-cutout'
	import { cn } from '$lib/utils'

	let {
		files,
		onadd,
		onfail,
		onclose
	}: {
		files: File[]
		onadd: (url: string) => void
		onfail: () => void
		onclose: () => void
	} = $props()

	const WORK_SIDE = 1200
	const STICKER_SIDE = 600
	const MIN_CROP_PIXELS = 24
	const KEY_STEP = 0.02
	const CHECKER = 'repeating-conic-gradient(#3a3936 0 25%, #2a2a28 0 50%) 0 0 / 16px 16px'

	let index = $state(0)
	let source = $state<HTMLCanvasElement | null>(null)
	let output = $state<HTMLCanvasElement | null>(null)
	let stage = $state<HTMLDivElement | null>(null)
	let crop = $state<Crop>(FULL_CROP)
	let isRemoving = $state(false)
	let strength = $state<number>(STRENGTH.initial)
	let isLoading = $state(true)
	let isSaving = $state(false)
	let drag: { handle: Handle | null; x: number; y: number; start: Crop } | null = null

	type Settings = { source: HTMLCanvasElement; crop: Crop; isRemoving: boolean; strength: number }
	let frame = 0

	const file = $derived(files[index])
	const size = $derived(source ? { width: source.width, height: source.height } : { width: 1, height: 1 })
	const minimum = $derived({ x: MIN_CROP_PIXELS / size.width, y: MIN_CROP_PIXELS / size.height })

	async function load(next: File) {
		isLoading = true
		source = null

		let bitmap: ImageBitmap
		try {
			bitmap = await createImageBitmap(next, { imageOrientation: 'from-image' })
		} catch {
			onfail()
			advance()
			return
		}

		const scale = Math.min(1, WORK_SIDE / Math.max(bitmap.width, bitmap.height))
		const canvas = document.createElement('canvas')
		canvas.width = Math.round(bitmap.width * scale)
		canvas.height = Math.round(bitmap.height * scale)
		canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
		bitmap.close()

		crop = FULL_CROP
		source = canvas
		isLoading = false
	}

	function settings(): Settings | null {
		return source ? { source, crop, isRemoving, strength } : null
	}

	function render(target: HTMLCanvasElement, current: Settings) {
		const region = cropPixels(current.crop, current.source.width, current.source.height)
		const scale = Math.min(1, STICKER_SIDE / Math.max(region.width, region.height))
		target.width = Math.max(1, Math.round(region.width * scale))
		target.height = Math.max(1, Math.round(region.height * scale))

		const context = target.getContext('2d', { willReadFrequently: true })
		if (!context) {
			return
		}

		context.clearRect(0, 0, target.width, target.height)
		context.drawImage(
			current.source,
			region.x,
			region.y,
			region.width,
			region.height,
			0,
			0,
			target.width,
			target.height
		)

		if (current.isRemoving) {
			const pixels = context.getImageData(0, 0, target.width, target.height)
			pixels.data.set(removeBackground(pixels.data, target.width, target.height, current.strength))
			context.putImageData(pixels, 0, 0)
		}
	}

	$effect(() => {
		if (file) {
			load(file)
		}
	})

	$effect(() => {
		const target = output
		const current = settings()
		if (!target || !current) {
			return
		}

		cancelAnimationFrame(frame)
		frame = requestAnimationFrame(() => render(target, current))
		return () => cancelAnimationFrame(frame)
	})

	function advance() {
		if (index + 1 < files.length) {
			index++
		} else {
			onclose()
		}
	}

	async function add() {
		const current = settings()
		if (!current || isSaving) {
			return
		}

		isSaving = true
		try {
			const canvas = document.createElement('canvas')
			render(canvas, current)
			const result = current.isRemoving ? trim(canvas) : canvas

			const blob = await new Promise<Blob | null>((resolve) => result.toBlob(resolve, 'image/png'))
			if (blob) {
				onadd(objectUrl(blob))
			} else {
				onfail()
			}
		} finally {
			isSaving = false
		}

		advance()
	}

	function paint(image: HTMLCanvasElement) {
		return (element: HTMLCanvasElement) => {
			element.width = image.width
			element.height = image.height
			element.getContext('2d')?.drawImage(image, 0, 0)
		}
	}

	function trim(canvas: HTMLCanvasElement) {
		const context = canvas.getContext('2d')
		const pixels = context?.getImageData(0, 0, canvas.width, canvas.height)
		const bounds = pixels && opaqueBounds(pixels.data, canvas.width, canvas.height)
		if (!bounds) {
			return canvas
		}

		const trimmed = document.createElement('canvas')
		trimmed.width = bounds.width
		trimmed.height = bounds.height
		trimmed
			.getContext('2d')
			?.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height)
		return trimmed
	}

	function startDrag(event: PointerEvent, handle: Handle | null) {
		event.preventDefault()
		event.stopPropagation()
		;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
		drag = { handle, x: event.clientX, y: event.clientY, start: crop }
	}

	function moveDrag(event: PointerEvent) {
		if (!drag || !stage) {
			return
		}

		const bounds = stage.getBoundingClientRect()
		const deltaX = (event.clientX - drag.x) / bounds.width
		const deltaY = (event.clientY - drag.y) / bounds.height
		crop = drag.handle
			? resizeCrop(drag.start, drag.handle, deltaX, deltaY, Math.max(minimum.x, minimum.y))
			: moveCrop(drag.start, deltaX, deltaY)
	}

	function endDrag() {
		drag = null
	}

	function nudge(event: KeyboardEvent, handle: Handle | null) {
		const directions: Record<string, [number, number]> = {
			ArrowLeft: [-KEY_STEP, 0],
			ArrowRight: [KEY_STEP, 0],
			ArrowUp: [0, -KEY_STEP],
			ArrowDown: [0, KEY_STEP]
		}
		const direction = directions[event.key]
		if (!direction) {
			return
		}

		event.preventDefault()
		event.stopPropagation()
		const [deltaX, deltaY] = direction
		const corner = handle ?? (event.shiftKey ? 'se' : null)
		crop = corner
			? resizeCrop(crop, corner, deltaX, deltaY, Math.max(minimum.x, minimum.y))
			: moveCrop(crop, deltaX, deltaY)
	}

	const handleLabels: Record<Handle, () => string> = {
		nw: m['session.edit.sticker_prep.handles.nw'],
		ne: m['session.edit.sticker_prep.handles.ne'],
		sw: m['session.edit.sticker_prep.handles.sw'],
		se: m['session.edit.sticker_prep.handles.se']
	}

	const corners: Record<Handle, string> = {
		nw: '-top-2 -left-2 cursor-nwse-resize',
		ne: '-top-2 -right-2 cursor-nesw-resize',
		sw: '-bottom-2 -left-2 cursor-nesw-resize',
		se: '-right-2 -bottom-2 cursor-nwse-resize'
	}

	const mono = 'font-mono tracking-[0.14em] uppercase'
</script>

<Sheet.Root open onOpenChange={(open) => !open && onclose()}>
	<Sheet.Content
		side="bottom"
		showCloseButton={false}
		class="dark max-h-[92svh] gap-4 overflow-y-auto border-[#3a3936] bg-card px-4 pt-3 pb-4 text-foreground scheme-dark rail:mx-auto rail:max-w-2xl rail:border-x"
	>
		<Sheet.Header class="gap-1 p-0">
			<Sheet.Title class="m-0 font-display text-xl font-extrabold uppercase font-stretch-112%">
				{m['session.edit.sticker_prep.title']()}
			</Sheet.Title>
			<Sheet.Description class="m-0 text-[13px] text-muted-foreground">
				{m['session.edit.sticker_prep.description']()}
				{#if files.length > 1}
					<span class="{mono} ml-1 text-[11px]">
						· {m['session.edit.sticker_prep.queue']({ n: index + 1, total: files.length })}
					</span>
				{/if}
			</Sheet.Description>
		</Sheet.Header>

		<div class="flex min-h-48 items-center justify-center bg-[#1b1b1a] p-3">
			{#if isLoading || !source}
				<span class="{mono} text-xs text-muted-foreground" role="status">
					{m['session.edit.sticker_prep.loading']()}
				</span>
			{:else}
				<div
					bind:this={stage}
					class="relative touch-none select-none"
					style:aspect-ratio="{size.width} / {size.height}"
					style:width="min(100%, calc(48svh * {size.width / size.height}))"
				>
					<canvas {@attach paint(source)} aria-hidden="true" class="block size-full"></canvas>

					<div
						class="absolute shadow-[0_0_0_9999px_rgb(0_0_0/0.6)] outline-2 outline-paper has-focus-visible:outline-primary"
						style:left="{crop.x * 100}%"
						style:top="{crop.y * 100}%"
						style:width="{crop.width * 100}%"
						style:height="{crop.height * 100}%"
						style:background={isRemoving ? CHECKER : undefined}
					>
						<canvas bind:this={output} aria-hidden="true" class="block size-full"></canvas>

						<button
							type="button"
							aria-label={m['session.edit.sticker_prep.crop_label']()}
							onpointerdown={(event) => startDrag(event, null)}
							onpointermove={moveDrag}
							onpointerup={endDrag}
							onpointercancel={endDrag}
							onkeydown={(event) => nudge(event, null)}
							class="absolute inset-0 cursor-move focus-visible:outline-none"
						></button>

						{#each HANDLES as handle (handle)}
							<button
								type="button"
								aria-label={handleLabels[handle]()}
								onpointerdown={(event) => startDrag(event, handle)}
								onpointermove={moveDrag}
								onpointerup={endDrag}
								onpointercancel={endDrag}
								onkeydown={(event) => nudge(event, handle)}
								class={cn(
									'absolute size-4 border-2 border-ink bg-paper focus-visible:outline-2 focus-visible:outline-primary',
									corners[handle]
								)}
							></button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<p class="m-0 text-xs text-muted-foreground">{m['session.edit.sticker_prep.crop_hint']()}</p>

		<div class="flex flex-col gap-3 border border-[#3a3936] p-3.5">
			<label class="flex min-h-11 items-center gap-2.5 text-[13px] text-body">
				<input type="checkbox" bind:checked={isRemoving} class="size-4.5 accent-primary" />
				{m['session.edit.sticker_prep.remove_bg']()}
			</label>

			{#if isRemoving}
				<div class="flex flex-col gap-2.5">
					<div class="flex justify-between text-[13px]">
						<span>{m['session.edit.sticker_prep.strength']()}</span>
						<span class="font-mono text-muted-foreground">{strength}</span>
					</div>
					<Slider
						type="single"
						bind:value={strength}
						min={STRENGTH.min}
						max={STRENGTH.max}
						step={1}
						aria-label={m['session.edit.sticker_prep.strength']()}
					/>
				</div>
				<p class="m-0 text-xs leading-normal text-muted-foreground">
					{m['session.edit.sticker_prep.remove_bg_note']()}
				</p>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-2.5 rail:grid-cols-[auto_1fr_1fr]">
			<Button
				variant="outline"
				onclick={() => (crop = FULL_CROP)}
				disabled={!source}
				class="col-span-2 h-11 gap-2 border-[#3a3936] font-mono font-normal tracking-widest rail:col-span-1"
			>
				<RiRestartLine aria-hidden="true" class="size-4" />
				{m['session.edit.sticker_prep.reset']()}
			</Button>

			<Button
				variant="outline"
				onclick={files.length > 1 && index + 1 < files.length ? advance : onclose}
				class="h-11 border-[#3a3936] font-mono font-normal tracking-widest"
			>
				{files.length > 1 && index + 1 < files.length
					? m['session.edit.sticker_prep.skip']()
					: m['session.edit.sticker_prep.cancel']()}
			</Button>

			<Button onclick={add} disabled={!source || isSaving} class="h-11 gap-2 font-mono font-medium">
				<RiAddLine aria-hidden="true" class="size-4" />
				{m['session.edit.sticker_prep.add']()}
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
