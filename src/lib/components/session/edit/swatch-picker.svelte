<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { SWATCHES } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import CustomSwatch from './custom-swatch.svelte'
	import { swatch } from './styles'

	let {
		label,
		value,
		set,
		oncommit
	}: { label: string; value: string; set: (hex: string) => void; oncommit: () => void } = $props()

	const swatches = (
		[
			['white', m['session.edit.swatches.white']],
			['black', m['session.edit.swatches.black']],
			['red', m['session.edit.swatches.red']],
			['yellow', m['session.edit.swatches.yellow']],
			['blue', m['session.edit.swatches.blue']]
		] as const
	).map(([key, swatchLabel]) => ({ hex: SWATCHES[key], label: swatchLabel }))
</script>

<ToggleGroup.Root
	type="single"
	spacing={2}
	aria-label={label}
	bind:value={
		() => value,
		(next) => {
			if (!next) {
				return
			}
			set(next)
			oncommit()
		}
	}
	class="grid w-full grid-cols-6 gap-2.5"
>
	{#each swatches as swatchOption (swatchOption.hex)}
		<ToggleGroup.Item
			value={swatchOption.hex}
			aria-label={swatchOption.label()}
			class={swatch}
			style="background-color: {swatchOption.hex}"
		/>
	{/each}

	<CustomSwatch {value} isActive={!swatches.some((option) => option.hex === value)} {set} {oncommit} />
</ToggleGroup.Root>
