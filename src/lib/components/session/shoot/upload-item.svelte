<script lang="ts">
	import RiAlertLine from 'remixicon-svelte/icons/alert-line'
	import RiCheckLine from 'remixicon-svelte/icons/check-line'
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import type { ShootState, Upload } from '$lib/capture/shoot-state.svelte'
	import { UPLOAD_PROBLEMS } from '$lib/i18n/messages'
	import { m } from '$lib/paraglide/messages'
	import { mono } from './styles'

	let { shooter, item, isCompact = false }: { shooter: ShootState; item: Upload; isCompact?: boolean } = $props()
</script>

{#snippet thumb(className: string)}
	{#if item.status === 'error'}
		<span class="flex shrink-0 items-center justify-center border-[1.5px] border-primary bg-[#2a2a28] {className}">
			<RiAlertLine aria-hidden="true" class="size-1/3 text-primary" />
		</span>
	{:else if item.url}
		<img src={item.url} alt="" class="shrink-0 object-cover {className}" />
	{:else}
		<span class="shrink-0 animate-pulse bg-[#8a7560]/50 motion-reduce:animate-none {className}"></span>
	{/if}
{/snippet}

{#snippet status()}
	{#if item.status === 'error'}
		<span class="text-xs leading-snug text-body">{UPLOAD_PROBLEMS[item.problem ?? 'unreadable']()}</span>
	{:else}
		<span class="{mono} flex items-center gap-1.5 text-[11px] tracking-widest text-body">
			{#if item.status === 'placed'}
				<RiCheckLine aria-hidden="true" class="size-3.5 text-paper" />
				{m['session.upload.placed']({ n: item.slot ?? 0 })}
			{:else if item.status === 'kept'}
				{m['session.upload.kept']()}
			{:else}
				{m['session.upload.loading']()}
			{/if}
		</span>
	{/if}
{/snippet}

{#snippet dismiss()}
	{#if item.status === 'error'}
		<button
			type="button"
			onclick={() => shooter.dismiss(item.id)}
			aria-label={m['session.upload.dismiss']({ name: item.name })}
			class="flex size-11 shrink-0 items-center justify-center border border-[#3a3936] text-paper hover:border-paper"
		>
			<RiCloseLine aria-hidden="true" class="size-4" />
		</button>
	{/if}
{/snippet}

{#if isCompact}
	<li class="flex min-h-11 items-center gap-2.5 bg-ink/40 p-1.5">
		{@render thumb('size-8')}
		<div class="flex min-w-0 flex-1 flex-col gap-0.5">
			<span class="truncate font-mono text-[11px]">{item.name}</span>
			{@render status()}
		</div>
		{@render dismiss()}
	</li>
{:else}
	<li class="flex min-w-62 flex-1 basis-0 items-center gap-3 bg-[#232321] p-3">
		{@render thumb('size-18')}

		<div class="flex min-w-0 flex-1 flex-col gap-1.5">
			<span class="truncate font-mono text-xs">{item.name}</span>
			{#if item.status === 'loading'}
				<div
					role="progressbar"
					aria-label={m['session.upload.loading_file']({ name: item.name })}
					class="h-1 bg-[#3a3936]"
				>
					<div class="h-full animate-pulse bg-primary motion-reduce:animate-none"></div>
				</div>
			{/if}
			{@render status()}
		</div>

		{@render dismiss()}
	</li>
{/if}
