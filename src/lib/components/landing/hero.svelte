<script lang="ts">
	import { onDestroy } from 'svelte'
	import { page } from '$app/state'
	import RiBatteryFill from 'remixicon-svelte/icons/battery-fill'
	import { Button } from '$lib/components/ui/button'
	import Logo from '$lib/components/logo.svelte'
	import { m } from '$lib/paraglide/messages'
	import { getLocale, localizeHref, type Locale } from '$lib/paraglide/runtime'
	import { cn } from '$lib/utils'
	import Corners from './corners.svelte'

	type Phase = 3 | 2 | 1 | 'flash' | null

	const STEP_MS = 700
	const languages: Locale[] = ['id', 'en']

	let phase = $state<Phase>(null)
	let timers: ReturnType<typeof setTimeout>[] = []

	function shoot() {
		if (phase !== null) return
		const sequence: Phase[] = [3, 2, 1, 'flash', null]
		timers = sequence.map((next, i) => setTimeout(() => (phase = next), i * STEP_MS))
	}

	onDestroy(() => timers.forEach(clearTimeout))

	const dial = [
		{ href: '#flow', stop: '-2', label: m.nav_flow },
		{ href: '#frames', stop: '-1', label: m.nav_frames },
		null,
		{ href: '#editor', stop: '+1', label: m.nav_editor },
		{ href: '#gif', stop: '+2', label: m.nav_gif }
	]
</script>

<section
	class="dark relative isolate flex min-h-svh flex-col overflow-hidden bg-background px-6 pt-10 pb-9 text-foreground sm:px-16 lg:min-h-screen lg:px-30 lg:pt-13"
>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
		<span class="absolute inset-y-0 left-1/3 w-px bg-foreground/8"></span>
		<span class="absolute inset-y-0 left-2/3 w-px bg-foreground/8"></span>
		<span class="absolute inset-x-0 top-1/3 h-px bg-foreground/8"></span>
		<span class="absolute inset-x-0 top-2/3 h-px bg-foreground/8"></span>
	</div>
	<Corners
		inset="clamp(12px, 2.25vw, 32px)"
		size="clamp(28px, 4vw, 56px)"
		class="-z-10 text-foreground"
	/>

	<header
		class="relative flex items-center justify-between gap-4 font-mono text-xs tracking-[0.14em] sm:text-[13px]"
	>
		<span class="flex items-center gap-2.5">
			<span class="size-2.5 rounded-full bg-primary"></span>
			REC 00:00:24
		</span>

		<span class="absolute left-1/2 -translate-x-1/2 uppercase max-md:hidden">
			{m.brand()}
		</span>

		<span class="flex items-center gap-3.5">
			<span class="max-lg:hidden">ISO 100 · f/5.6</span>

			<span role="group" aria-label={m.lang_label()} class="flex items-center">
				<span class="mr-2 text-[11px] text-muted-foreground">LANG</span>

				{#each languages as locale (locale)}
					{@const active = getLocale() === locale}

					<Button
						href={localizeHref(page.url.pathname, { locale })}
						data-sveltekit-reload
						hreflang={locale}
						lang={locale}
						aria-current={active ? 'true' : undefined}
						variant="ghost"
						size="icon-lg"
						class="font-mono font-normal tracking-widest hover:bg-transparent"
					>
						<span
							class={cn(
								'border-[1.5px] border-foreground px-2 py-1 transition-colors',
								active ? 'bg-foreground text-background' : 'text-foreground hover:bg-foreground/15'
							)}
						>
							{locale.toUpperCase()}
						</span>
					</Button>
				{/each}
			</span>

			<RiBatteryFill aria-hidden="true" class="size-6 max-sm:hidden" />
		</span>
	</header>

	<div class="flex flex-1 flex-col items-center justify-center gap-4.5 py-10 text-center lg:py-6">
		<div class="relative flex size-28 items-center justify-center">
			<Corners size="18px" weight="2px" class="text-primary" />
			<Logo label={m.logo_label()} class="size-18 text-paper" />
		</div>
		<span class="-mt-3 font-mono text-xs tracking-[0.2em] text-primary">{m.hero_af()}</span>
		<h1
			class="m-0 font-display text-[clamp(3rem,11vw,6.5rem)] leading-[0.88] font-black tracking-[-0.01em] uppercase font-stretch-118%"
		>
			{m.hero_title_1()}<br />{m.hero_title_2()}<br />
			<span class="text-primary">{m.hero_title_3()}</span>
		</h1>
		<p class="m-0 max-w-140 text-lg leading-[1.55] text-body sm:text-[19px]">
			{m.hero_sub()}
		</p>
		<div class="flex flex-col items-center gap-3">
			<Button
				onclick={shoot}
				aria-label={m.hero_shutter_aria()}
				aria-disabled={phase !== null}
				variant="ghost"
				class="size-22 rounded-full border-3 border-foreground p-0 hover:bg-transparent"
			>
				<span
					class="block size-16 rounded-full bg-primary transition-transform group-active/button:scale-90"
				></span>
			</Button>
			<span aria-live="polite" class="font-mono text-xs tracking-[0.16em] text-muted-foreground">
				{phase === null ? m.hero_shutter_idle() : m.hero_shutter_busy()}
			</span>
		</div>
	</div>

	<footer
		class="grid grid-cols-1 items-end gap-4 font-mono text-xs tracking-[0.14em] text-muted-foreground lg:grid-cols-[1fr_minmax(0,720px)_1fr]"
	>
		<span class="pb-5.5 max-lg:hidden">{m.hero_free()}</span>
		<nav aria-label={m.nav_aria()} class="flex w-full flex-col items-stretch gap-1.5">
			<div class="grid grid-cols-5 items-end uppercase">
				{#each dial as stop, i (i)}
					{#if stop}
						<a
							href={stop.href}
							class="flex min-h-11 flex-col items-center justify-end gap-0.5 text-foreground no-underline hover:text-primary"
						>
							<span class="text-[11px] text-muted-foreground">{stop.stop}</span>
							<span class="text-[13px] tracking-widest">{stop.label()}</span>
						</a>
					{:else}
						<span
							aria-hidden="true"
							class="ml-px flex min-h-11 flex-col items-center justify-end gap-0.5 tracking-normal text-primary"
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
		<span class="pb-5.5 text-right max-lg:hidden">FRAME 01 / 06</span>
	</footer>

	{#if typeof phase === 'number'}
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-ink/72"
		>
			<span
				class="font-display text-[clamp(10rem,26vw,23.75rem)] leading-none font-black text-primary font-stretch-125%"
			>
				{phase}
			</span>
		</div>
	{:else if phase === 'flash'}
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 z-20 flex animate-shutter-flash items-center justify-center bg-white text-ink motion-reduce:animate-none motion-reduce:opacity-90"
		>
			<span
				class="font-display text-[clamp(6rem,14vw,12.5rem)] leading-none font-black font-stretch-125%"
			>
				{m.hero_click()}
			</span>
		</div>
	{/if}
</section>
