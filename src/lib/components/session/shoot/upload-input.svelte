<script lang="ts">
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { UPLOAD_ACCEPT } from '$lib/capture/upload'

	let { shooter }: { shooter: ShootState } = $props()

	function pick(event: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(event.currentTarget.files ?? [])]
		event.currentTarget.value = ''
		shooter.upload(files)
	}
</script>

<input
	type="file"
	accept={UPLOAD_ACCEPT}
	multiple={shooter.retake === null}
	disabled={shooter.isImporting || shooter.isComplete}
	onchange={pick}
	class="sr-only"
/>
