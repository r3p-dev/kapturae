<script lang="ts">
	import EditorPreview from '$lib/components/landing/editor-preview.svelte'
	import Flow from '$lib/components/landing/flow.svelte'
	import Frames from '$lib/components/landing/frames.svelte'
	import GifPreview from '$lib/components/landing/gif-preview.svelte'
	import Hero from '$lib/components/landing/hero.svelte'
	import SiteFooter from '$lib/components/landing/site-footer.svelte'
	import Start from '$lib/components/landing/start.svelte'
	import { m } from '$lib/paraglide/messages'
</script>

<svelte:head>
	<title>{m.meta_title()}</title>
	<meta name="description" content={m.meta_description()} />
</svelte:head>

<main>
	<Hero />
	<Flow />
	<Frames />
	<EditorPreview />
	<GifPreview />
	<Start />
</main>
<SiteFooter />
