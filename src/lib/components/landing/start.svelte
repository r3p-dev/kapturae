<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { m } from '$lib/paraglide/messages'
	import Corners from './corners.svelte'
	import SectionHeading from './section-heading.svelte'

	const facts = [
		{ term: m['landing.cta.cost'], value: m['landing.cta.cost_value'] },
		{ term: m['landing.cta.needs'], value: m['landing.cta.needs_value'] },
		{ term: m['landing.cta.output'], value: m['landing.cta.output_value'] },
		{ term: m['landing.cta.stored'], value: m['landing.cta.stored_value'] }
	]
</script>

<section
	id="start"
	class="relative flex flex-col items-center gap-11 bg-background px-6 pt-20 pb-20 text-center text-foreground tablet:px-20 rail:pt-28 rail:pb-25"
>
	<Corners inset="clamp(12px, 2.25vw, 32px)" size="clamp(24px, 3vw, 40px)" class="text-ink" />

	<SectionHeading
		frame={7}
		label={m['landing.cta.label']()}
		title={[m['landing.cta.title_1'](), m['landing.cta.title_2']()]}
		titleClass="leading-[0.9] rail:text-[96px]"
	/>

	<Button
		href="#start"
		variant="ghost"
		aria-label={m['landing.cta.aria']()}
		class="size-55 rounded-full border-4 border-ink p-0 hover:bg-transparent"
	>
		<span
			class="flex size-44 items-center justify-center rounded-full bg-primary font-display text-[26px] font-black tracking-[0.06em] text-primary-foreground uppercase font-stretch-118% transition-transform group-hover/button:scale-95"
		>
			{m['landing.cta.button']()}
		</span>
	</Button>

	<dl class="grid w-full max-w-280 gap-8 tablet:grid-cols-2 tablet:gap-12 rail:grid-cols-4">
		{#each facts as fact, i (i)}
			<div class="flex flex-col gap-1.5">
				<dt class="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
					{fact.term()}
				</dt>

				<dd class="m-0 font-display text-[22px] font-extrabold font-stretch-112%">
					{fact.value()}
				</dd>
			</div>
		{/each}
	</dl>
</section>
