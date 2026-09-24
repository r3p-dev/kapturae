<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import type { CameraStatus } from '$lib/camera.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { cn } from '$lib/utils'

	let {
		status,
		onretry,
		class: className
	}: { status: Exclude<CameraStatus, 'live'>; onretry: () => void; class?: string } = $props()

	const problems = {
		denied: {
			title: m['session.shoot.camera.denied_title'],
			body: m['session.shoot.camera.denied_body']
		},
		unavailable: {
			title: m['session.shoot.camera.unavailable_title'],
			body: m['session.shoot.camera.unavailable_body']
		},
		error: {
			title: m['session.shoot.camera.error_title'],
			body: m['session.shoot.camera.error_body']
		}
	}

	const problem = $derived(status === 'idle' || status === 'pending' ? null : problems[status])
</script>

<div
	role={problem ? 'alert' : 'status'}
	class={cn('flex flex-col items-center justify-center gap-4 p-6 text-center', className)}
>
	{#if problem}
		<h2 class="m-0 font-display text-2xl font-black uppercase font-stretch-115%">
			{problem.title()}
		</h2>
		<p class="m-0 max-w-90 text-[15px] leading-normal text-body">{problem.body()}</p>

		<div class="flex flex-wrap justify-center gap-3">
			<Button onclick={onretry} class="h-11 px-5">{m['session.shoot.camera.retry']()}</Button>
			<Button
				href={localizeHref('/legal/camera')}
				variant="outline"
				class="h-11 border-foreground px-5"
			>
				{m['session.shoot.camera.help']()}
			</Button>
		</div>
	{:else}
		<span
			class="flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase"
		>
			<span
				aria-hidden="true"
				class="size-2 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
			></span>
			{m['session.shoot.camera.pending']()}
		</span>
	{/if}
</div>
