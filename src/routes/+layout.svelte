<script lang="ts">
	import { onMount } from 'svelte'
	import { m } from '$lib/paraglide/messages'
	import { baseLocale, getLocale, locales } from '$lib/paraglide/runtime'
	import { SITE, absoluteUrl } from '$lib/site/seo'
	import './layout.css'

	let { children } = $props()

	const locale = getLocale()
	const ogLocale = { en: 'en_US', id: 'id_ID' }
	onMount(() => {
		import('$lib/storage/store').then((store) => store.removeAbandonedSessions()).catch(() => {})
	})

	const ogAlt = `${SITE.name}: ${[m['landing.hero.title_1'](), m['landing.hero.title_2'](), m['landing.hero.title_3']()].join(' ')}`
</script>

<svelte:head>
	<meta name="application-name" content={SITE.name} />
	<link rel="manifest" href={locale === baseLocale ? '/manifest.webmanifest' : `/manifest-${locale}.webmanifest`} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:locale" content={ogLocale[locale]} />
	{#each locales.filter((alternate) => alternate !== locale) as alternate (alternate)}
		<meta property="og:locale:alternate" content={ogLocale[alternate]} />
	{/each}
	<meta property="og:image" content={absoluteUrl(`/og/${locale}.png`)} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={ogAlt} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{@render children()}
