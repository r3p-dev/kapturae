<script lang="ts">
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import { m } from '$lib/paraglide/messages'
	import { shots } from '$lib/shots.svelte'
	import { cn } from '$lib/utils'

	let {
		order,
		current,
		onpick,
		class: className
	}: {
		order: number[]
		current: string | undefined
		onpick: (url: string) => void
		class?: string
	} = $props()

	function slotOf(url: string) {
		return order.findIndex((shot) => shots.photos[shot] === url)
	}
	const label = 'absolute inset-x-0 bottom-0 py-0.75 text-center font-mono text-[9px] tracking-[0.08em] uppercase'
</script>

<div role="group" aria-label={m['session.library.label']()} class={cn('grid gap-2', className)}>
	{#each shots.library as photo, index (photo.url)}
		{@const slot = slotOf(photo.url)}
		{@const isCurrent = photo.url === current}
		{@const name = photo.name ?? m['session.library.shot']({ n: index + 1 })}

		<button
			type="button"
			aria-pressed={isCurrent}
			aria-label={isCurrent
				? m['session.library.current']({ name })
				: slot === -1
					? m['session.library.unused']({ name })
					: m['session.library.in_slot']({ name, n: slot + 1 })}
			onclick={() => !isCurrent && onpick(photo.url)}
			class={cn(
				'relative aspect-square overflow-hidden bg-[#232321] outline-offset-2 focus-visible:outline-2 focus-visible:outline-paper',
				isCurrent && 'outline-2 outline-primary focus-visible:outline-primary'
			)}
		>
			<img src={photo.url} alt="" loading="lazy" class="size-full object-cover" />

			{#if isCurrent}
				<span class="{label} bg-primary text-primary-foreground">{m['session.library.now']()}</span>
			{:else if slot !== -1}
				<span class="{label} bg-ink/80 text-paper">{m['session.library.slot']({ n: slot + 1 })}</span>
			{:else}
				<span class="absolute top-1 left-1 flex size-4.5 items-center justify-center bg-ink/70 text-paper">
					{#if photo.source === 'upload'}
						<RiUploadLine aria-hidden="true" class="size-2.5" />
					{:else}
						<RiCameraLine aria-hidden="true" class="size-2.5" />
					{/if}
				</span>
			{/if}
		</button>
	{/each}
</div>
