<script lang="ts">
	import { cn } from '$lib/utils'

	let {
		stream,
		mirrored = false,
		video = $bindable(),
		class: className
	}: {
		stream: MediaStream | null
		mirrored?: boolean
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
	class={cn('size-full object-cover', mirrored && '-scale-x-100', className)}
></video>
