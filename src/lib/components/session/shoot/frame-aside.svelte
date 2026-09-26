<script lang="ts">
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import FramePreview from './frame-preview.svelte'
	import { mono } from './styles'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<aside
	aria-label={m['session.shoot.in_frame']()}
	class="hidden w-(--w) shrink-0 flex-col items-center gap-4 [--w:280px] rail:flex desktop:[--w:340px]"
>
	<span class="{mono} flex justify-between self-stretch text-xs text-muted-foreground">
		<span>{m['session.shoot.in_frame']()}</span>
		<span>{shooter.spec.label} · {shooter.frame.name}</span>
	</span>

	<div
		class="flex min-h-0 flex-1 items-center"
		style:--h="min(588px, calc(100svh - 250px), calc(var(--w) / {shooter.spec.ratio}))"
	>
		<FramePreview {shooter} />
	</div>

	<p class="m-0 self-stretch text-center text-[13px] leading-normal text-muted-foreground">
		{m['session.shoot.note']()}
	</p>
</aside>
