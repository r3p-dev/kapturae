<script lang="ts">
	import Logo from '$lib/components/logo.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	const year = new Date().getFullYear()
	const link = 'text-foreground underline underline-offset-4 hover:text-white'
</script>

<footer
	class="dark flex flex-col items-center justify-center gap-4 bg-background px-6 py-12 text-center text-foreground tablet:px-20 rail:h-65"
>
	<Logo class="size-16 text-paper" />

	<span class="font-display text-[22px] font-extrabold tracking-[0.04em] uppercase font-stretch-118%">
		{m['common.brand']()}
	</span>

	<nav class="flex flex-wrap justify-center gap-x-8 gap-y-2 font-mono text-[13px] tracking-[0.12em] uppercase">
		<a href="#flow" class={link}>{m['common.footer.how']()}</a>
		<a href="#data" class={link}>{m['common.footer.privacy']()}</a>
		<a href={localizeHref('/legal')} class={link}>{m['common.footer.legal']()}</a>
	</nav>

	<span class="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
		{m['common.footer.roll']({ year })} · {m['common.footer.made_by']()}
		<a href="https://r3p.dev" class={link}>R3P</a>
	</span>
</footer>
