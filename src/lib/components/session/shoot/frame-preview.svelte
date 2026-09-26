<script lang="ts">
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import CameraFeed from '$lib/components/atoms/camera-feed.svelte'
	import FrameImage from '$lib/components/atoms/frame-image.svelte'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { photoFor, shots } from '$lib/session/shots.svelte'
	import { cn } from '$lib/utils'

	let { shooter, class: className }: { shooter: ShootState; class?: string } = $props()
</script>

{#snippet slotPhoto(index: number)}
	{@const shot = shooter.shotAt(index)}
	{@const photo = photoFor(shots.photos[shot])}
	{@const isWaiting = shot === shooter.target && !shooter.isComplete}

	{#if isWaiting && shooter.source === 'camera' && shooter.camera.stream}
		<CameraFeed
			stream={shooter.camera.stream}
			isMirrored={shooter.camera.isMirrored}
			class="absolute inset-0 outline-3 -outline-offset-3 outline-primary"
		/>
	{:else if shots.photos[shot]}
		<img src={shots.photos[shot]} alt="" class="absolute inset-0 size-full object-cover" />

		{#if photo}
			<span
				class="absolute top-1.5 left-1.5 flex items-center gap-1 bg-ink px-1.5 py-0.75 font-mono text-[10px] tracking-[0.08em] text-paper uppercase"
			>
				{#if photo.source === 'upload'}
					<RiUploadLine aria-hidden="true" class="size-2.75" />
				{:else}
					<RiCameraLine aria-hidden="true" class="size-2.75" />
				{/if}
				{photo.source === 'upload' ? m['session.source.from_upload']() : m['session.source.camera']()}
			</span>
		{/if}
	{:else}
		<span
			class={cn(
				'absolute inset-0 flex flex-col items-center justify-center gap-1',
				isWaiting ? 'bg-[#2a2a28] outline-3 -outline-offset-3 outline-primary' : 'text-[#8c8983]'
			)}
		>
			<span class="font-display text-[22px] font-black">{index + 1}</span>
			{#if isWaiting}
				<span class="font-mono text-[10px] tracking-widest text-body uppercase">
					{shooter.source === 'upload' ? m['session.upload.waiting']() : m['session.upload.next']()}
				</span>
			{/if}
		</span>
	{/if}
{/snippet}

<FrameImage frame={shooter.frame} photo={slotPhoto} class={className} />
