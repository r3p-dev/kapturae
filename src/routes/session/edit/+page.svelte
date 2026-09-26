<script lang="ts">
	import { page } from '$app/state'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import EditCanvas from '$lib/components/session/edit/edit-canvas.svelte'
	import FinishButton from '$lib/components/session/edit/finish-button.svelte'
	import ReplaceSheet from '$lib/components/session/edit/replace-sheet.svelte'
	import ToolPanel from '$lib/components/session/edit/tool-panel.svelte'
	import ToolRail from '$lib/components/session/edit/tool-rail.svelte'
	import { EditState } from '$lib/editor/edit-state.svelte'
	import { frameFor } from '$lib/frames/requested'
	import { m } from '$lib/paraglide/messages'

	const editor = new EditState(frameFor(page.url.searchParams))
</script>

<svelte:head>
	<title>{m['session.edit.meta_title']()}</title>
	<meta name="description" content={m['session.edit.meta_description']()} />
</svelte:head>

<svelte:window onkeydown={(event) => editor.keydown(event)} />

{#snippet headerAction()}
	<FinishButton {editor} hasArrow={false} class="px-3.5" />
{/snippet}

<div class="dark flex h-svh flex-col overflow-hidden bg-background text-foreground scheme-dark">
	<SessionHeader step="edit" action={headerAction} />

	<div class="flex min-h-0 flex-1 flex-col rail:flex-row">
		<ToolRail {editor} />

		<EditCanvas {editor} />

		{#if editor.tool || editor.isReplacingSlot}
			<ToolPanel {editor} />
		{/if}
	</div>
</div>

{#if editor.StickerPrep && editor.stickerFiles.length}
	<editor.StickerPrep
		files={editor.stickerFiles}
		onadd={(url) => editor.keepSticker(url)}
		onfail={() => (editor.hasUploadFailed = true)}
		onclose={() => (editor.stickerFiles = [])}
	/>
{/if}

<ReplaceSheet {editor} />
