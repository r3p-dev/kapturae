<script lang="ts">
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiDownload2Line from 'remixicon-svelte/icons/download-2-line'
	import RiEqualizerLine from 'remixicon-svelte/icons/equalizer-line'
	import RiLayoutRowLine from 'remixicon-svelte/icons/layout-row-line'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'
	import SectionHeading from './section-heading.svelte'

	const steps = [
		{
			icon: RiLayoutRowLine,
			title: m['landing.flow.steps.frame.title'],
			body: m['landing.flow.steps.frame.body'],
			short: m['landing.flow.steps.frame.short']
		},
		{
			icon: RiCameraLine,
			title: m['landing.flow.steps.shoot.title'],
			body: m['landing.flow.steps.shoot.body'],
			short: m['landing.flow.steps.shoot.short']
		},
		{
			icon: RiEqualizerLine,
			title: m['landing.flow.steps.edit.title'],
			body: m['landing.flow.steps.edit.body'],
			short: m['landing.flow.steps.edit.short']
		},
		{
			icon: RiDownload2Line,
			title: m['landing.flow.steps.download.title'],
			body: m['landing.flow.steps.download.body'],
			short: m['landing.flow.steps.download.short']
		}
	]
</script>

<section
	id="flow"
	class="flex flex-col items-center gap-9 bg-background px-5 pt-16 pb-16 text-center text-foreground tablet:gap-14 tablet:px-20 rail:pt-28 rail:pb-25"
>
	<SectionHeading
		frame={2}
		label={m['landing.flow.label']()}
		title={m['landing.flow.title']()}
		accent={m['landing.flow.title_accent']()}
		description={m['landing.flow.description']()}
		titleClass="mobile:text-[44px]"
	/>

	<ol class="grid w-full max-w-270 grid-cols-2 gap-3 tablet:gap-5 rail:grid-cols-4">
		{#each steps as step, index (index)}
			{@const last = index === steps.length - 1}
			<li
				class={cn(
					'relative flex h-52.5 flex-col items-center justify-center gap-2.5 px-3 py-4 tablet:h-72 tablet:gap-3.5 tablet:p-6',
					last ? 'dark bg-background text-foreground' : 'border-2 border-ink'
				)}
			>
				<span
					class={cn(
						'absolute top-2.5 left-3 font-mono text-[11px] tablet:top-3.5 tablet:left-4 tablet:text-xs tablet:tracking-[0.12em]',
						last && 'text-primary-text'
					)}
				>
					{String(index + 1).padStart(2, '0')}
				</span>

				<step.icon aria-hidden="true" class="size-8.5 tablet:size-11" />

				<h3
					class="m-0 font-display text-[17px] font-extrabold uppercase font-stretch-110% tablet:text-2xl tablet:font-stretch-112%"
				>
					{step.title()}
				</h3>

				<p class="m-0 text-[13px] leading-[1.45] text-body tablet:text-[15px] tablet:leading-[1.55]">
					<span class="tablet:hidden">{step.short()}</span>
					<span class="mobile:hidden">{step.body()}</span>
				</p>
			</li>
		{/each}
	</ol>
</section>
