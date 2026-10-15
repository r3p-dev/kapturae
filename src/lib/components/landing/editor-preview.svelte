<script lang="ts">
	import RiArrowGoBackLine from 'remixicon-svelte/icons/arrow-go-back-line'
	import RiArrowGoForwardLine from 'remixicon-svelte/icons/arrow-go-forward-line'
	import RiArrowLeftSLine from 'remixicon-svelte/icons/arrow-left-s-line'
	import RiBrushLine from 'remixicon-svelte/icons/brush-line'
	import RiContrastDropLine from 'remixicon-svelte/icons/contrast-drop-line'
	import RiDownload2Line from 'remixicon-svelte/icons/download-2-line'
	import RiEmotionHappyLine from 'remixicon-svelte/icons/emotion-happy-line'
	import RiEqualizerLine from 'remixicon-svelte/icons/equalizer-line'
	import RiPictureInPictureLine from 'remixicon-svelte/icons/picture-in-picture-line'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import RiStarFill from 'remixicon-svelte/icons/star-fill'
	import RiText from 'remixicon-svelte/icons/text'
	import { Badge } from '$lib/components/ui/badge'
	import { Button } from '$lib/components/ui/button'
	import { Slider } from '$lib/components/ui/slider'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { m } from '$lib/paraglide/messages'
	import SectionHeading from './section-heading.svelte'

	const tools = [
		{ value: 'adjust', icon: RiEqualizerLine, label: m['landing.editor.tools.adjust'] },
		{ value: 'filter', icon: RiContrastDropLine, label: m['landing.editor.tools.filter'] },
		{ value: 'sticker', icon: RiEmotionHappyLine, label: m['landing.editor.tools.sticker'] },
		{ value: 'text', icon: RiText, label: m['landing.editor.tools.text'] },
		{ value: 'brush', icon: RiBrushLine, label: m['landing.editor.tools.brush'] },
		{ value: 'frame', icon: RiPictureInPictureLine, label: m['landing.editor.tools.frame'] }
	]

	const filters = [
		{ value: 'original', swatch: '#7a6a58', label: m['landing.editor.filters.original'] },
		{ value: 'mono', swatch: '#6e6e6b', label: m['landing.editor.filters.mono'] },
		{ value: 'warm', swatch: '#a0724a', label: m['landing.editor.filters.warm'] },
		{ value: 'film', swatch: '#56685e', label: m['landing.editor.filters.film'] }
	]

	const features = [
		m['landing.editor.features.color'],
		m['landing.editor.tools.filter'],
		m['landing.editor.tools.sticker'],
		m['landing.editor.tools.text'],
		m['landing.editor.tools.brush'],
		m['landing.editor.features.undo']
	]

	let tool = $state('adjust')
	let filter = $state('mono')
	let adjustments = $state([
		{ label: m['landing.editor.brightness'], value: 12, min: -100 },
		{ label: m['landing.editor.contrast'], value: 30, min: -100 },
		{ label: m['landing.editor.saturation'], value: -100, min: -100 },
		{ label: m['landing.editor.warmth'], value: 0, min: -100 },
		{ label: m['landing.editor.grain'], value: 40, min: 0 }
	])

	const previewFilter = $derived(
		`brightness(${1 + adjustments[0].value / 200}) contrast(${1 + adjustments[1].value / 200})`
	)

	function formatSigned(value: number, signed: boolean) {
		if (value < 0) {
			return `-${Math.abs(value)}`
		}

		return signed && value > 0 ? `+${value}` : String(value)
	}
</script>

<section
	id="editor"
	class="flex flex-col items-center gap-7 bg-background px-5 pt-16 pb-16 text-center text-foreground tablet:gap-12 tablet:px-20 rail:pt-28 rail:pb-25"
>
	<SectionHeading
		frame={4}
		label={m['landing.editor.label']()}
		title={m['landing.editor.title']()}
		accent={m['landing.editor.title_accent']()}
		description={m['landing.editor.description']()}
		titleClass="mobile:[--title-size:40px]"
	/>

	<div class="dark flex w-full max-w-87.5 flex-col bg-card text-left text-foreground tablet:max-w-290 rail:h-160">
		<div class="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-1.5 tablet:px-4">
			<Button
				href="#frames"
				variant="ghost"
				class="h-11 gap-2 px-0 font-mono font-normal tracking-widest hover:bg-transparent hover:text-primary-text mobile:w-11"
			>
				<RiArrowLeftSLine class="size-4.5 mobile:size-5" />
				<span class="mobile:sr-only">{m['landing.editor.change_frame']()}</span>
			</Button>

			<span class="min-w-0 truncate font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase mobile:hidden">
				{m['landing.editor.status']()}
			</span>

			<div class="flex items-center gap-1 tablet:gap-2">
				<Button
					variant="outline"
					size="icon-lg"
					aria-label={m['landing.editor.undo']()}
					class="mobile:border-transparent"
				>
					<RiArrowGoBackLine class="size-4.5" />
				</Button>

				<Button
					variant="outline"
					size="icon-lg"
					aria-label={m['landing.editor.redo']()}
					class="mobile:border-transparent"
				>
					<RiArrowGoForwardLine class="size-4.5" />
				</Button>

				<Button class="h-11 gap-2 px-4.5 font-mono font-normal tracking-widest mobile:w-11 mobile:px-0">
					<RiDownload2Line class="size-4 mobile:size-4.5" />
					<span class="mobile:sr-only">{m['landing.editor.download']()}</span>
				</Button>
			</div>
		</div>

		<div
			class="flex min-h-0 grow flex-col tablet:grid tablet:grid-cols-[84px_minmax(0,1fr)] rail:grid-cols-[84px_minmax(0,1fr)_280px]"
		>
			<ToggleGroup.Root
				type="single"
				orientation="vertical"
				rovingFocus={false}
				spacing={1}
				aria-label={m['landing.editor.tools_label']()}
				bind:value={() => tool, (next) => next && (tool = next)}
				class="w-full items-center gap-1 mobile:order-last mobile:scrollbar-none mobile:flex-row! mobile:justify-between mobile:overflow-x-auto mobile:border-t mobile:px-1 mobile:py-2 tablet:border-r tablet:pt-3"
			>
				{#each tools as item (item.value)}
					<ToggleGroup.Item
						value={item.value}
						class="h-14 w-13 shrink-0 flex-col gap-1 px-0 font-mono text-[9px] font-normal tracking-[0.06em] text-body hover:bg-secondary data-[state=on]:bg-secondary data-[state=on]:text-primary-text tablet:w-17 tablet:text-[10px]"
					>
						<item.icon aria-hidden="true" class="size-5" />
						{item.label()}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>

			<div
				class="relative flex items-center justify-center gap-3.5 bg-background px-4 py-5.5 tablet:flex-col tablet:gap-6 tablet:py-10 rail:py-0"
			>
				<span aria-hidden="true" class="absolute top-4 left-4 size-5.5 border-t-2 border-l-2 border-[#5e5c57]"></span>

				<span aria-hidden="true" class="absolute right-4 bottom-4 size-5.5 border-r-2 border-b-2 border-[#5e5c57]"
				></span>

				<div
					class="relative flex h-95 w-33 shrink-0 flex-col gap-1.75 bg-paper p-2 tablet:h-130 tablet:w-47.5 tablet:gap-2.5 tablet:p-3"
				>
					{#each [1, 2, 3, 4] as photoNumber (photoNumber)}
						<div
							class="relative flex grow items-center justify-center bg-[#3a3936] font-mono text-[10px] text-muted-foreground data-selected:outline-3 data-selected:outline-offset-3 data-selected:outline-primary"
							data-selected={photoNumber === 3 ? '' : undefined}
							style:filter={previewFilter}
						>
							{m['landing.editor.photo']({ n: photoNumber })}
							{#if photoNumber === 4}
								<RiStarFill
									aria-hidden="true"
									class="absolute -right-2.5 -bottom-2 size-6.5 stroke-ink stroke-1 text-[#e8b23a] tablet:size-8.5"
								/>
							{/if}
						</div>
					{/each}

					<div
						class="flex h-5 shrink-0 items-center justify-center font-display text-[10px] font-extrabold tracking-[0.06em] text-ink font-stretch-115% tablet:h-7.5 tablet:text-[13px]"
					>
						{m['landing.editor.your_text']()}
					</div>
				</div>

				<div
					class="flex flex-col items-center gap-1.5 text-center mobile:mt-15 rail:absolute rail:top-[calc(50%+20px)] rail:left-[calc(50%+125px)] rail:items-stretch rail:text-left"
				>
					<Button
						aria-label={m['landing.editor.retake']()}
						class="h-11 w-fit gap-2 bg-paper px-4 font-mono font-medium tracking-widest text-ink hover:bg-paper-2 mobile:gap-1.5 mobile:px-3 mobile:text-[11px]"
					>
						<RiRestartLine class="size-4 text-primary mobile:size-3.5" />
						<span class="tablet:hidden">{m['landing.editor.retake_short']()}</span>
						<span class="mobile:hidden">{m['landing.editor.retake']()}</span>
					</Button>

					<span class="font-mono text-[11px] tracking-[0.06em] whitespace-pre-line text-muted-foreground mobile:hidden">
						{m['landing.editor.retake_hint']()}
					</span>
				</div>
			</div>

			<div
				class="flex flex-col gap-4.5 border-t px-4 py-3 tablet:col-span-2 tablet:p-5 rail:col-span-1 rail:border-t-0 rail:border-l"
			>
				<span class="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase mobile:hidden">
					{m['landing.editor.adjustments']()}
				</span>

				{#each adjustments as adjustment, index (index)}
					<!-- Mobile keeps one slider (contrast) so the panel stays a single row. -->
					<div class={['flex flex-col gap-2.5 mobile:gap-2', index !== 1 && 'mobile:hidden']}>
						<div class="flex justify-between text-xs tablet:text-[13px]">
							<span>{adjustment.label()}</span>
							<span class="font-mono text-muted-foreground">
								{formatSigned(adjustment.value, adjustment.min < 0)}
							</span>
						</div>

						<Slider
							type="single"
							bind:value={adjustment.value}
							min={adjustment.min}
							max={100}
							aria-label={adjustment.label()}
						/>
					</div>
				{/each}

				<span class="mt-1 font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase mobile:hidden">
					{m['landing.editor.filters_label']()}
				</span>

				<ToggleGroup.Root
					type="single"
					spacing={2}
					aria-label={m['landing.editor.filters_label']()}
					bind:value={() => filter, (next) => next && (filter = next)}
					class="grid w-full grid-cols-4 mobile:hidden"
				>
					{#each filters as item (item.value)}
						<ToggleGroup.Item
							value={item.value}
							class="h-auto min-w-0 flex-col items-stretch gap-1 px-0 font-mono text-[10px] font-normal tracking-normal text-body hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary-text"
						>
							<span
								class="block h-11 outline-offset-2 outline-primary group-data-[state=on]/toggle:outline-2"
								style:background={item.swatch}
							></span>
							{item.label()}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</div>
		</div>
	</div>

	<ul class="flex max-w-250 flex-wrap justify-center gap-2 tablet:gap-2.5">
		{#each features as feature, index (index)}
			<li>
				<Badge
					variant="outline"
					class="border-[1.5px] border-ink px-2.5 py-1.5 font-mono text-[11px] font-normal tracking-[0.06em] tablet:px-3.5 tablet:py-2 tablet:text-[13px] tablet:tracking-[0.08em]"
				>
					{feature()}
				</Badge>
			</li>
		{/each}

		<li>
			<Badge
				class="bg-primary px-2.75 py-1.75 font-mono text-[11px] font-normal tracking-[0.06em] text-primary-foreground tablet:px-3.75 tablet:py-2.5 tablet:text-[13px] tablet:tracking-[0.08em]"
			>
				{m['landing.editor.features.retake']()}
			</Badge>
		</li>
	</ul>
</section>
