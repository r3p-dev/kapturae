<script lang="ts">
	import RiImageAddLine from 'remixicon-svelte/icons/image-add-line'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { ITEM_SIZE } from '$lib/editor/editor.svelte'
	import { STICKER_LABELS } from '$lib/i18n/messages'
	import { m } from '$lib/paraglide/messages'
	import { shots } from '$lib/session/shots.svelte'
	import { STICKER_IDS, stickerSrc } from '$lib/stickers/stickers'
	import PanelHead from './panel-head.svelte'
	import RangeField from './range-field.svelte'
	import RemoveItem from './remove-item.svelte'
	import { tile } from './styles'

	let { editor }: { editor: EditState } = $props()

	function upload(event: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(event.currentTarget.files ?? [])]
		event.currentTarget.value = ''
		editor.importStickers(files)
	}
</script>

<PanelHead title={m['session.edit.sticker_title']()} onclose={() => editor.pickTool(null)} />

<div class="grid grid-cols-8 gap-1.5 rail:grid-cols-4 rail:gap-2.5">
	<label
		title={m['session.edit.sticker_upload_add']()}
		class="{tile} cursor-pointer border-dashed border-[#5e5c57] text-muted-foreground hover:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-primary"
	>
		<RiImageAddLine aria-hidden="true" class="size-5 rail:size-6" />
		<input
			type="file"
			accept="image/*"
			multiple
			aria-label={m['session.edit.sticker_upload_add']()}
			onchange={upload}
			class="sr-only"
		/>
	</label>

	{#each shots.uploads as url, index (url)}
		<button
			type="button"
			aria-label={m['session.edit.sticker_add']({
				name: `${m['session.edit.sticker_upload']()} ${index + 1}`
			})}
			onclick={() => editor.addSticker(url)}
			class="{tile} p-1.5"
		>
			<img src={url} alt="" class="max-h-full max-w-full object-contain" />
		</button>
	{/each}

	{#each STICKER_IDS as id (id)}
		<button
			type="button"
			aria-label={m['session.edit.sticker_add']({ name: STICKER_LABELS[id]() })}
			onclick={() => editor.addSticker(id)}
			class={tile}
		>
			<img src={stickerSrc(id)} alt="" class="size-6.5 rail:size-7.5" />
		</button>
	{/each}
</div>

<p class="m-0 text-xs leading-normal text-muted-foreground" aria-live="polite">
	{editor.hasUploadFailed ? m['session.edit.sticker_upload_error']() : m['session.edit.sticker_upload_note']()}
</p>

{#if editor.sticker}
	{@const sticker = editor.sticker}

	<RangeField
		label={m['session.edit.size']()}
		display="{sticker.size}%"
		value={sticker.size}
		set={(next) => (sticker.size = next)}
		oncommit={() => editor.commit()}
		options={ITEM_SIZE.sticker}
	/>
	<RemoveItem {editor} />
{/if}
