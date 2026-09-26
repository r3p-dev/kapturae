<script lang="ts">
	import type { UploadProblem } from '$lib/capture/upload'
	import { UPLOAD_PROBLEMS } from '$lib/i18n/messages'

	let { problem }: { problem: UploadProblem | null } = $props()
</script>

{#if problem}
	<p role="alert" class="m-0 border-l-2 border-primary pl-2.5 text-xs leading-normal text-body">
		{UPLOAD_PROBLEMS[problem]()}
	</p>
{/if}
