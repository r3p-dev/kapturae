<script lang="ts">
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiImageLine from 'remixicon-svelte/icons/image-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import ShutterButton from '$lib/components/atoms/shutter-button.svelte'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { photoFor, shots, type PhotoSource } from '$lib/session/shots.svelte'
	import { cn } from '$lib/utils'
	import CameraSettings from './camera-settings.svelte'
	import SettingsPopover from './settings-popover.svelte'
	import { mono } from './styles'
	import { SOURCES } from './toggles'
	import UploadInput from './upload-input.svelte'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<div
	class="fixed inset-x-0 bottom-0 z-20 flex h-45 flex-col bg-ink/86 px-6 pt-1 pb-4 rail:absolute rail:h-32 rail:bg-ink/78 rail:px-10 rail:pt-0 rail:pb-0"
>
	<ToggleGroup.Root
		type="single"
		aria-label={m['session.source.label']()}
		disabled={shooter.isBusy || shooter.isImporting}
		bind:value={() => shooter.source, (value) => value && (shooter.source = value as PhotoSource)}
		class="h-12 w-full shrink-0 justify-center gap-2 rail:hidden"
	>
		{#each SOURCES as item (item.value)}
			<ToggleGroup.Item
				value={item.value}
				class="h-11 min-w-22 flex-col gap-1 bg-transparent font-mono text-xs font-normal tracking-[0.14em] text-muted-foreground hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:font-medium data-[state=on]:text-paper"
			>
				{item.short()}
				<span aria-hidden="true" class="size-1.25 rounded-full group-data-[state=on]/toggle:bg-primary"></span>
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>

	<div class="flex min-h-0 flex-1 items-center justify-between gap-4">
		<div class="flex w-24 gap-1.5 rail:hidden">
			{#if shooter.lastShot !== undefined}
				{@const last = photoFor(shots.photos[shooter.lastShot])}
				<span class="relative size-11 shrink-0">
					<img src={shots.photos[shooter.lastShot]} alt="" class="size-11 border-2 border-paper object-cover" />
					{#if last}
						<span class="absolute top-0.5 left-0.5 text-paper">
							{#if last.source === 'upload'}
								<RiUploadLine aria-hidden="true" class="size-3" />
							{:else}
								<RiCameraLine aria-hidden="true" class="size-3" />
							{/if}
						</span>
					{/if}
				</span>
			{/if}
			{#if !shooter.isComplete}
				<span
					class={cn(
						'size-11 border-2 border-dashed',
						shooter.source === 'upload' ? 'border-primary' : 'border-[#8c8983]'
					)}
				></span>
			{/if}
		</div>

		<CameraSettings {shooter} />

		{#if shooter.source === 'camera'}
			<ShutterButton
				onclick={() => shooter.shoot()}
				aria-label={m['session.shoot.shutter']()}
				aria-disabled={!shooter.isReady}
				class="shrink-0 aria-disabled:opacity-50"
			/>
		{:else}
			<label
				aria-label={m['session.upload.pick_gallery']()}
				class={cn(
					'flex size-21 shrink-0 items-center justify-center rounded-full border-4 border-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-paper',
					shooter.isImporting || shooter.isComplete ? 'pointer-events-none opacity-50' : 'cursor-pointer'
				)}
			>
				<UploadInput {shooter} />
				<span class="flex size-15.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<RiImageLine aria-hidden="true" class="size-6.5" />
				</span>
			</label>
		{/if}

		{#if shooter.source === 'upload'}
			<span
				class="{mono} w-24 text-right text-[10px] leading-[1.4] tracking-[0.08em] text-muted-foreground rail:hidden"
			>
				{m['session.upload.auto_delete']()}
			</span>
		{:else}
			<SettingsPopover {shooter} />
		{/if}

		<div class="hidden flex-1 flex-col items-end gap-1 desktop:flex">
			<span class="font-display text-3xl leading-none font-black font-stretch-118%">
				{m['session.shoot.shot']({ n: shooter.current, total: shooter.total })}
			</span>

			<span aria-hidden="true" class="{mono} text-[11px] tracking-[0.12em] text-muted-foreground">
				{shooter.hint}
			</span>
		</div>
	</div>
</div>
