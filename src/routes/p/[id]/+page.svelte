<script lang="ts">
	import { enhance } from '$app/forms'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import RiDeleteBinLine from 'remixicon-svelte/icons/delete-bin-line'
	import RiDownload2Line from 'remixicon-svelte/icons/download-2-line'
	import Corners from '$lib/components/atoms/corners.svelte'
	import Logo from '$lib/components/atoms/logo.svelte'
	import LangSwitch from '$lib/components/molecules/lang-switch.svelte'
	import { Button } from '$lib/components/ui/button'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { hms, useClock } from '$lib/clock.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { ShareAsset, ShareCategory } from '$lib/server/share'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	const ORDER: ShareCategory[] = ['plain', 'frame', 'filtered', 'frame-filtered']
	const EDITED: ShareCategory[] = ['filtered', 'frame-filtered']

	const home = localizeHref('/').replace(/(.)\/$/, '$1')
	const links = [
		{ href: localizeHref('/legal/privacy'), label: m['common.footer.privacy'] },
		{ href: localizeHref('/legal/deletion'), label: m['legal.deletion.title'] },
		{ href: localizeHref('/legal/contact'), label: m['legal.contact.title'] }
	]
	const labels: Record<ShareCategory, () => string> = {
		plain: m['share.categories.plain'],
		frame: m['share.categories.frame'],
		filtered: m['share.categories.filtered'],
		'frame-filtered': m['share.categories.frame_filtered']
	}

	const clock = useClock()

	let picked = $state<ShareCategory | null>(null)
	let confirming = $state(false)
	let deleting = $state(false)

	const share = $derived(data.deleted ? null : data)
	const assets = $derived(share?.assets ?? [])
	const available = $derived(ORDER.filter((c) => assets.some((a) => a.category === c)))
	const active = $derived(picked && available.includes(picked) ? picked : available[0])
	const framed = $derived(active === 'frame' || active === 'frame-filtered')
	const group = $derived(assets.filter((a) => a.category === active))
	const stills = $derived(group.filter((a) => a.index && a.kind !== 'gif'))
	const gifs = $derived(group.filter((a) => a.index && a.kind === 'gif'))
	const sheet = $derived(group.find((a) => !a.index && a.kind !== 'gif'))
	const sheetGif = $derived(framed ? group.find((a) => !a.index && a.kind === 'gif') : undefined)
	const loop = $derived.by(() => {
		const slideshows = assets.filter((a) => a.kind === 'gif' && !a.index && !a.category.startsWith('frame'))
		const edited = active && EDITED.includes(active)
		return slideshows.find((a) => a.category === (edited ? 'filtered' : 'plain')) ?? slideshows[0]
	})
	const remaining = $derived(share ? share.expiresAt - clock.now : 0)
	const left = $derived(share ? Math.max(0, remaining / (share.expiresAt - share.createdAt)) : 0)
	const code = $derived(share?.id.toUpperCase() ?? '')

	const caption = $derived.by(() => {
		if (!share) return ''
		if (active === 'plain') return m['share.captions.plain']({ n: share.slots })
		if (active === 'frame') return m['share.captions.frame']({ size: share.frame?.size ?? '' })
		if (active === 'filtered') return m['share.captions.filtered']()
		return m['share.captions.frame_filtered']()
	})

	const src = (a: ShareAsset) => (share ? `/p/${share.id}/${a.key}.${a.kind}` : '')
	const pad = (n = 0) => String(n).padStart(2, '0')

	const mono = 'font-mono tracking-[0.14em] uppercase'
	const bracket = 'h-3.5 w-1.75 border-2 border-current'
	const display = 'font-display font-black uppercase font-stretch-118%'
</script>

<svelte:head>
	<title>{m['share.meta_title']()}</title>
	<meta name="description" content={m['share.meta_description']()} />
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

{#snippet eyebrow(cls: string)}
	<p class="{mono} m-0 items-center gap-2.5 text-[11px] tracking-[0.16em] rail:text-xs {cls}">
		<span aria-hidden="true" class="{bracket} border-r-0"></span>
		{m['share.eyebrow']({ code })}
		<span aria-hidden="true" class="{bracket} border-l-0"></span>
	</p>
{/snippet}

<div class="dark flex min-h-svh flex-col bg-background text-foreground scheme-dark">
	<header
		class="grid h-15 shrink-0 grid-cols-[1fr_auto] items-center border-b border-[#2a2a28] pr-3 pl-4 rail:h-18 rail:grid-cols-[1fr_auto_1fr] rail:px-10"
	>
		<a href={home} class="flex items-center gap-2.5 text-foreground no-underline rail:gap-3">
			<Logo class="size-7.5 shrink-0 text-paper rail:size-9" />
			<span class="font-display text-sm font-extrabold tracking-[0.04em] uppercase font-stretch-118% rail:text-base">
				{m['common.brand']()}
			</span>
		</a>

		{#if share}{@render eyebrow('hidden rail:flex')}{/if}

		<LangSwitch class="justify-self-end text-[11px] rail:text-xs" />
	</header>

	{#if !share}
		<main class="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
			<span class="{mono} flex items-center gap-2 text-[11px] text-muted-foreground">
				<span aria-hidden="true" class="size-1.75 rounded-full bg-primary"></span>
				{m['share.deleted_hud']()}
			</span>

			<h1 class="m-0 text-[clamp(2.5rem,8vw,4rem)] leading-[0.92] {display}">{m['share.deleted_title']()}</h1>
			<p class="m-0 max-w-120 text-base leading-[1.55] text-body">{m['share.deleted_body']()}</p>

			<Button
				href="{home}#start"
				class="h-14 gap-2.5 px-7 font-display text-[15px] font-extrabold tracking-[0.06em] font-stretch-112%"
			>
				{m['share.again']()}
				<RiArrowRightLine aria-hidden="true" class="size-4.5" />
			</Button>
		</main>
	{:else}
		<div class="flex flex-1 flex-col gap-4 px-4 pt-6 rail:min-h-0 rail:flex-row rail:gap-16 rail:px-16 rail:py-12">
			{@render eyebrow('order-1 flex rail:hidden')}

			<aside class="contents rail:flex rail:w-100 rail:shrink-0 rail:flex-col rail:gap-5">
				<h1
					class="order-2 m-0 text-[40px] leading-[0.92] font-stretch-115% rail:text-[64px] rail:leading-[0.9] rail:font-stretch-118% {display}"
				>
					{m['share.title']()}
					<span class="text-primary rail:block">{m['share.title_accent']()}</span>
				</h1>

				<div
					class="order-3 flex flex-col gap-1 border-[1.5px] border-primary px-3.5 py-3 rail:gap-1.5 rail:px-5 rail:py-4.5"
				>
					<span class="{mono} flex items-center gap-2 text-xs tracking-[0.12em] rail:text-primary-text">
						<span aria-hidden="true" class="size-2 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
						></span>
						<span class="tabular-nums rail:hidden">{m['share.available_inline']({ time: hms(remaining) })}</span>
						<span class="hidden rail:inline">{m['share.available']()}</span>
					</span>

					<span class="hidden text-[52px] leading-none tabular-nums rail:block {display}">{hms(remaining)}</span>

					<span class="text-[13px] leading-[1.45] text-body rail:text-sm rail:leading-normal">
						<span class="rail:hidden">{m['share.expiry_body_short']()}</span>
						<span class="hidden rail:inline">{m['share.expiry_body']()}</span>
					</span>

					<div aria-hidden="true" class="mt-1.5 hidden h-1 bg-[#2a2a28] rail:block">
						<div class="h-full bg-primary" style:width="{left * 100}%"></div>
					</div>
				</div>

				{#if loop}
					<div class="order-5 flex items-center gap-3 bg-[#151514] p-2.5 rail:gap-3.5 rail:p-3">
						<img
							src={src(loop)}
							alt={m['share.gif_alt']()}
							class="size-16 shrink-0 bg-[#0a0a09] object-cover object-top rail:size-18"
						/>

						<div class="flex min-w-0 flex-col gap-0.5">
							<span class="font-display text-base font-extrabold rail:text-[17px]">{m['share.gif_title']()}</span>
							<span class="{mono} text-[11px] tracking-normal text-muted-foreground">
								{m['share.gif_meta']({ n: share.slots })}
							</span>
						</div>
					</div>
				{/if}

				<div class="order-6 flex flex-col gap-2">
					<Button
						href="/p/{share.id}/download.zip"
						download
						class="h-13.5 gap-2.5 font-mono text-xs font-medium tracking-[0.1em] rail:h-14 rail:text-[13px]"
					>
						<RiDownload2Line aria-hidden="true" class="size-4.5" />
						{m['share.download']()}
					</Button>

					<p class="m-0 text-center text-xs text-muted-foreground">{m['share.zip_note']()}</p>
				</div>

				<div class="order-7 flex flex-col gap-2.5">
					{#if confirming}
						<p class="m-0 text-[13px] leading-normal text-body" role="alert">{m['share.delete_body']()}</p>

						<form
							method="POST"
							action="?/delete"
							use:enhance={() => {
								deleting = true
								return async ({ update }) => {
									await update()
									deleting = false
								}
							}}
							class="flex flex-col gap-2.5"
						>
							<Button
								type="submit"
								disabled={deleting}
								class="h-auto min-h-12 gap-2 font-mono font-medium tracking-[0.1em] whitespace-normal"
							>
								<RiDeleteBinLine aria-hidden="true" class="size-4" />
								{m['share.delete_confirm']()}
							</Button>

							<Button
								variant="outline"
								onclick={() => (confirming = false)}
								disabled={deleting}
								class="h-auto min-h-12 border-[#3a3936] font-mono font-normal tracking-[0.1em] whitespace-normal"
							>
								{m['share.cancel']()}
							</Button>
						</form>
					{:else}
						<Button
							variant="outline"
							onclick={() => (confirming = true)}
							class="h-auto min-h-12 gap-2.5 border-[#3a3936] font-mono font-normal tracking-[0.1em] whitespace-normal"
						>
							<RiDeleteBinLine aria-hidden="true" class="size-4" />
							{m['share.delete']()}
						</Button>
					{/if}
				</div>

				<nav
					aria-label={m['share.footer_aria']()}
					class="order-8 flex flex-wrap justify-center gap-x-4 pt-3 pb-6 font-mono text-[11px] tracking-[0.1em] uppercase rail:mt-auto rail:justify-start rail:gap-x-5 rail:p-0"
				>
					{#each links as link (link.href)}
						<a href={link.href} class="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
							{link.label()}
						</a>
					{/each}
				</nav>
			</aside>

			<main class="order-4 flex min-w-0 flex-col gap-4 rail:flex-1 rail:gap-4.5">
				<ToggleGroup.Root
					type="single"
					spacing={2}
					aria-label={m['share.versions']()}
					bind:value={() => active ?? '', (next) => next && (picked = next as ShareCategory)}
					class="-mr-4 w-auto [scrollbar-width:none] overflow-x-auto pr-4 rail:mr-0 rail:pr-0"
				>
					{#each available as category (category)}
						<ToggleGroup.Item
							value={category}
							class="relative h-11 shrink-0 gap-1.5 border-[1.5px] border-paper px-3.5 font-mono text-xs font-normal tracking-[0.06em] normal-case hover:bg-paper/10 data-[state=on]:bg-paper data-[state=on]:text-ink rail:px-4.5 rail:text-[13px]"
						>
							{labels[category]()}
							{#if EDITED.includes(category)}
								<span aria-hidden="true" class="size-1.5 rounded-full bg-primary"></span>
								<span class="sr-only">({m['share.edited']()})</span>
							{/if}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>

				<p class="m-0 text-[13px] leading-normal text-muted-foreground rail:text-sm">{caption}</p>

				<section
					aria-label={active ? labels[active]() : undefined}
					class="relative flex flex-col items-center justify-center gap-5 rail:min-h-0 rail:flex-1 rail:overflow-y-auto rail:bg-[#151514] rail:p-8 {framed
						? 'bg-[#151514] px-3 py-4'
						: ''}"
				>
					<Corners inset="14px" size="24px" weight="2px" class="hidden text-[#3a3936] rail:block" />

					{#if framed && sheet}
						<div class="flex w-full flex-wrap items-center justify-center gap-x-10 gap-y-6">
							<div class="flex max-w-full items-start justify-center gap-3 rail:gap-6">
								{#each [sheet, sheetGif].filter((a) => a !== undefined) as a (a.key)}
									<figure class="m-0 flex min-w-0 flex-col items-center gap-2">
										<img
											src={src(a)}
											alt={a.kind === 'gif'
												? m['share.sheet_gif_alt']({ version: labels[a.category]() })
												: m['share.sheet_alt']({ version: labels[a.category]() })}
											class="block h-auto max-h-(--sh) w-auto max-w-full object-contain [--sh:22rem] rail:[--sh:min(540px,calc(100svh-360px))]"
										/>
										<figcaption class="{mono} text-[10px] text-muted-foreground rail:text-[11px]">
											{a.kind === 'gif' ? m['share.kind_gif']() : m['share.kind_photo']()}
										</figcaption>
									</figure>
								{/each}
							</div>

							{#if share.frame}
								<dl class="m-0 hidden grid-cols-[auto_1fr] content-center gap-x-6 gap-y-2.5 text-[15px] desktop:grid">
									{#each [[m['share.facts.version'](), labels[sheet.category]()], [m['share.facts.size'](), `${share.frame.size} · ${share.frame.cm}`], [m['share.facts.format'](), m['share.facts.format_value']()], [m['share.facts.frame'](), share.frame.name]] as [term, value] (term)}
										<dt class="pt-0.75 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
											{term}
										</dt>
										<dd class="m-0">{value}</dd>
									{/each}
								</dl>
							{/if}
						</div>
					{:else}
						{#each [[m['share.kind_photo'](), stills], [m['share.gifs_heading'](), gifs]] as const as [heading, items] (heading)}
							{#if items.length}
								<div class="flex w-full flex-col gap-2.5">
									<h3 class="{mono} m-0 text-[11px] font-normal text-muted-foreground">
										{heading} · {items.length}
									</h3>

									<ul
										class="m-0 grid w-full list-none grid-cols-2 gap-2.5 p-0 rail:grid-cols-(--cols) rail:gap-4"
										style:--cols="repeat({Math.min(items.length, 4)}, minmax(0, 1fr))"
									>
										{#each items as a (a.key)}
											<li class="relative overflow-hidden bg-[#8a7560]">
												<img
													src={src(a)}
													alt={a.kind === 'gif'
														? m['share.gif_item_alt']({ n: a.index ?? 0 })
														: m['share.photo_alt']({ n: a.index ?? 0 })}
													loading="lazy"
													class="block h-auto w-full"
												/>
												<span
													aria-hidden="true"
													class="absolute top-2 left-2 bg-ink px-1.5 py-0.5 font-mono text-[10px] rail:top-2.5 rail:left-2.5 rail:px-1.75 rail:text-[11px]"
												>
													{pad(a.index)}{a.kind === 'gif' ? ' · GIF' : ''}
												</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/each}
					{/if}
				</section>
			</main>
		</div>
	{/if}
</div>
