<script lang="ts">
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'

	let { editor }: { editor: EditState } = $props()
</script>

<label class="flex min-h-11 items-center gap-2.5 text-[13px] text-body">
	<input
		type="checkbox"
		checked={editor.shouldApplyAll}
		onchange={(event) => editor.setApplyAll(event.currentTarget.checked)}
		class="size-4.5 accent-primary"
	/>
	{m['session.edit.apply_all']()}
</label>
