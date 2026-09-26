<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/state'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import DesktopToolbar from '$lib/components/session/shoot/desktop-toolbar.svelte'
	import FrameAside from '$lib/components/session/shoot/frame-aside.svelte'
	import ShootTopbar from '$lib/components/session/shoot/shoot-topbar.svelte'
	import UploadPanel from '$lib/components/session/shoot/upload-panel.svelte'
	import Viewfinder from '$lib/components/session/shoot/viewfinder.svelte'
	import { ShootState } from '$lib/capture/shoot-state.svelte'
	import { frameFor } from '$lib/frames/requested'
	import { m } from '$lib/paraglide/messages'

	const shooter = new ShootState(frameFor(page.url.searchParams), page.url.searchParams)

	onMount(() => shooter.mount())
</script>

<svelte:head>
	<title>{m['session.shoot.meta_title']()}</title>
	<meta name="description" content={m['session.shoot.meta_description']()} />
</svelte:head>

<div class="dark relative isolate flex h-svh flex-col overflow-hidden bg-background text-foreground scheme-dark">
	<div aria-hidden="true" class="absolute inset-0 -z-10 rail:hidden" style:background-color={shooter.frame.color}></div>

	<SessionHeader step="shoot" class="hidden rail:flex" />

	<ShootTopbar {shooter} />

	<div class="flex min-h-0 flex-1 flex-col rail:flex-row rail:gap-6 rail:px-8 rail:pt-5 rail:pb-6">
		<div class="flex min-h-0 min-w-0 flex-1 flex-col rail:gap-3">
			<DesktopToolbar {shooter} />

			{#if shooter.source === 'upload'}
				<UploadPanel {shooter} />
			{/if}

			<Viewfinder {shooter} />
		</div>

		<p class="sr-only" aria-live="polite">{shooter.hint}</p>

		<div aria-hidden="true" class="h-45 shrink-0 rail:hidden"></div>

		<FrameAside {shooter} />
	</div>

	{#if shooter.isLit}
		<div aria-hidden="true" class="pointer-events-none fixed inset-0 z-50 bg-white"></div>
	{/if}
</div>
