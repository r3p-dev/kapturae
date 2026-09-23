<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/state'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import Corners from '$lib/components/landing/corners.svelte'
	import { Button } from '$lib/components/ui/button'
	import Logo from '$lib/components/logo.svelte'
	import { m } from '$lib/paraglide/messages'
	import { getLocale, localizeHref } from '$lib/paraglide/runtime'

	type Action = { label: string; href?: string; onclick?: () => void }
	type Variant = { hud: string; title: string; body: string; primary: Action; secondary: Action }

	const home = localizeHref('/').replace(/(.)\/$/, '$1')
	const start = `${home}#start`
	const privacy = `${home}#data`
	const contact = 'https://instagram.com'

	const bars = ['#6e6c67', '#c9962e', '#2e7d7a', '#2f6b3a', '#7a4a86', '#8e1b12', '#1b2e55']

	const status = $derived(page.status)

	const variant = $derived.by((): Variant => {
		if (status === 404)
			return {
				hud: m['error.not_found.hud'](),
				title: m['error.not_found.title'](),
				body: m['error.not_found.body'](),
				primary: { label: m['error.not_found.primary'](), href: home },
				secondary: { label: m['error.not_found.secondary'](), href: start }
			}

		if (status === 410)
			return {
				hud: m['error.gone.hud'](),
				title: m['error.gone.title'](),
				body: m['error.gone.body'](),
				primary: { label: m['error.gone.primary'](), href: start },
				secondary: { label: m['error.gone.secondary'](), href: privacy }
			}

		return {
			hud: m['error.server.hud'](),
			title: m['error.server.title'](),
			body: m['error.server.body'](),
			primary: { label: m['error.server.primary'](), onclick: () => location.reload() },
			secondary: { label: m['error.server.secondary'](), href: contact }
		}
	})

	let time = $state<string>()
	onMount(() => {
		time = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
	})

	const meta = $derived([m['error.code']({ status }), time, page.error?.id].filter(Boolean).join(' · '))

	const nav = [
		{ href: contact, label: m['common.footer.instagram'] },
		{ href: privacy, label: m['common.footer.privacy'] },
		{ href: home, label: m['error.nav_home'] }
	]
</script>

<svelte:head>
	<title>{m['error.meta_title']({ status })}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div
	class="dark relative isolate flex min-h-svh flex-col overflow-hidden bg-background px-6 pt-10 pb-9 text-foreground tablet:px-16 rail:min-h-screen rail:px-30 rail:pt-13"
>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
		<span class="absolute inset-y-0 left-1/3 w-px bg-foreground/8"></span>
		<span class="absolute inset-y-0 left-2/3 w-px bg-foreground/8"></span>
		<span class="absolute inset-x-0 top-1/3 h-px bg-foreground/8"></span>
		<span class="absolute inset-x-0 top-2/3 h-px bg-foreground/8"></span>
	</div>

	<Corners inset="clamp(12px, 2.25vw, 32px)" size="clamp(28px, 4vw, 56px)" class="-z-10 text-foreground" />

	<header class="flex h-18 shrink-0 items-center justify-center px-6 tablet:px-16">
		<a href={home} class="flex items-center gap-2.5 text-foreground no-underline">
			<Logo class="size-8.5 text-paper" />
			<span class="font-display text-lg font-extrabold tracking-[0.04em] uppercase font-stretch-118%">
				{m['common.brand']()}
			</span>
		</a>
	</header>

	<main class="flex flex-1 flex-col items-center justify-center gap-6.5 px-4 py-10 text-center">
		<div class="relative aspect-7/4 w-full max-w-140 shrink-0 overflow-hidden bg-card">
			<div aria-hidden="true" class="absolute inset-0 grid grid-cols-7 opacity-50">
				{#each bars as bar (bar)}
					<span style:background={bar}></span>
				{/each}
			</div>

			<div
				aria-hidden="true"
				class="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgb(14_14_13/0.55)_0_2px,transparent_2px_5px)]"
			></div>

			<div class="absolute inset-0 flex items-center justify-center">
				<span
					class="font-display text-[clamp(6rem,28vw,12.5rem)] leading-none font-black text-paper font-stretch-125% [text-shadow:0_0_24px_rgb(14_14_13/0.9)]"
				>
					{status}
				</span>
			</div>

			<span
				class="absolute top-3 left-3 flex items-center gap-2 bg-ink px-2 py-1 font-mono text-[11px] tracking-[0.12em]"
			>
				<span aria-hidden="true" class="size-1.75 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
				></span>
				ERR {status} · {variant.hud}
			</span>
			<Corners inset="10px" size="18px" weight="2px" class="text-paper" />
		</div>

		<h1
			class="m-0 font-display text-[clamp(2.5rem,8vw,4rem)] leading-[0.92] font-black text-balance uppercase font-stretch-118%"
		>
			{variant.title}
		</h1>
		<p class="m-0 max-w-140 text-lg leading-[1.55] text-body">{variant.body}</p>

		<div class="flex flex-wrap justify-center gap-3">
			<Button
				href={variant.primary.href}
				onclick={variant.primary.onclick}
				class="h-14 gap-2.5 px-7 font-display text-[15px] font-extrabold tracking-[0.06em] font-stretch-112%"
			>
				{variant.primary.label}
				<RiArrowRightLine aria-hidden="true" class="size-4.5" />
			</Button>

			<Button
				href={variant.secondary.href}
				variant="outline"
				class="h-14 border-[1.5px] border-foreground px-7 font-display text-[15px] font-extrabold tracking-[0.06em] font-stretch-112%"
			>
				{variant.secondary.label}
			</Button>
		</div>

		<span class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{meta}</span>
	</main>

	<nav class="flex justify-center gap-5 pb-8 font-mono text-[11px] tracking-widest uppercase">
		{#each nav as link (link.href)}
			<a href={link.href} class="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
				{link.label()}
			</a>
		{/each}
	</nav>
</div>
