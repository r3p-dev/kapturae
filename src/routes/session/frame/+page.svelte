<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit'
	import { page } from '$app/state'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import Corners from '$lib/components/atoms/corners.svelte'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import FrameImage from '$lib/components/atoms/frame-image.svelte'
	import FramePlaceholder from '$lib/components/atoms/frame-placeholder.svelte'
	import { Button } from '$lib/components/ui/button'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { FRAMES, type FrameId } from '$lib/frames'
	import { PRINT_SIZES, SESSION_STEPS, SIZES, pick, type PrintSize } from '$lib/session'

	type Selection = { size: PrintSize; frame: FrameId }

	const params = page.url.searchParams
	const initialFrame = FRAMES.find((f) => f.id === params.get('frame'))
	const initialSize = initialFrame?.size ?? pick(PRINT_SIZES, params.get('size')) ?? '2x6'

	let browse = $state<PrintSize>(initialSize)
	let selected = $state<Selection | undefined>(
		initialFrame && { size: initialFrame.size, frame: initialFrame.id }
	)

	export const snapshot: Snapshot<{ browse: PrintSize; selected?: Selection }> = {
		capture: () => ({ browse, selected }),
		restore: (value) => ({ browse, selected } = value)
	}

	const isSelected = (frame: FrameId) => selected?.frame === frame

	const pad = (n: number) => String(n).padStart(2, '0')
	const current = SESSION_STEPS.indexOf('frame')
	const step = { n: pad(current + 1), total: pad(SESSION_STEPS.length) }

	const frames = $derived(FRAMES.filter((f) => f.size === browse))
	const chosen = $derived(FRAMES.find((f) => f.id === selected?.frame))
	const shown = $derived(chosen?.size ?? browse)
	const spec = $derived(SIZES[shown])
	const facts = $derived([
		[m['session.frame.size'](), `${spec.label} · ${spec.cm}`],
		[
			m['session.frame.shots_label'](),
			m['session.frame.shots']({ n: chosen?.slots.length ?? spec.shots })
		],
		[m['session.frame.theme'](), chosen?.name ?? '—']
	])
	const next = $derived(selected && localizeHref(`/session/shoot?${new URLSearchParams(selected)}`))

	const bracket = 'h-3.5 w-1.75 border-2 border-current'
	const focus =
		'has-focus-visible:ring-2 has-focus-visible:ring-foreground has-focus-visible:ring-offset-2'
</script>

<svelte:head>
	<title>{m['session.frame.meta_title']()}</title>
	<meta name="description" content={m['session.frame.meta_description']()} />
</svelte:head>

{#snippet preview(cls: string)}
	{#if chosen}
		<FrameImage frame={chosen} class={cls} />
	{:else}
		<FramePlaceholder size={shown} class={cls} />
	{/if}
{/snippet}

{#snippet cta()}
	<Button
		href={next ?? '#'}
		disabled={!next}
		class="h-14 w-full gap-2.5 font-display text-[15px] font-extrabold tracking-[0.06em] font-stretch-112% aria-disabled:pointer-events-none aria-disabled:opacity-40 rail:gap-3 desktop:text-base"
	>
		{m['session.frame.cta']()}
		<RiArrowRightLine aria-hidden="true" class="size-4.5 rail:size-5" />
	</Button>
{/snippet}

<div
	class="dark flex min-h-svh scrollbar-thin [scrollbar-color:var(--border)_transparent] flex-col bg-background text-foreground scheme-dark rail:h-svh"
>
	<SessionHeader step="frame" />

	<div class="flex flex-1 flex-col rail:min-h-0 rail:flex-row">
		<main
			class="flex min-w-0 flex-1 flex-col gap-4.5 px-4 pt-5 pb-4 rail:gap-5.5 rail:overflow-y-auto rail:px-8 rail:py-9 desktop:px-14"
		>
			<p
				class="m-0 hidden items-center gap-2.5 font-mono text-xs tracking-[0.16em] uppercase rail:flex"
			>
				<span aria-hidden="true" class="{bracket} border-r-0"></span>
				{m['session.frame.eyebrow'](step)}
				<span aria-hidden="true" class="{bracket} border-l-0"></span>
			</p>

			<h1
				class="m-0 font-display text-3xl leading-[0.95] font-black uppercase font-stretch-115% rail:text-5xl rail:font-stretch-118%"
			>
				<span class="rail:hidden">{m['session.frame.title_short']()}</span>
				<span class="hidden rail:inline">{m['session.frame.title']()}</span>
				<span class="text-primary">{m['session.frame.title_accent']()}</span>
			</h1>

			<fieldset class="m-0 grid min-w-0 grid-cols-3 gap-2 rail:flex rail:gap-3.5">
				<legend class="sr-only">{m['session.frame.sizes_label']()}</legend>

				{#each PRINT_SIZES as id (id)}
					{@const s = SIZES[id]}

					<label
						class="relative flex h-14 cursor-pointer items-center justify-center border-[1.5px] border-foreground has-checked:bg-foreground has-checked:text-background rail:h-23 rail:flex-1 rail:basis-0 rail:justify-start rail:gap-4.5 rail:px-5 {focus}"
					>
						<input type="radio" name="size" value={id} bind:group={browse} class="sr-only" />

						{#if selected?.size === id}
							<span aria-hidden="true" class="absolute top-1.5 right-1.5 size-2 bg-primary"></span>
						{/if}

						<span
							aria-hidden="true"
							class="hidden h-10.5 shrink-0 border-2 border-current rail:block"
							style:width="{42 * s.ratio}px"
						></span>

						<span
							class="font-display text-[22px] leading-none font-black font-stretch-115% rail:text-3xl rail:font-stretch-118%"
						>
							{s.label}
						</span>
					</label>
				{/each}
			</fieldset>

			<div
				class="relative flex h-72.5 shrink-0 items-center justify-center bg-[#151514] rail:hidden"
			>
				<Corners inset="10px" size="18px" weight="2px" class="text-[#5e5c57]" />
				{@render preview('[--h:250px]')}
				<span
					class="absolute bottom-2.5 left-10 font-mono text-[10px] tracking-widest text-muted-foreground"
				>
					{spec.cm}
				</span>
			</div>

			<fieldset
				class="m-0 -mr-4 flex min-w-0 gap-2.5 overflow-x-auto pr-4 pb-1 rail:mr-0 rail:grid rail:flex-1 rail:auto-rows-[minmax(220px,1fr)] rail:grid-cols-2 rail:gap-3.5 rail:overflow-visible rail:p-0 desktop:grid-cols-3"
			>
				<legend class="sr-only">{m['session.frame.frames_label']()}</legend>

				{#each frames as frame, i (frame.id)}
					<label
						class="relative flex h-32 w-26 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 bg-[#151514] p-1.5 outline-1 -outline-offset-1 outline-[#2a2a28] has-checked:outline-3 has-checked:-outline-offset-3 has-checked:outline-primary rail:h-auto rail:w-auto rail:gap-3 rail:p-3 {focus}"
					>
						<input
							type="radio"
							name="frame"
							value={frame.id}
							checked={isSelected(frame.id)}
							onchange={() => (selected = { size: frame.size, frame: frame.id })}
							class="sr-only"
						/>

						<FrameImage {frame} class="[--h:92px] rail:[--h:176px]" />

						<span
							class="font-mono text-[10px] tracking-[0.06em] whitespace-nowrap uppercase rail:text-xs rail:tracking-widest"
						>
							<span class="hidden rail:inline">{pad(i + 1)} ·</span>
							{frame.name}
						</span>

						{#if isSelected(frame.id)}
							<span
								aria-hidden="true"
								class="absolute top-2.5 right-2.5 hidden bg-primary px-2 py-0.75 font-mono text-[11px] tracking-widest text-primary-foreground uppercase rail:block"
							>
								{m['session.frame.selected']()}
							</span>
						{/if}
					</label>
				{/each}
			</fieldset>
		</main>

		<aside
			class="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-[#2a2a28] bg-[#151514] px-7 pt-9 pb-8 rail:flex desktop:w-100 desktop:px-9"
		>
			<span class="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
				{m['session.frame.preview']()}
			</span>

			<div class="relative flex h-[min(420px,48svh)] shrink-0 items-center justify-center">
				<Corners size="22px" weight="2px" class="text-[#5e5c57]" />
				{@render preview(
					'[--h:min(320px,calc(48svh_-_20px))] desktop:[--h:min(400px,calc(48svh_-_20px))]'
				)}
			</div>

			<dl class="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
				{#each facts as [term, value] (term)}
					<dt
						class="pt-0.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase"
					>
						{term}
					</dt>
					<dd class="m-0">{value}</dd>
				{/each}
			</dl>

			<div class="mt-auto">{@render cta()}</div>

			<p class="m-0 text-[13px] leading-normal text-muted-foreground">
				{selected ? m['session.frame.note']() : m['session.frame.pick_first']()}
			</p>
		</aside>
	</div>

	<div
		class="sticky bottom-0 flex shrink-0 flex-col gap-2.5 border-t border-[#2a2a28] bg-background p-4 rail:hidden"
	>
		{#if !selected}
			<p class="m-0 text-center text-[13px] text-muted-foreground">
				{m['session.frame.pick_first']()}
			</p>
		{/if}
		{@render cta()}
	</div>
</div>
