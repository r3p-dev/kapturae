<script lang="ts">
	import { cn } from '$lib/utils'

	let {
		stream,
		isMirrored = false,
		video = $bindable(),
		class: className
	}: {
		stream: MediaStream | null
		isMirrored?: boolean
		video?: HTMLVideoElement
		class?: string
	} = $props()

	function attach(node: HTMLVideoElement) {
		node.srcObject = stream
		return () => (node.srcObject = null)
	}
</script>

<video
	bind:this={video}
	{@attach attach}
	autoplay
	muted
	playsinline
	aria-hidden="true"
	class={cn('size-full object-cover', isMirrored && '-scale-x-100', className)}
></video>
