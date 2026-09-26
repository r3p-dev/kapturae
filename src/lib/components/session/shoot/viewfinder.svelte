<script lang="ts">
	import CameraFeed from '$lib/components/atoms/camera-feed.svelte'
	import Countdown from '$lib/components/atoms/countdown.svelte'
	import Flash from '$lib/components/atoms/flash.svelte'
	import CameraStatus from '$lib/components/molecules/camera-status.svelte'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'
	import CameraGuide from './camera-guide.svelte'
	import LiveOverlay from './live-overlay.svelte'
	import MobileUpload from './mobile-upload.svelte'
	import ShootControls from './shoot-controls.svelte'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<section
	aria-label={shooter.source === 'camera' ? m['session.shoot.camera_label']() : m['session.upload.label']()}
	class={cn(
		'relative mx-5 mt-4 mb-4 min-h-0 flex-1 overflow-hidden bg-[#262624] rail:m-0 rail:bg-[#232321]',
		shooter.source === 'upload' && 'rail:hidden'
	)}
>
	{#if shooter.source === 'upload'}
		<MobileUpload {shooter} />
	{:else if shooter.camera.status === 'live'}
		<CameraFeed stream={shooter.camera.stream} isMirrored={shooter.camera.isMirrored} bind:video={shooter.video} />

		<CameraGuide {shooter} />
	{:else}
		<CameraStatus
			status={shooter.camera.status}
			onretry={() => shooter.camera.start()}
			class="absolute inset-0 rail:bottom-32"
		/>
	{/if}

	{#if shooter.source === 'camera'}
		<LiveOverlay {shooter} />
	{/if}

	{#if typeof shooter.phase === 'number'}
		<Countdown
			value={shooter.phase}
			class="absolute z-10 bg-transparent rail:bottom-32"
			digitClass="text-[180px] text-paper/92 rail:text-[320px] rail:text-primary"
		/>
	{:else if shooter.phase === 'flash'}
		<Flash class="absolute z-30" />
	{/if}

	<ShootControls {shooter} />
</section>
