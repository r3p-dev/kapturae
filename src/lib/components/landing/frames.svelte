<script lang="ts">
	import { Badge } from '$lib/components/ui/badge'
	import { m } from '$lib/paraglide/messages'
	import SectionHeading from './section-heading.svelte'
	import RiArrowDropRightLine from 'remixicon-svelte/icons/arrow-drop-right-line'
	import RiArrowDropLeftLine from 'remixicon-svelte/icons/arrow-drop-left-line'

	function centreScroll(node: HTMLElement) {
		node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2
	}

	const sprockets = 'h-3 shrink-0 bg-[repeating-linear-gradient(90deg,var(--ink)_0_16px,transparent_16px_32px)] mx-2'
</script>

{#snippet slots(count: number, className: string)}
	{#each { length: count }, index (index)}<div class={className}></div>{/each}
{/snippet}

<section
	id="frames"
	class="dark flex flex-col items-center gap-12 overflow-hidden bg-background pt-20 pb-20 text-center text-foreground rail:pt-28 rail:pb-25"
>
	<SectionHeading
		frame={3}
		label={m['landing.frames.label']()}
		title={m['landing.frames.title']()}
		description={m['landing.frames.description']()}
		class="px-6"
		titleClass="mobile:text-[44px]"
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
					{@render caption('01A', m['landing.frames.strip_4']())}
				</li>

				<li class="flex flex-col items-start gap-2">
					<div class="flex h-57.5 w-65 items-center justify-center bg-muted">
						<div class="grid h-44 w-40 grid-cols-2 gap-1.5 bg-paper px-2 pt-2 pb-6">
							{@render slots(4, 'bg-[#5e5c57]')}
						</div>
					</div>
					{@render caption('02A', m['landing.frames.grid']())}
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
							{m['landing.frames.selected']()}
						</Badge>
					</div>
					{@render caption('03A', m['landing.frames.polaroid']())}
				</li>

				<li class="flex flex-col items-start gap-2">
					<div class="flex h-57.5 w-65 items-center justify-center bg-muted">
						<div class="flex h-49 w-21 flex-col gap-1.5 bg-primary p-1.75">
							{@render slots(3, 'grow bg-paper')}
							<div class="h-4"></div>
						</div>
					</div>
					{@render caption('04A', m['landing.frames.strip_color']())}
				</li>

				<li class="flex flex-col items-start gap-2">
					<div
						class="flex h-57.5 w-65 items-center justify-center border-2 border-dashed border-[#5e5c57] font-display text-lg font-extrabold uppercase font-stretch-112%"
					>
						{m['landing.frames.theme_placeholder']()}
					</div>
					{@render caption('05A', m['landing.frames.seasonal']())}
				</li>
			</ul>

			<div aria-hidden="true" class={sprockets}></div>
		</div>
	</div>

	<p
		class="inline-flex min-h-11 items-center px-6 font-mono text-[13px] tracking-[0.16em] text-foreground uppercase tablet:hidden"
	>
		<RiArrowDropLeftLine class="size-7" />
		{m['landing.frames.scroll']()}
		<RiArrowDropRightLine class="size-7" />
	</p>
</section>

{#snippet caption(code: string, name: string)}
	<span class="font-mono text-xs tracking-[0.12em] text-[#d99a3e] uppercase">▸ {code} · {name}</span>
{/snippet}
