<script lang="ts">
	import RiBatteryFill from 'remixicon-svelte/icons/battery-fill'
	import LangSwitch from '$lib/components/molecules/lang-switch.svelte'
	import Logo from '$lib/components/atoms/logo.svelte'
	import SessionShutter from '$lib/components/organisms/session-shutter.svelte'
	import { m } from '$lib/paraglide/messages'
	import Corners from '$lib/components/atoms/corners.svelte'
	import { FRAME_COUNT } from './section-heading.svelte'

	const dial = [
		{ href: '#flow', stop: '-2', label: m['common.nav.flow'] },
		{ href: '#frames', stop: '-1', label: m['common.nav.frames'] },
		null,
		{ href: '#editor', stop: '+1', label: m['common.nav.editor'] },
		{ href: '#gif', stop: '+2', label: m['common.nav.gif'] }
	]
</script>

<section
	class="dark relative isolate flex min-h-svh flex-col overflow-hidden bg-background px-6 pt-10 pb-9 text-foreground tablet:px-16 rail:min-h-screen rail:px-30 rail:pt-13"
>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
		<span class="absolute inset-y-0 left-1/3 w-px bg-foreground/8"></span>
		<span class="absolute inset-y-0 left-2/3 w-px bg-foreground/8"></span>
		<span class="absolute inset-x-0 top-1/3 h-px bg-foreground/8"></span>
		<span class="absolute inset-x-0 top-2/3 h-px bg-foreground/8"></span>
	</div>

	<Corners inset="clamp(12px, 2.25vw, 32px)" size="clamp(28px, 4vw, 56px)" class="-z-10 text-foreground" />

	<header
		class="relative flex items-center justify-between gap-4 font-mono text-xs tracking-[0.14em] tablet:text-[13px]"
	>
		<span class="flex items-center gap-2.5">
			<span class="size-2.5 rounded-full bg-primary"></span>
			REC 00:00:24
		</span>

		<span class="absolute left-1/2 -translate-x-1/2 uppercase mobile:hidden">
			{m['common.brand']()}
		</span>

		<span class="flex items-center gap-3.5">
			<span class="hidden rail:inline">ISO 100 · f/5.6</span>

			<LangSwitch>
				<span class="mr-2 text-[11px] text-muted-foreground">LANG</span>
			</LangSwitch>

			<RiBatteryFill aria-hidden="true" class="size-6 mobile:hidden" />
		</span>
	</header>

	<div class="flex flex-1 flex-col items-center justify-center gap-4.5 py-10 text-center rail:py-6">
		<div class="relative flex size-28 items-center justify-center">
			<Corners size="18px" weight="2px" class="text-primary" />
			<Logo label={m['common.logo_label']()} class="size-18 text-paper" />
		</div>

		<span class="-mt-3 font-mono text-xs tracking-[0.2em] text-primary-text">{m['landing.hero.af']()} </span>

		<h1
			class="m-0 font-display text-[clamp(3rem,11vw,6.5rem)] leading-[0.88] font-black tracking-[-0.01em] uppercase font-stretch-118%"
		>
			{m['landing.hero.title_1']()}<br />{m['landing.hero.title_2']()}<br />
			<span class="text-primary">{m['landing.hero.title_3']()}</span>
		</h1>

		<p class="m-0 max-w-140 text-lg leading-[1.55] text-body tablet:text-[19px]">
			{m['landing.hero.sub']()}
		</p>

		<a
			href="#data"
			class="inline-flex min-h-11 items-center gap-2.5 border-[1.5px] border-[#5a5853] px-4.5 py-2 font-mono text-xs tracking-[0.12em] text-foreground uppercase no-underline hover:border-foreground"
		>
			<span
				aria-hidden="true"
				class="size-2 shrink-0 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
			></span>
			{m['landing.hero.keep']()}
		</a>

		<SessionShutter label={m['landing.hero.shutter_aria']()} idle={m['landing.hero.shutter_idle']()} />
	</div>

	<footer
		class="grid grid-cols-1 items-end gap-4 font-mono text-xs tracking-[0.14em] text-muted-foreground rail:grid-cols-[1fr_minmax(0,720px)_1fr]"
	>
		<span class="hidden pb-5.5 rail:block">{m['landing.hero.free']()}</span>

		<nav aria-label={m['common.nav.aria']()} class="flex w-full flex-col items-stretch gap-1.5">
			<div class="grid grid-cols-5 items-end uppercase">
				{#each dial as stop, i (i)}
					{#if stop}
						<a
							href={stop.href}
							class="flex min-h-11 flex-col items-center justify-end gap-0.5 text-foreground no-underline hover:text-primary-text"
						>
							<span class="text-[11px] text-muted-foreground">{stop.stop}</span>
							<span class="text-[13px] tracking-widest">{stop.label()}</span>
						</a>
					{:else}
						<span
							aria-hidden="true"
							class="ml-px flex min-h-11 flex-col items-center justify-end gap-0.5 tracking-normal text-primary-text"
						>
							<span class="text-[11px]">0</span>
							<span class="text-[13px]">●</span>
						</span>
					{/if}
				{/each}
			</div>

			<div
				aria-hidden="true"
				class="h-2 bg-[linear-gradient(90deg,transparent_5.5px,var(--foreground)_5.5px_6.5px,transparent_6.5px)] bg-size-[12px_100%] bg-center bg-repeat-x opacity-55"
			></div>

			<div
				aria-hidden="true"
				class="size-0 self-center border-x-7 border-b-9 border-x-transparent border-b-primary"
			></div>
		</nav>

		<span class="hidden pb-5.5 text-right rail:block">FRAME 01 / {String(FRAME_COUNT).padStart(2, '0')}</span>
	</footer>
</section>
