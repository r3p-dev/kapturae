<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit'
	import { page } from '$app/state'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import Corners from '$lib/components/landing/corners.svelte'
	import LangSwitch from '$lib/components/lang-switch.svelte'
	import Logo from '$lib/components/logo.svelte'
	import FramePreview from '$lib/components/session/frame-preview.svelte'
	import { Button } from '$lib/components/ui/button'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import {
		FRAME_DESIGNS,
		PRINT_SIZES,
		SESSION_STEPS,
		SIZES,
		pick,
		type FrameDesign,
		type PrintSize,
		type SessionStep
	} from '$lib/session'

	type Message = () => string

	const steps: Record<SessionStep, Message> = {
		frame: m['session.steps.frame'],
		shoot: m['session.steps.shoot'],
		edit: m['session.steps.edit'],
		done: m['session.steps.done']
	}

	const kinds: Record<PrintSize, Message> = {
		'2x6': m['session.sizes.strip'],
		'4x6': m['session.sizes.postcard'],
		'5x7': m['session.sizes.portrait']
	}

	const names: Record<FrameDesign, Message> = {
		classic: m['session.frames.classic'],
		film: m['session.frames.film'],
		christmas: m['session.frames.christmas'],
		birthday: m['session.frames.birthday'],
		lines: m['session.frames.lines'],
		accent: m['session.frames.accent']
	}

	const params = page.url.searchParams
	let size = $state<PrintSize>(pick(PRINT_SIZES, params.get('size')) ?? '2x6')
	let frame = $state<FrameDesign>(pick(FRAME_DESIGNS, params.get('frame')) ?? 'classic')

	export const snapshot: Snapshot<{ size: PrintSize; frame: FrameDesign }> = {
		capture: () => ({ size, frame }),
		restore: (value) => ({ size, frame } = value)
	}

	const home = localizeHref('/').replace(/(.)\/$/, '$1')
	const pad = (n: number) => String(n).padStart(2, '0')
	const current = SESSION_STEPS.indexOf('frame')
	const step = { n: pad(current + 1), total: pad(SESSION_STEPS.length) }

	const spec = $derived(SIZES[size])
	const facts = $derived([
		[m['session.frame.size'](), `${spec.label} · ${spec.cm}`],
		[m['session.frame.shots_label'](), m['session.frame.shots']({ n: spec.shots })],
		[m['session.frame.theme'](), names[frame]()]
	])
	const next = $derived(localizeHref(`/session/shoot?${new URLSearchParams({ size, frame })}`))

	const mono = 'font-mono text-xs tracking-[0.14em] uppercase'
	const bracket = 'h-3.5 w-1.75 border-2 border-current'
	const focus =
		'has-focus-visible:ring-2 has-focus-visible:ring-foreground has-focus-visible:ring-offset-2'
</script>

<svelte:head>
	<title>{m['session.frame.meta_title']()}</title>
	<meta name="description" content={m['session.frame.meta_description']()} />
</svelte:head>

{#snippet preview(cls: string)}
	<FramePreview design={frame} {size} class={cls} />
{/snippet}

{#snippet cta()}
	<Button
		href={next}
		class="h-14 w-full gap-2.5 font-display text-[15px] font-extrabold tracking-[0.06em] font-stretch-112% rail:gap-3 desktop:text-base"
	>
		{m['session.frame.cta']()}
		<RiArrowRightLine aria-hidden="true" class="size-4.5 rail:size-5" />
	</Button>
{/snippet}

<div
	class="dark flex min-h-svh scrollbar-thin [scrollbar-color:var(--border)_transparent] flex-col bg-background text-foreground scheme-dark rail:h-svh"
>
	<header
		class="flex h-14 shrink-0 items-center justify-between border-b border-[#2a2a28] px-2 rail:h-18 rail:px-8"
	>
		<a
			href={home}
			aria-label={m['session.exit']()}
			class="flex size-11 items-center justify-center text-foreground rail:hidden"
		>
			<RiCloseLine aria-hidden="true" class="size-5" />
		</a>

		<a
			href={home}
			class="hidden items-center gap-3 text-foreground no-underline rail:flex desktop:w-70"
		>
			<Logo class="size-9 shrink-0 text-paper" />
			<span
				class="font-display text-base font-extrabold tracking-[0.04em] uppercase font-stretch-118%"
			>
				{m['common.brand']()}
			</span>
		</a>

		<span class="{mono} text-[11px] rail:text-xs desktop:hidden">
			{m['session.step']({ ...step, name: steps.frame() })}
		</span>

		<nav aria-label={m['session.steps_aria']()} class="hidden desktop:block">
			<ol class="m-0 flex list-none items-center gap-3 p-0">
				{#each SESSION_STEPS as key, i (key)}
					<li class="flex items-center gap-3">
						{#if i > 0}<span aria-hidden="true" class="h-px w-7 bg-[#3a3936]"></span>{/if}
						<span
							aria-current={i === current ? 'step' : undefined}
							class="{mono} px-2.5 py-1.25 text-[#8c8983] aria-[current=step]:border-[1.5px] aria-[current=step]:border-primary aria-[current=step]:text-primary-text"
						>
							{pad(i + 1)}
							{steps[key]()}
						</span>
					</li>
				{/each}
			</ol>
		</nav>

		<div class="flex items-center gap-3 desktop:w-70 desktop:justify-end">
			<LangSwitch class="text-xs" />

			<a
				href={home}
				aria-label={m['session.exit']()}
				class="hidden size-11 items-center justify-center border border-[#3a3936] text-foreground hover:border-foreground rail:flex"
			>
				<RiCloseLine aria-hidden="true" class="size-4.5" />
			</a>
		</div>
	</header>

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
						class="flex h-19 cursor-pointer flex-col items-center justify-center gap-1 border-[1.5px] border-foreground has-checked:bg-foreground has-checked:text-background rail:h-23 rail:flex-1 rail:basis-0 rail:flex-row rail:justify-start rail:gap-4.5 rail:px-5 {focus}"
					>
						<input type="radio" name="size" value={id} bind:group={size} class="sr-only" />

						<span
							aria-hidden="true"
							class="hidden h-10.5 shrink-0 border-2 border-current rail:block"
							style:width="{42 * s.ratio}px"
						></span>

						<span class="flex flex-col items-center gap-1 rail:items-start">
							<span
								class="font-display text-[22px] leading-none font-black font-stretch-115% rail:text-3xl rail:font-stretch-118%"
							>
								{s.label}
							</span>

							<span
								class="font-mono text-[10px] tracking-[0.06em] uppercase rail:text-xs rail:tracking-[0.08em]"
							>
								<span class="hidden desktop:inline">{kinds[id]()} ·</span>
								{m['session.frame.photos']({ n: s.shots })}
							</span>
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

				{#each FRAME_DESIGNS as id, i (id)}
					<label
						class="relative flex h-32 w-26 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 bg-[#151514] p-1.5 outline-1 -outline-offset-1 outline-[#2a2a28] has-checked:outline-3 has-checked:-outline-offset-3 has-checked:outline-primary rail:h-auto rail:w-auto rail:gap-3 rail:p-3 {focus}"
					>
						<input type="radio" name="frame" value={id} bind:group={frame} class="sr-only" />

						<FramePreview design={id} {size} class="[--h:92px] rail:[--h:176px]" />

						<span
							class="font-mono text-[10px] tracking-[0.06em] whitespace-nowrap uppercase rail:text-xs rail:tracking-widest"
						>
							<span class="hidden rail:inline">{pad(i + 1)} ·</span>
							{names[id]()}
						</span>

						{#if id === frame}
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
				{m['session.frame.note']()}
			</p>
		</aside>
	</div>

	<div class="sticky bottom-0 shrink-0 border-t border-[#2a2a28] bg-background p-4 rail:hidden">
		{@render cta()}
	</div>
</div>
