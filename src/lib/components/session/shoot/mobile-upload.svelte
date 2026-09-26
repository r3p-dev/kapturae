<script lang="ts">
	import RiImageLine from 'remixicon-svelte/icons/image-line'
	import Dropzone from '$lib/components/molecules/dropzone.svelte'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { UPLOAD_MAX_MB } from '$lib/capture/upload'
	import { m } from '$lib/paraglide/messages'
	import { mono } from './styles'
	import UploadItem from './upload-item.svelte'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<Dropzone
	onfiles={(files) => shooter.upload(files)}
	disabled={shooter.isImporting || shooter.isComplete}
	class="absolute inset-4 flex flex-col items-center justify-center gap-3.5 overflow-y-auto border-2 border-dashed border-[#5a5853] p-5 text-center"
>
	<RiImageLine aria-hidden="true" class="size-11 shrink-0 text-primary" />

	<h2 class="m-0 font-display text-[26px] leading-[0.95] font-black uppercase font-stretch-112%">
		{shooter.isComplete ? m['session.shoot.hint_done']() : m['session.upload.pick_for_slot']({ n: shooter.current })}
	</h2>

	{#if !shooter.isComplete}
		<p class="m-0 text-sm leading-normal text-body">
			{shooter.remaining > 1 ? m['session.upload.pick_many']({ n: shooter.remaining }) : m['session.upload.pick_one']()}
		</p>
	{/if}

	<div class="{mono} flex flex-col items-center gap-1.5 text-[10px] tracking-widest text-muted-foreground">
		<span>{m['session.upload.formats']()} · {m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}</span>
		<span>{m['session.upload.auto_crop']()}</span>
	</div>

	{#if shooter.uploads.length}
		<ul class="m-0 flex w-full list-none flex-col gap-1.5 p-0 text-left" aria-live="polite">
			{#each shooter.uploads.slice(-3) as item (item.id)}
				<UploadItem {shooter} {item} isCompact />
			{/each}
		</ul>
	{/if}
</Dropzone>
