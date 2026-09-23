<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'
	import Corners from './corners.svelte'
	import SectionHeading from './section-heading.svelte'

	const poses = [
		{ delay: '0s', class: 'bg-[#3a3936] text-body' },
		{ delay: '-1.5s', class: 'bg-[#5e5c57] text-paper' },
		{ delay: '-1s', class: 'bg-primary text-primary-foreground' },
		{ delay: '-0.5s', class: 'bg-paper-2 text-ink' }
	]

	const item =
		'h-auto border-0 px-4 py-2.5 font-mono text-[13px] font-normal tracking-[0.1em] hover:bg-foreground/10 data-[state=on]:bg-foreground data-[state=on]:text-background'

	let format = $state('gif')
	const animated = $derived(format === 'gif')
</script>

<section
	id="gif"
	class="dark flex flex-col items-center gap-12 bg-background px-6 pt-20 pb-20 text-center text-foreground sm:px-20 lg:pt-28 lg:pb-25"
>
	<SectionHeading
		frame={5}
		label={m.gif_label()}
		title={m.gif_title()}
		accent={m.gif_title_accent()}
		description={m.gif_description()}
	/>

	<div class="relative my-4.5 aspect-340/420 w-[calc(100%-36px)] max-w-85 shrink-0">
		<Corners inset="-18px" size="30px" class="text-foreground" />
		{#each animated ? poses : poses.slice(0, 1) as pose, i (i)}
			<div
				class={cn(
					'absolute inset-0 flex items-center justify-center',
					animated && 'animate-gif-frame opacity-0 motion-reduce:animate-none',
					animated && i === 0 && 'motion-reduce:opacity-100',
					pose.class
				)}
				style:animation-delay={pose.delay}
			>
				<span class="font-mono text-xs">{m.gif_pose({ n: i + 1 })}</span>
				<span class="absolute right-4 bottom-3.5 font-mono text-xs">{i + 1}/{poses.length}</span>
			</div>
		{/each}
		{#if animated}
			<span
				class="absolute top-3.5 left-4 flex items-center gap-2 bg-background px-2 py-1 font-mono text-xs tracking-[0.12em] text-foreground uppercase"
			>
				<span class="size-2 rounded-full bg-primary"></span>{m.gif_loop()}
			</span>
		{/if}
	</div>

	<div
		class="flex flex-wrap items-center justify-center gap-3 font-mono text-[13px] tracking-widest"
	>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			aria-label={m.gif_format()}
			bind:value={() => format, (next) => next && (format = next)}
			class="border-[1.5px] border-foreground"
		>
			<ToggleGroup.Item value="photo" class={item}>{m.gif_photo()}</ToggleGroup.Item>
			<ToggleGroup.Item value="gif" class={item}>{m.gif_gif()}</ToggleGroup.Item>
		</ToggleGroup.Root>
		<span class="text-muted-foreground uppercase">{m.gif_speed()}</span>
	</div>
</section>
