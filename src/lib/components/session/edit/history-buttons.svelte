<script lang="ts">
	import RiArrowGoBackLine from 'remixicon-svelte/icons/arrow-go-back-line'
	import RiArrowGoForwardLine from 'remixicon-svelte/icons/arrow-go-forward-line'
	import type { Edit, History } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import { square } from './styles'

	let { history }: { history: History<Edit> } = $props()
</script>

<button
	type="button"
	onclick={() => history.undo()}
	disabled={!history.canUndo()}
	aria-label={m['session.edit.undo']()}
	class={square}
>
	<RiArrowGoBackLine aria-hidden="true" class="size-4.5" />
</button>

<button
	type="button"
	onclick={() => history.redo()}
	disabled={!history.canRedo()}
	aria-label={m['session.edit.redo']()}
	class={square}
>
	<RiArrowGoForwardLine aria-hidden="true" class="size-4.5" />
</button>
