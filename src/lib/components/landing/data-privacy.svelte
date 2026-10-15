<script lang="ts">
	import RiBrushLine from 'remixicon-svelte/icons/brush-line'
	import RiEraserLine from 'remixicon-svelte/icons/eraser-line'
	import RiRefreshLine from 'remixicon-svelte/icons/refresh-line'
	import { m } from '$lib/paraglide/messages'
	import SectionHeading from './section-heading.svelte'

	const tips = [
		{ title: m['landing.data.tips.save.title'], body: m['landing.data.tips.save.body'] },
		{ title: m['landing.data.tips.share.title'], body: m['landing.data.tips.share.body'] },
		{ title: m['landing.data.tips.clear.title'], body: m['landing.data.tips.clear.body'] }
	]

	const card = 'row-span-3 grid grid-rows-subgrid gap-3.5 p-7'
	const header = 'flex items-center justify-between gap-3 self-start'
	const time = 'font-mono text-xs tracking-[0.14em] uppercase'
	const heading = 'm-0 mt-5 self-end font-display text-[26px] leading-none font-extrabold uppercase font-stretch-112%'
	const body = 'm-0 text-[15px] leading-[1.55] text-body'
</script>

<section
	id="data"
	class="flex flex-col items-center gap-12 bg-paper-3 px-6 pt-20 pb-20 text-center text-foreground tablet:px-20 rail:px-30 rail:pt-28 rail:pb-25"
>
	<SectionHeading
		frame={6}
		label={m['landing.data.label']()}
		title={m['landing.data.title']()}
		accent={m['landing.data.title_accent']()}
		description={m['landing.data.description']()}
		titleClass="mobile:[--title-size:44px]"
	/>

	<div class="flex w-full max-w-300 flex-col gap-3.5">
		<div aria-hidden="true" class="flex items-center gap-4 font-mono text-xs tracking-[0.14em]">
			<span>{m['landing.data.timeline_start']()}</span>
			<span class="h-2.5 grow bg-[repeating-linear-gradient(90deg,var(--ink)_0_1px,transparent_1px_12px)] opacity-50"
			></span>
			<span class="text-primary-text">{m['landing.data.timeline_end']()}</span>
		</div>

		<ol
			aria-label={m['landing.data.timeline_label']()}
			class="grid gap-4 text-left rail:grid-cols-[1fr_1.4fr_1fr] desktop:grid-cols-[300px_minmax(0,1fr)_300px]"
		>
			<li class="{card} border-2 border-ink">
				<div class={header}>
					<span class={time}>{m['landing.data.device.time']()}</span>
					<RiBrushLine aria-hidden="true" class="size-7 shrink-0" />
				</div>
				<h3 class={heading}>{m['landing.data.device.title']()}</h3>
				<p class={body}>{m['landing.data.device.body']()}</p>
			</li>

			<li class="{card} dark bg-background px-8 text-foreground">
				<div class={header}>
					<span class="{time} flex items-center gap-2.5">
						<span
							aria-hidden="true"
							class="size-2 shrink-0 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
						></span>
						{m['landing.data.tab.time']()}
					</span>
					<RiRefreshLine aria-hidden="true" class="size-7 shrink-0" />
				</div>
				<h3 class={heading}>{m['landing.data.tab.title']()}</h3>
				<p class="{body} max-w-115">{m['landing.data.tab.body']()}</p>
			</li>

			<li class="{card} border-2 border-dashed border-ink">
				<div class={header}>
					<span class="{time} text-primary-text">{m['landing.data.cleared.time']()}</span>
					<RiEraserLine aria-hidden="true" class="size-7 shrink-0" />
				</div>
				<h3 class={heading}>{m['landing.data.cleared.title']()}</h3>
				<p class={body}>{m['landing.data.cleared.body']()}</p>
			</li>
		</ol>
	</div>

	<ul class="grid w-full max-w-300 gap-6 text-left tablet:grid-cols-3 tablet:gap-8 rail:gap-12">
		{#each tips as tip, index (index)}
			<li class="flex flex-col gap-2 border-t-2 border-ink pt-4">
				<span class="font-mono text-xs tracking-[0.14em] uppercase">{tip.title()}</span>
				<span class={body}>{tip.body()}</span>
			</li>
		{/each}
	</ul>
</section>
