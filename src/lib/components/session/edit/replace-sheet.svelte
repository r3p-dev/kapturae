<script lang="ts">
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiImageLine from 'remixicon-svelte/icons/image-line'
	import * as Sheet from '$lib/components/ui/sheet'
	import { UPLOAD_MAX_MB } from '$lib/capture/upload'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'
	import PhotoSource from './photo-source.svelte'
	import ReplaceError from './replace-error.svelte'
	import ReplaceInput from './replace-input.svelte'
	import SlotLibrary from './slot-library.svelte'
	import { mono } from './styles'

	let { editor }: { editor: EditState } = $props()
</script>

<Sheet.Root bind:open={() => editor.isSheetOpen && editor.slot !== null, (open) => (editor.isSheetOpen = open)}>
	<Sheet.Content
		side="bottom"
		showCloseButton={false}
		class="dark max-h-[85svh] gap-3.5 overflow-y-auto border-[#3a3936] bg-card px-4 pt-2.5 pb-4 text-foreground scheme-dark"
	>
		{#if editor.slot !== null}
			<span aria-hidden="true" class="h-1 w-10 shrink-0 self-center bg-[#5a5853]"></span>

			<Sheet.Header class="gap-1 p-0">
				<Sheet.Title class="m-0 font-display text-xl font-extrabold uppercase font-stretch-112%">
					{editor.hasPhoto
						? m['session.replace.sheet_title']({ n: editor.slot + 1 })
						: m['session.replace.sheet_fill']({ n: editor.slot + 1 })}
				</Sheet.Title>
				<Sheet.Description class="m-0">
					{#if editor.slotPhoto}
						{m['session.replace.now']()}
						<PhotoSource photo={editor.slotPhoto} />
					{:else}
						<span class="text-xs text-muted-foreground">{m['session.edit.select_slot']()}</span>
					{/if}
				</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-col gap-2">
				<a
					href={editor.shootHref(editor.slot)}
					class="flex h-16 items-center gap-3.5 border border-[#3a3936] bg-[#232321] px-3.5 text-foreground no-underline"
				>
					<span class="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
						<RiCameraLine aria-hidden="true" class="size-5" />
					</span>
					<span class="flex flex-col gap-0.5">
						<span class="{mono} text-xs font-medium tracking-widest">{m['session.replace.camera']()}</span>
						<span class="text-[13px] text-muted-foreground">{m['session.replace.camera_hint']()}</span>
					</span>
				</a>

				<label
					class={cn(
						'flex h-16 items-center gap-3.5 border border-[#3a3936] bg-[#232321] px-3.5 has-focus-visible:outline-2 has-focus-visible:outline-paper',
						editor.isReplacing ? 'pointer-events-none opacity-50' : 'cursor-pointer'
					)}
				>
					<ReplaceInput {editor} />
					<span class="flex size-10 shrink-0 items-center justify-center bg-paper text-ink">
						<RiImageLine aria-hidden="true" class="size-5" />
					</span>
					<span class="flex flex-col gap-0.5">
						<span class="{mono} text-xs font-medium tracking-widest">
							{editor.isReplacing ? m['session.upload.loading']() : m['session.replace.gallery']()}
						</span>
						<span class="text-[13px] text-muted-foreground">
							{m['session.upload.formats']()} · {m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}
						</span>
					</span>
				</label>

				<ReplaceError problem={editor.replaceProblem} />
			</div>

			<SlotLibrary {editor} class="grid-cols-4" />

			<Sheet.Close class="mt-1 h-12 shrink-0 border border-[#3a3936] font-mono text-xs tracking-[0.12em] uppercase">
				{m['session.replace.cancel']()}
			</Sheet.Close>
		{/if}
	</Sheet.Content>
</Sheet.Root>
