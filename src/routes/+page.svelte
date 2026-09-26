<script lang="ts">
	import DataPrivacy from '$lib/components/landing/data-privacy.svelte'
	import EditorPreview from '$lib/components/landing/editor-preview.svelte'
	import Flow from '$lib/components/landing/flow.svelte'
	import Frames from '$lib/components/landing/frames.svelte'
	import GifPreview from '$lib/components/landing/gif-preview.svelte'
	import Hero from '$lib/components/landing/hero.svelte'
	import SiteFooter from '$lib/components/landing/site-footer.svelte'
	import Start from '$lib/components/landing/start.svelte'
	import Seo from '$lib/components/atoms/seo.svelte'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { structuredData } from '$lib/site/seo'

	const description = m['landing.meta.description']()
</script>

<Seo title={m['landing.meta.title']()} {description} path="/" structured={structuredData(getLocale(), description)} />

<main>
	<Hero />
	<Flow />
	<Frames />
	<EditorPreview />
	<GifPreview />
	<DataPrivacy />
	<Start />
</main>
<SiteFooter />
