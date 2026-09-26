<script lang="ts">
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import { m } from '$lib/paraglide/messages'
	import { eyebrow } from './styles'

	let { title, note, onclose }: { title: string; note?: string; onclose: () => void } = $props()
</script>

<div class="flex items-center justify-between gap-3">
	<h2 class="m-0 min-w-0 font-normal {eyebrow}">{title}</h2>

	<div class="flex shrink-0 items-center gap-2">
		{#if note}<span class="text-xs text-muted-foreground rail:hidden">{note}</span>{/if}

		<button
			type="button"
			onclick={onclose}
			aria-label={m['session.edit.close_panel']()}
			class="-my-2 -mr-2 flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
		>
			<RiCloseLine aria-hidden="true" class="size-4.5" />
		</button>
	</div>
</div>
