<script lang="ts">
	import { page } from '$app/state'
	import { deLocalizeUrl, getLocale } from '$lib/paraglide/runtime'
	import { alternates, jsonLdScript, localizedUrl } from '$lib/seo'

	let {
		title,
		description,
		path,
		structured
	}: { title: string; description: string; path?: string; structured?: unknown } = $props()

	const canonicalPath = $derived(path ?? deLocalizeUrl(page.url).pathname)
	const canonical = $derived(localizedUrl(canonicalPath, getLocale()))
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#each alternates(canonicalPath) as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if structured}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(structured)}
	{/if}
</svelte:head>
