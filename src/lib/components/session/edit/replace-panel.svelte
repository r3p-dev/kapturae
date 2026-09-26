<script lang="ts">
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import Dropzone from '$lib/components/molecules/dropzone.svelte'
	import SlotCamera from '$lib/components/organisms/slot-camera.svelte'
	import { UPLOAD_MAX_MB } from '$lib/capture/upload'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { addPhoto } from '$lib/session/shots.svelte'
	import { cn } from '$lib/utils'
	import ReplaceError from './replace-error.svelte'
	import ReplaceInput from './replace-input.svelte'
	import SlotLibrary from './slot-library.svelte'
	import { eyebrow, mono } from './styles'

	let { editor, slot }: { editor: EditState; slot: number } = $props()

	const slotNumber = $derived(slot + 1)
</script>

<div class="flex items-center justify-between gap-3">
	<h2 class="m-0 min-w-0 font-normal {eyebrow}">
		{editor.replace === 'camera'
			? m['session.replace.camera_title']({ n: slotNumber })
			: m['session.replace.upload_title']({ n: slotNumber })}
	</h2>
	<button
		type="button"
		onclick={() => (editor.replace = null)}
		aria-label={m['session.edit.close_panel']()}
		class="-my-2 -mr-2 flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
	>
		<RiCloseLine aria-hidden="true" class="size-4.5" />
	</button>
</div>

{#if editor.replace === 'camera'}
	{#key slot}
		<SlotCamera
			label={m['session.replace.shutter']({ n: slotNumber })}
			onshot={(url, burst) =>
				editor.slot !== null && editor.place(editor.slot, addPhoto({ url, source: 'camera', burst }))}
		/>
	{/key}
	<p class="m-0 text-xs leading-normal text-muted-foreground">
		{m['session.replace.camera_note']({ n: slotNumber })}
	</p>
{:else}
	<Dropzone
		onfiles={(files) => editor.replaceWith(files)}
		disabled={editor.isReplacing}
		class="relative flex h-47 shrink-0 flex-col items-center justify-center gap-3 border-2 border-dashed border-[#5a5853] p-4 text-center"
	>
		<RiUploadLine aria-hidden="true" class="size-8 text-primary" />
		<span class="font-display text-lg font-extrabold uppercase font-stretch-112%"
			>{m['session.upload.drop_title']()}</span
		>
		<label
			class={cn(
				'tracking-widests flex h-11 items-center bg-paper px-5 font-mono text-xs font-medium text-ink uppercase hover:bg-paper-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-paper',
				editor.isReplacing ? 'pointer-events-none opacity-50' : 'cursor-pointer'
			)}
		>
			<ReplaceInput {editor} />
			{editor.isReplacing ? m['session.upload.loading']() : m['session.replace.pick_file']()}
		</label>
	</Dropzone>

	<span class="{mono} text-[11px] tracking-widest text-muted-foreground">
		{m['session.upload.formats']()} · {m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}
	</span>

	<ReplaceError problem={editor.replaceProblem} />

	<SlotLibrary {editor} class="grid-cols-3" />
{/if}
