<script lang="ts">
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import LangSwitch from '$lib/components/molecules/lang-switch.svelte'
	import Logo from '$lib/components/atoms/logo.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { SESSION_STEPS, type SessionStep } from '$lib/session'
	import { STEP_LABELS } from '$lib/session-messages'
	import { cn } from '$lib/utils'

	let { step, class: className }: { step: SessionStep; class?: string } = $props()

	const home = localizeHref('/').replace(/(.)\/$/, '$1')
	const pad = (n: number) => String(n).padStart(2, '0')
	const current = $derived(SESSION_STEPS.indexOf(step))

	const mono = 'font-mono text-xs tracking-[0.14em] uppercase'
</script>

<header
	class={cn(
		'flex h-14 shrink-0 items-center justify-between border-b border-[#2a2a28] px-2 rail:h-18 rail:px-8',
		className
	)}
>
	<a
		href={home}
		aria-label={m['session.exit']()}
		class="flex size-11 items-center justify-center text-foreground rail:hidden"
	>
		<RiCloseLine aria-hidden="true" class="size-5" />
	</a>

	<a
		href={home}
		class="hidden items-center gap-3 text-foreground no-underline rail:flex desktop:w-70"
	>
		<Logo class="size-9 shrink-0 text-paper" />
		<span
			class="font-display text-base font-extrabold tracking-[0.04em] uppercase font-stretch-118%"
		>
			{m['common.brand']()}
		</span>
	</a>

	<span class="{mono} text-[11px] rail:text-xs desktop:hidden">
		{m['session.step']({
			n: pad(current + 1),
			total: pad(SESSION_STEPS.length),
			name: STEP_LABELS[step]()
		})}
	</span>

	<nav aria-label={m['session.steps_aria']()} class="hidden desktop:block">
		<ol class="m-0 flex list-none items-center gap-3 p-0">
			{#each SESSION_STEPS as key, i (key)}
				<li class="flex items-center gap-3">
					{#if i > 0}<span aria-hidden="true" class="h-px w-7 bg-[#3a3936]"></span>{/if}
					<span
						aria-current={i === current ? 'step' : undefined}
						class={cn(
							mono,
							'px-2.5 py-1.25 text-[#8c8983]',
							i < current && 'text-foreground',
							'aria-[current=step]:border-[1.5px] aria-[current=step]:border-primary aria-[current=step]:text-primary-text'
						)}
					>
						{pad(i + 1)}
						{STEP_LABELS[key]()}
					</span>
				</li>
			{/each}
		</ol>
	</nav>

	<div class="flex items-center gap-3 desktop:w-70 desktop:justify-end">
		<LangSwitch class="text-xs" />

		<a
			href={home}
			aria-label={m['session.exit']()}
			class="hidden size-11 items-center justify-center border border-[#3a3936] text-foreground hover:border-foreground rail:flex"
		>
			<RiCloseLine aria-hidden="true" class="size-4.5" />
		</a>
	</div>
</header>
