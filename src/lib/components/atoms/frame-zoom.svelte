<script lang="ts">
	import { type Snippet } from 'svelte'
	import { SvelteMap } from 'svelte/reactivity'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import { FRAME_ZOOM, clampPan, zoomAt, type Point, type ZoomState } from '$lib/editor/frame-zoom'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'

	const DRAG_SLOP = 4
	const WHEEL_SENSITIVITY = 0.008
	const LINE_HEIGHT_PX = 16

	type PanSession = {
		id: number
		startX: number
		startY: number
		isPanning: boolean
		isChildDrag: boolean
	}

	let {
		resetKey,
		isZoomed = $bindable(false),
		class: className,
		children
	}: {
		resetKey?: unknown
		isZoomed?: boolean
		class?: string
		children: Snippet
	} = $props()

	let viewport = $state<HTMLDivElement>()
	let width = $state(0)
	let height = $state(0)
	let zoom = $state<ZoomState>({ scale: FRAME_ZOOM.min, x: 0, y: 0 })
	let isDragging = $state(false)

	const pointers = new SvelteMap<number, Point>()
	let pinch: { distance: number; midpoint: Point } | null = null
	let panSession: PanSession | null = null
	let suppressClick = false

	const transform = $derived(
		zoom.scale === FRAME_ZOOM.min && zoom.x === 0 && zoom.y === 0
			? undefined
			: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`
	)

	$effect(() => {
		isZoomed = zoom.scale > FRAME_ZOOM.min
	})

	export function reset() {
		zoom = { scale: FRAME_ZOOM.min, x: 0, y: 0 }
		pointers.clear()
		pinch = null
		panSession = null
		isDragging = false
		suppressClick = false
	}

	$effect(() => {
		void resetKey
		reset()
	})

	$effect(() => {
		if (zoom.scale > FRAME_ZOOM.min && width > 0 && height > 0) {
			const clamped = clampPan({ x: zoom.x, y: zoom.y }, zoom.scale, { width, height })
			if (clamped.x !== zoom.x || clamped.y !== zoom.y) {
				zoom = { scale: zoom.scale, x: clamped.x, y: clamped.y }
			}
		}
	})

	function localPoint(clientX: number, clientY: number): Point {
		const rect = viewport?.getBoundingClientRect()
		if (!rect) {
			return { x: width / 2, y: height / 2 }
		}

		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		}
	}

	function spread() {
		const [first, second] = [...pointers.values()]
		if (!first || !second) {
			return 1
		}

		return Math.max(1, Math.hypot(second.x - first.x, second.y - first.y))
	}

	function midpoint(): Point {
		const [first, second] = [...pointers.values()]
		if (!first || !second) {
			return { x: width / 2, y: height / 2 }
		}

		return localPoint((first.x + second.x) / 2, (first.y + second.y) / 2)
	}

	function onWheel(event: WheelEvent) {
		if (!event.ctrlKey && !event.metaKey) {
			return
		}

		event.preventDefault()
		const origin = localPoint(event.clientX, event.clientY)
		const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT_PX : event.deltaY
		const nextScale = zoom.scale * Math.exp(-delta * WHEEL_SENSITIVITY)
		zoom = zoomAt(zoom, nextScale, origin, { width, height })
	}

	$effect(() => {
		const node = viewport
		if (!node) {
			return
		}

		function preventGesture(event: Event) {
			event.preventDefault()
		}

		node.addEventListener('wheel', onWheel, { passive: false })
		node.addEventListener('gesturestart', preventGesture, { passive: false })
		node.addEventListener('gesturechange', preventGesture, { passive: false })
		node.addEventListener('gestureend', preventGesture, { passive: false })

		return () => {
			node.removeEventListener('wheel', onWheel)
			node.removeEventListener('gesturestart', preventGesture)
			node.removeEventListener('gesturechange', preventGesture)
			node.removeEventListener('gestureend', preventGesture)
		}
	})

	function onPointerDownCapture(event: PointerEvent) {
		const target = event.target as Element
		if (target.closest('[data-zoom-reset]')) {
			return
		}

		if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) {
			return
		}

		suppressClick = false
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

		if (pointers.size >= 2) {
			for (const id of pointers.keys()) {
				try {
					viewport?.setPointerCapture(id)
				} catch {}
			}

			pinch = { distance: spread(), midpoint: midpoint() }
			panSession = null
			isDragging = true
			event.stopPropagation()
			return
		}

		const isMiddleButton = event.pointerType === 'mouse' && event.button === 1
		const isChildDrag = !isMiddleButton && Boolean(target.closest('[data-stage-drag]'))
		panSession = {
			id: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			isPanning: false,
			isChildDrag
		}
	}

	function onPointerMoveCapture(event: PointerEvent) {
		const previous = pointers.get(event.pointerId)
		if (!previous) {
			return
		}

		const deltaX = event.clientX - previous.x
		const deltaY = event.clientY - previous.y
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

		if (pinch && pointers.size >= 2) {
			const nextDistance = spread()
			const nextMidpoint = midpoint()
			const nextScale = zoom.scale * (nextDistance / pinch.distance)
			const zoomedState = zoomAt(zoom, nextScale, nextMidpoint, { width, height })
			const moveX = nextMidpoint.x - pinch.midpoint.x
			const moveY = nextMidpoint.y - pinch.midpoint.y
			const panned = clampPan({ x: zoomedState.x + moveX, y: zoomedState.y + moveY }, zoomedState.scale, {
				width,
				height
			})

			zoom = { scale: zoomedState.scale, x: panned.x, y: panned.y }
			pinch = { distance: nextDistance, midpoint: nextMidpoint }
			suppressClick = true
			event.stopPropagation()
			return
		}

		if (panSession?.id === event.pointerId && !panSession.isChildDrag && zoom.scale > FRAME_ZOOM.min) {
			if (!panSession.isPanning) {
				if (Math.hypot(event.clientX - panSession.startX, event.clientY - panSession.startY) < DRAG_SLOP) {
					return
				}

				panSession.isPanning = true
				isDragging = true
				suppressClick = true
				try {
					viewport?.setPointerCapture(event.pointerId)
				} catch {}
			}

			const panned = clampPan({ x: zoom.x + deltaX, y: zoom.y + deltaY }, zoom.scale, { width, height })
			zoom = { scale: zoom.scale, x: panned.x, y: panned.y }
			event.stopPropagation()
		}
	}

	function onPointerEndCapture(event: PointerEvent) {
		pointers.delete(event.pointerId)
		if (pointers.size < 2) {
			pinch = null
		}

		if (panSession?.id === event.pointerId) {
			panSession = null
		}

		if (pointers.size === 0) {
			isDragging = false
		}
	}

	function onClickCapture(event: MouseEvent) {
		if (!suppressClick) {
			return
		}

		suppressClick = false
		event.stopPropagation()
		event.preventDefault()
	}

	function onDoubleClick(event: MouseEvent) {
		if ((event.target as Element).closest('[data-zoom-reset]')) {
			return
		}

		event.preventDefault()
		if (zoom.scale > FRAME_ZOOM.min) {
			reset()
			return
		}

		const origin = localPoint(event.clientX, event.clientY)
		zoom = zoomAt(zoom, FRAME_ZOOM.toggle, origin, { width, height })
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.defaultPrevented || (event.target as Element).closest('input, textarea, select')) {
			return
		}

		const center = { x: width / 2, y: height / 2 }
		if (event.key === '+' || event.key === '=') {
			event.preventDefault()
			zoom = zoomAt(zoom, zoom.scale + FRAME_ZOOM.step, center, { width, height })
		} else if (event.key === '-' || event.key === '_') {
			event.preventDefault()
			zoom = zoomAt(zoom, zoom.scale - FRAME_ZOOM.step, center, { width, height })
		} else if (event.key === '0') {
			event.preventDefault()
			reset()
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={viewport}
	bind:clientWidth={width}
	bind:clientHeight={height}
	tabindex="0"
	onpointerdowncapture={onPointerDownCapture}
	onpointermovecapture={onPointerMoveCapture}
	onpointerupcapture={onPointerEndCapture}
	onpointercancelcapture={onPointerEndCapture}
	onclickcapture={onClickCapture}
	ondblclick={onDoubleClick}
	onkeydown={onKeyDown}
	class={cn(
		'relative flex size-full touch-none items-center justify-center overflow-hidden outline-offset-2 select-none focus-visible:outline-2 focus-visible:outline-primary',
		isZoomed && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
		className
	)}
>
	<div class="flex size-full origin-top-left items-center justify-center" style:transform>
		{@render children()}
	</div>

	{#if isZoomed}
		<button
			type="button"
			data-zoom-reset=""
			aria-label={m['session.edit.zoom_reset']()}
			onclick={reset}
			class="absolute top-3 left-3 z-20 flex h-7 items-center gap-1 bg-paper px-2 font-mono text-[11px] tracking-wider text-ink shadow-sm hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
		>
			<RiRestartLine aria-hidden="true" class="size-3.5 text-primary" />
			<span>{Math.round(zoom.scale * 100)}%</span>
		</button>
	{/if}
</div>
