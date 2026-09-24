<script lang="ts">
	import type { Snippet } from 'svelte'
	import { page } from '$app/state'
	import { Button } from '$lib/components/ui/button'
	import { m } from '$lib/paraglide/messages'
	import { getLocale, localizeHref, type Locale } from '$lib/paraglide/runtime'
	import { cn } from '$lib/utils'

	let { children, class: className }: { children?: Snippet; class?: string } = $props()

	const languages: Locale[] = ['id', 'en']
</script>

<span role="group" aria-label={m['common.lang_label']()} class={cn('flex items-center', className)}>
	{@render children?.()}

	{#each languages as locale (locale)}
		{@const isActive = getLocale() === locale}

		<Button
			href={localizeHref(page.url.pathname, { locale })}
			data-sveltekit-reload
			hreflang={locale}
			lang={locale}
			aria-current={isActive ? 'true' : undefined}
			variant="ghost"
			size="icon-lg"
			class="font-mono font-normal tracking-widest hover:bg-transparent"
		>
			<span
				class={cn(
					'border-[1.5px] border-foreground px-2 py-1 transition-colors',
					isActive ? 'bg-foreground text-background' : 'text-foreground hover:bg-foreground/15'
				)}
			>
				{locale.toUpperCase()}
			</span>
		</Button>
	{/each}
</span>
