<script lang="ts">
	import { Badge } from '$lib/components/ui/badge'
	import { m } from '$lib/paraglide/messages'
	import SectionHeading from './section-heading.svelte'
	import RiArrowDropRightLine from 'remixicon-svelte/icons/arrow-drop-right-line'
	import RiArrowDropLeftLine from 'remixicon-svelte/icons/arrow-drop-left-line'

	function centreScroll(node: HTMLElement) {
		node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2
	}

	const sprockets =
		'h-3 shrink-0 bg-[repeating-linear-gradient(90deg,var(--ink)_0_16px,transparent_16px_32px)] mx-2'
</script>

{#snippet slots(count: number, cls: string)}
	{#each { length: count }, i (i)}<div class={cls}></div>{/each}
{/snippet}

<section
	id="frames"
	class="dark flex flex-col items-center gap-12 overflow-hidden bg-background pt-20 pb-20 text-center text-foreground lg:pt-28 lg:pb-25"
>
	<SectionHeading
		frame={3}
		label={m.frames_label()}
		title={m.frames_title()}
		description={m.frames_description()}
		class="px-6"
	/>

	<div
		{@attach centreScroll}
		class="w-full scrollbar-thin [scrollbar-color:var(--border)_transparent] overflow-x-auto overscroll-x-contain"
	>
		<div class="mx-auto flex w-max min-w-full flex-col gap-3.5 bg-card py-4.5">
			<div aria-hidden="true" class={sprockets}></div>
			<ul class="flex justify-center gap-4 px-8">
				<li class="flex flex-col items-start gap-2">
					<div class="flex h-57.5 w-65 items-center justify-center bg-muted">
						<div class="flex h-49 w-18 flex-col gap-1.25 bg-paper p-1.5">
							{@render slots(4, 'grow bg-[#5e5c57]')}
							<div class="h-3.5"></div>
						</div>
					</div>
					{@render caption('01A', m.frames_strip_4())}
				</li>
				<li class="flex flex-col items-start gap-2">
					<div class="flex h-57.5 w-65 items-center justify-center bg-muted">
						<div class="grid h-44 w-40 grid-cols-2 gap-1.5 bg-paper px-2 pt-2 pb-6">
							{@render slots(4, 'bg-[#5e5c57]')}
						</div>
					</div>
					{@render caption('02A', m.frames_grid())}
				</li>
				<li class="flex flex-col items-start gap-2">
					<div
						class="relative flex h-57.5 w-65 items-center justify-center bg-muted outline-3 -outline-offset-3 outline-primary"
					>
						<div class="h-41 w-34 bg-paper px-2.5 pt-2.5 pb-10">
							<div class="size-full bg-[#5e5c57]"></div>
						</div>
						<Badge
							class="absolute top-2.5 right-2.5 bg-primary px-2 py-1 font-mono text-[11px] font-normal tracking-widest text-primary-foreground"
						>
							{m.frames_selected()}
						</Badge>
					</div>
					{@render caption('03A', m.frames_polaroid())}
				</li>
				<li class="flex flex-col items-start gap-2">
					<div class="flex h-57.5 w-65 items-center justify-center bg-muted">
						<div class="flex h-49 w-21 flex-col gap-1.5 bg-primary p-1.75">
							{@render slots(3, 'grow bg-paper')}
							<div class="h-4"></div>
						</div>
					</div>
					{@render caption('04A', m.frames_strip_color())}
				</li>
				<li class="flex flex-col items-start gap-2">
					<div
						class="flex h-57.5 w-65 items-center justify-center border-2 border-dashed border-[#5e5c57] font-display text-lg font-extrabold uppercase font-stretch-112%"
					>
						{m.frames_theme_placeholder()}
					</div>
					{@render caption('05A', m.frames_seasonal())}
				</li>
			</ul>
			<div aria-hidden="true" class={sprockets}></div>
		</div>
	</div>

	<p
		class="inline-flex min-h-11 items-center px-6 font-mono text-[13px] tracking-[0.16em] text-foreground uppercase md:hidden"
	>
		<RiArrowDropLeftLine class="size-7" />
		{m.frames_scroll()}
		<RiArrowDropRightLine class="size-7" />
	</p>
</section>

{#snippet caption(code: string, name: string)}
	<span class="font-mono text-xs tracking-[0.12em] text-[#d99a3e] uppercase">▸ {code} · {name}</span
	>
{/snippet}
