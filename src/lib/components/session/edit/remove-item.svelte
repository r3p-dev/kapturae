<script lang="ts">
	import RiDeleteBinLine from 'remixicon-svelte/icons/delete-bin-line'
	import { Button } from '$lib/components/ui/button'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { outline } from './styles'

	let { editor }: { editor: EditState } = $props()
</script>

<Button variant="outline" onclick={() => editor.removeItem()} class={outline}>
	<RiDeleteBinLine aria-hidden="true" class="size-4" />
	{m['session.edit.remove']()}
</Button>
