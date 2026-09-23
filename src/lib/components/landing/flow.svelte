<script lang="ts">
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiDownload2Line from 'remixicon-svelte/icons/download-2-line'
	import RiEqualizerLine from 'remixicon-svelte/icons/equalizer-line'
	import RiLayoutRowLine from 'remixicon-svelte/icons/layout-row-line'
	import RiArrowDropRightLine from 'remixicon-svelte/icons/arrow-drop-right-line'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'
	import SectionHeading from './section-heading.svelte'

	const steps = [
		{ icon: RiLayoutRowLine, title: m.step_frame_title, body: m.step_frame_body },
		{ icon: RiCameraLine, title: m.step_shoot_title, body: m.step_shoot_body },
		{ icon: RiEqualizerLine, title: m.step_edit_title, body: m.step_edit_body },
		{ icon: RiDownload2Line, title: m.step_download_title, body: m.step_download_body }
	]
</script>

<section
	id="flow"
	class="flex flex-col items-center gap-14 bg-background px-6 pt-20 pb-20 text-center text-foreground sm:px-20 lg:pt-28 lg:pb-25"
>
	<SectionHeading
		frame={2}
		label={m.flow_label()}
		title={m.flow_title()}
		accent={m.flow_title_accent()}
		description={m.flow_description()}
	/>

	<ol class="flex flex-col items-center gap-5 lg:flex-row">
		{#each steps as step, i (i)}
			{@const last = i === steps.length - 1}
			<li class="flex items-center gap-5 max-lg:flex-col">
				{#if i > 0}
					<span
						aria-hidden="true"
						class="flex -space-x-5 text-[28px] text-primary max-lg:rotate-90"
					>
						<RiArrowDropRightLine class="size-7" />
						<RiArrowDropRightLine class="size-7" />
						<RiArrowDropRightLine class="size-7" />
					</span>
				{/if}
				<div
					class={cn(
						'relative flex h-72 w-62.5 flex-col items-center justify-center gap-3.5 p-6',
						last ? 'dark bg-background text-foreground' : 'border-2 border-ink'
					)}
				>
					<span
						class={cn(
							'absolute top-3.5 left-4 font-mono text-xs tracking-[0.12em]',
							last && 'text-primary'
						)}
					>
						{String(i + 1).padStart(2, '0')}
					</span>
					<step.icon aria-hidden="true" class="size-11" />
					<h3 class="m-0 font-display text-2xl font-extrabold uppercase font-stretch-112%">
						{step.title()}
					</h3>
					<p class="m-0 text-[15px] leading-[1.55] text-body">{step.body()}</p>
				</div>
			</li>
		{/each}
	</ol>
</section>
