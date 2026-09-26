<script lang="ts">
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import { m } from '$lib/paraglide/messages'
	import type { Photo } from '$lib/session/shots.svelte'
	import { mono } from './styles'

	let { photo }: { photo: Photo } = $props()
</script>

<span class="{mono} flex min-w-0 items-center gap-1.5 text-[11px] tracking-[0.08em] text-body">
	{#if photo.source === 'upload'}
		<RiUploadLine aria-hidden="true" class="size-3.25 shrink-0" />
		<span class="truncate">{m['session.source.from_upload']()}{photo.name ? ` · ${photo.name}` : ''}</span>
	{:else}
		<RiCameraLine aria-hidden="true" class="size-3.25 shrink-0" />
		<span class="truncate">{m['session.source.camera']()}</span>
	{/if}
</span>
