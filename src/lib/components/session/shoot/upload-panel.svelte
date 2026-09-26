<script lang="ts">
	import RiImageLine from 'remixicon-svelte/icons/image-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import Corners from '$lib/components/atoms/corners.svelte'
	import Dropzone from '$lib/components/molecules/dropzone.svelte'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { UPLOAD_MAX_MB, UPLOAD_MIN_SIDE } from '$lib/capture/upload'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'
	import { chip, mono } from './styles'
	import UploadInput from './upload-input.svelte'
	import UploadItem from './upload-item.svelte'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<div class="hidden min-h-0 flex-1 flex-col gap-4 bg-[#1b1b19] p-6 rail:flex">
	<Dropzone
		onfiles={(files) => shooter.upload(files)}
		disabled={shooter.isImporting || shooter.isComplete}
		class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4.5 overflow-y-auto border-2 border-dashed border-[#5a5853] p-6 text-center"
	>
		<Corners inset="16px" size="28px" weight="3px" class="text-primary" />
		<RiUploadLine aria-hidden="true" class="size-13 shrink-0 text-primary" />

		<h2 class="m-0 font-display text-4xl leading-[0.92] font-black uppercase font-stretch-118% desktop:text-5xl">
			{m['session.upload.drop_title']()}
		</h2>

		<p class="m-0 max-w-120 text-base leading-[1.55] text-body">
			{shooter.retake === null ? m['session.upload.drop_body']() : m['session.upload.drop_body_single']()}
		</p>

		<label
			class={cn(
				'flex h-13 shrink-0 items-center gap-2.5 bg-primary px-8 font-mono text-[13px] font-medium tracking-[0.12em] text-primary-foreground uppercase hover:bg-primary/80 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-paper',
				shooter.isImporting || shooter.isComplete ? 'pointer-events-none opacity-50' : 'cursor-pointer'
			)}
		>
			<UploadInput {shooter} />
			<RiImageLine aria-hidden="true" class="size-4.5" />
			{m['session.upload.pick']()}
		</label>

		<div class="{mono} flex flex-wrap justify-center gap-2 text-[11px] tracking-widest text-muted-foreground">
			<span class={chip}>{m['session.upload.formats']()}</span>
			<span class={chip}>{m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}</span>
			<span class={chip}>{m['session.upload.min_side']({ n: UPLOAD_MIN_SIDE })}</span>
			<span class={chip}>{m['session.upload.auto_crop']()}</span>
		</div>

		<span class="text-[13px] text-muted-foreground">{m['session.upload.retention']()}</span>
	</Dropzone>

	{#if shooter.uploads.length}
		<div class="flex h-24 shrink-0 gap-3">
			<div class="{mono} flex w-30 shrink-0 flex-col justify-center gap-1 text-[11px] text-muted-foreground">
				<span>{m['session.upload.uploads']()}</span>
				<span class="font-display text-[28px] leading-none font-black tracking-normal text-foreground">
					{shooter.uploads.length}
				</span>
			</div>

			<ul class="m-0 flex min-w-0 flex-1 list-none gap-3 overflow-x-auto p-0" aria-live="polite">
				{#each shooter.uploads as item (item.id)}
					<UploadItem {shooter} {item} />
				{/each}
			</ul>
		</div>
	{/if}
</div>
