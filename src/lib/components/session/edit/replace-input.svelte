<script lang="ts">
	import { UPLOAD_ACCEPT } from '$lib/capture/upload'
	import type { EditState } from '$lib/editor/edit-state.svelte'

	let { editor }: { editor: EditState } = $props()

	function pick(event: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(event.currentTarget.files ?? [])]
		event.currentTarget.value = ''
		editor.replaceWith(files)
	}
</script>

<input type="file" accept={UPLOAD_ACCEPT} disabled={editor.isReplacing} onchange={pick} class="sr-only" />
