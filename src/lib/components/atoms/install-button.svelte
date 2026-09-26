<script lang="ts">
	import { onMount } from 'svelte'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'

	type InstallPrompt = Event & { prompt: () => Promise<unknown> }

	let { class: className }: { class?: string } = $props()

	let deferred = $state<InstallPrompt | null>(null)

	function capture(event: Event) {
		event.preventDefault()
		deferred = event as InstallPrompt
	}

	function forget() {
		deferred = null
	}

	function install() {
		deferred?.prompt().catch(() => {})
		deferred = null
	}

	onMount(() => {
		addEventListener('beforeinstallprompt', capture)
		addEventListener('appinstalled', forget)

		return () => {
			removeEventListener('beforeinstallprompt', capture)
			removeEventListener('appinstalled', forget)
		}
	})
</script>

{#if deferred}
	<button
		type="button"
		data-install
		onclick={install}
		aria-label={m['common.install']()}
		class={cn(
			'flex h-11 items-center font-mono tracking-widest whitespace-nowrap uppercase hover:text-foreground/80',
			className
		)}
	>
		<span class="border-[1.5px] border-foreground px-2 py-1">
			<span class="mobile:hidden">{m['common.install']()}</span>
			<span class="hidden mobile:inline">{m['common.install_short']()}</span>
		</span>
	</button>
{/if}
