<script lang="ts">
	import type { Pathname } from '$app/types'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { m } from '$lib/paraglide/messages'
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime'
	import './layout.css'

	let { children } = $props()

	const locale = getLocale()
	const ogImage = $derived(new URL(`/og-${locale}.png`, page.url.origin).href)
	const ogAlt = `${m['common.brand']()}: ${[m['landing.hero.title_1'](), m['landing.hero.title_2'](), m['landing.hero.title_3']()].join(' ')}`
</script>

<svelte:head>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={m['common.brand']()} />
	<meta property="og:locale" content={locale === 'id' ? 'id_ID' : 'en_US'} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={ogAlt} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
