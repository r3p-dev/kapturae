<script lang="ts">
	import PhotoLibrary from '$lib/components/molecules/photo-library.svelte'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { shots } from '$lib/session/shots.svelte'
	import { eyebrow } from './styles'

	let { editor, class: className }: { editor: EditState; class: string } = $props()
</script>

{#if editor.slot !== null && shots.library.length}
	<div class="h-px shrink-0 bg-[#2a2a28]"></div>
	<span class={eyebrow}>{m['session.library.title']()}</span>
	<PhotoLibrary
		order={editor.edit.order}
		current={editor.photos[editor.slot]}
		onpick={(url) => {
			if (editor.slot !== null) {
				editor.place(editor.slot, url)
			}
			editor.isSheetOpen = false
		}}
		class={className}
	/>
	<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.library.note']()}</p>
{/if}
