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
		{ value: 'adjust', icon: RiEqualizerLine, label: m.editor_tool_adjust },
		{ value: 'filter', icon: RiContrastDropLine, label: m.editor_tool_filter },
		{ value: 'sticker', icon: RiEmotionHappyLine, label: m.editor_tool_sticker },
		{ value: 'text', icon: RiText, label: m.editor_tool_text },
		{ value: 'brush', icon: RiBrushLine, label: m.editor_tool_brush },
		{ value: 'frame', icon: RiPictureInPictureLine, label: m.editor_tool_frame }
	]

	const filters = [
		{ value: 'original', swatch: '#7a6a58', label: m.editor_filter_original },
		{ value: 'mono', swatch: '#6e6e6b', label: m.editor_filter_mono },
		{ value: 'warm', swatch: '#a0724a', label: m.editor_filter_warm },
		{ value: 'film', swatch: '#56685e', label: m.editor_filter_film }
	]

	const features = [
		m.editor_feature_color,
		m.editor_tool_filter,
		m.editor_tool_sticker,
		m.editor_tool_text,
		m.editor_tool_brush,
		m.editor_feature_undo
	]

	let tool = $state('adjust')
	let filter = $state('mono')
	let adjustments = $state([
		{ label: m.editor_brightness, value: 12, min: -100 },
		{ label: m.editor_contrast, value: 30, min: -100 },
		{ label: m.editor_saturation, value: -100, min: -100 },
		{ label: m.editor_warmth, value: 0, min: -100 },
		{ label: m.editor_grain, value: 40, min: 0 }
	])

	const previewFilter = $derived(
		`brightness(${1 + adjustments[0].value / 200}) contrast(${1 + adjustments[1].value / 200})`
	)

	function formatSigned(value: number, signed: boolean) {
		if (value < 0) return `-${Math.abs(value)}`
		return signed && value > 0 ? `+${value}` : String(value)
	}
</script>

<section
	id="editor"
	class="flex flex-col items-center gap-12 bg-background px-4 pt-20 pb-20 text-center text-foreground sm:px-20 lg:pt-28 lg:pb-25"
>
	<SectionHeading
		frame={4}
		label={m.editor_label()}
		title={m.editor_title()}
		accent={m.editor_title_accent()}
		description={m.editor_description()}
	/>

	<div class="dark flex w-full max-w-290 flex-col bg-card text-left text-foreground lg:h-160">
		<div class="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
			<Button
				href="#frames"
				variant="ghost"
				class="h-11 gap-2 px-0 font-mono font-normal tracking-widest hover:bg-transparent hover:text-primary"
			>
				<RiArrowLeftSLine class="size-4.5" />
				{m.editor_change_frame()}
			</Button>
			<span
				class="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase max-md:hidden"
			>
				{m.editor_status()}
			</span>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="icon-lg" aria-label={m.editor_undo()}>
					<RiArrowGoBackLine class="size-4.5" />
				</Button>
				<Button variant="outline" size="icon-lg" aria-label={m.editor_redo()}>
					<RiArrowGoForwardLine class="size-4.5" />
				</Button>
				<Button class="h-11 gap-2 px-4.5 font-mono font-normal tracking-widest max-sm:px-3">
					<RiDownload2Line class="size-4" />
					<span class="max-sm:sr-only">{m.editor_download()}</span>
				</Button>
			</div>
		</div>

		<div
			class="grid min-h-0 grow grid-cols-[84px_minmax(0,1fr)] lg:grid-cols-[84px_minmax(0,1fr)_280px]"
		>
			<ToggleGroup.Root
				type="single"
				orientation="vertical"
				spacing={1}
				aria-label={m.editor_tools()}
				bind:value={() => tool, (next) => next && (tool = next)}
				class="w-full items-center gap-1 border-r pt-3"
			>
				{#each tools as item (item.value)}
					<ToggleGroup.Item
						value={item.value}
						class="h-14 w-17 flex-col gap-1 px-0 font-mono text-[10px] font-normal tracking-[0.06em] text-body hover:bg-secondary data-[state=on]:bg-secondary data-[state=on]:text-primary"
					>
						<item.icon aria-hidden="true" class="size-5" />
						{item.label()}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>

			<div
				class="relative flex flex-col items-center justify-center gap-6 bg-background px-4 py-10 lg:py-0"
			>
				<span
					aria-hidden="true"
					class="absolute top-4 left-4 size-5.5 border-t-2 border-l-2 border-[#5e5c57]"
				></span>
				<span
					aria-hidden="true"
					class="absolute right-4 bottom-4 size-5.5 border-r-2 border-b-2 border-[#5e5c57]"
				></span>

				<div class="relative flex h-130 w-47.5 flex-col gap-2.5 bg-paper p-3">
					{#each [1, 2, 3, 4] as n (n)}
						<div
							class="relative flex grow items-center justify-center bg-[#3a3936] font-mono text-[10px] text-muted-foreground data-selected:outline-3 data-selected:outline-offset-3 data-selected:outline-primary"
							data-selected={n === 3 ? '' : undefined}
							style:filter={previewFilter}
						>
							{m.editor_photo({ n })}
							{#if n === 4}
								<RiStarFill
									aria-hidden="true"
									class="absolute -right-2.5 -bottom-2 size-8.5 stroke-ink stroke-1 text-[#e8b23a]"
								/>
							{/if}
						</div>
					{/each}
					<div
						class="flex h-7.5 shrink-0 items-center justify-center font-display text-[13px] font-extrabold tracking-[0.06em] text-ink font-stretch-115%"
					>
						{m.editor_your_text()}
					</div>
				</div>

				<div
					class="flex flex-col gap-1.5 max-lg:items-center max-lg:text-center lg:absolute lg:top-[calc(50%+20px)] lg:left-[calc(50%+125px)]"
				>
					<Button
						class="h-11 w-fit gap-2 bg-paper px-4 font-mono font-medium tracking-widest text-ink hover:bg-paper-2"
					>
						<RiRestartLine class="size-4 text-primary" />
						{m.editor_retake()}
					</Button>
					<span
						class="font-mono text-[11px] tracking-[0.06em] whitespace-pre-line text-muted-foreground"
					>
						{m.editor_retake_hint()}
					</span>
				</div>
			</div>

			<div
				class="col-span-2 flex flex-col gap-4.5 border-t p-5 lg:col-span-1 lg:border-t-0 lg:border-l"
			>
				<span class="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
					{m.editor_adjustments()}
				</span>
				{#each adjustments as adjustment, i (i)}
					<div class="flex flex-col gap-2.5">
						<div class="flex justify-between text-[13px]">
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

				<span class="mt-1 font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
					{m.editor_filters()}
				</span>
				<ToggleGroup.Root
					type="single"
					spacing={2}
					aria-label={m.editor_filters()}
					bind:value={() => filter, (next) => next && (filter = next)}
					class="grid w-full grid-cols-4"
				>
					{#each filters as item (item.value)}
						<ToggleGroup.Item
							value={item.value}
							class="h-auto min-w-0 flex-col items-stretch gap-1 px-0 font-mono text-[10px] font-normal tracking-normal text-body hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary"
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

	<ul class="flex max-w-250 flex-wrap justify-center gap-2.5">
		{#each features as feature, i (i)}
			<li>
				<Badge
					variant="outline"
					class="border-[1.5px] border-ink px-3.5 py-2 font-mono text-[13px] font-normal tracking-[0.08em]"
				>
					{feature()}
				</Badge>
			</li>
		{/each}
		<li>
			<Badge
				class="bg-primary px-3.75 py-2.5 font-mono text-[13px] font-normal tracking-[0.08em] text-primary-foreground"
			>
				{m.editor_feature_retake()}
			</Badge>
		</li>
	</ul>
</section>
