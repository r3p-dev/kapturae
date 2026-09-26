<script lang="ts">
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { m } from '$lib/paraglide/messages'
	import type { PhotoSource } from '$lib/session/shots.svelte'
	import { mono } from './styles'
	import { SOURCES } from './toggles'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<div class="hidden h-11 shrink-0 items-center justify-between gap-4 rail:flex">
	<ToggleGroup.Root
		type="single"
		aria-label={m['session.source.label']()}
		disabled={shooter.isBusy || shooter.isImporting}
		bind:value={() => shooter.source, (value) => value && (shooter.source = value as PhotoSource)}
		class="border-[1.5px] border-foreground"
	>
		{#each SOURCES as item (item.value)}
			<ToggleGroup.Item
				value={item.value}
				class="h-11 gap-2 border-0 px-4.5 font-mono text-xs font-normal tracking-[0.12em] hover:bg-foreground/10 data-[state=on]:bg-foreground data-[state=on]:text-background"
			>
				<item.icon aria-hidden="true" class="size-4" />
				{item.label()}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>

	<span class="{mono} text-xs text-muted-foreground">
		{#if shooter.isComplete}
			{m['session.shoot.hint_done']()}
		{:else}
			{m['session.upload.filling']()}
			<span class="text-foreground">{shooter.current} / {shooter.total}</span>
		{/if}
	</span>
</div>
