<script lang="ts">
	import Logo from '$lib/components/logo.svelte'
	import { m } from '$lib/paraglide/messages'

	const year = new Date().getFullYear()
	const link = 'text-foreground underline underline-offset-4 hover:text-white'
</script>

<footer
	class="dark flex flex-col items-center justify-center gap-4 bg-background px-6 py-12 text-center text-foreground sm:px-20 lg:h-65"
>
	<Logo class="size-16 text-paper" />
	<span class="font-display text-[22px] font-extrabold tracking-[0.04em] uppercase font-stretch-118%">
		{m['common.brand']()}
	</span>
	<nav class="flex flex-wrap justify-center gap-x-8 gap-y-2 font-mono text-[13px] tracking-[0.12em] uppercase">
		<a href="https://instagram.com" class={link}>{m['common.footer.instagram']()}</a>
		<a href="#flow" class={link}>{m['common.footer.how']()}</a>
		<a href="#start" class={link}>{m['common.footer.privacy']()}</a>
	</nav>
	<span class="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
		{m['common.footer.roll']({ year })}
	</span>
</footer>
