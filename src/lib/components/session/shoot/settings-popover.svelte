<script lang="ts">
	import RiSettings3Line from 'remixicon-svelte/icons/settings-3-line'
	import RiTimerLine from 'remixicon-svelte/icons/timer-line'
	import { Popover } from 'bits-ui'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { mono } from './styles'
	import { cameraToggles } from './toggles'

	let { shooter }: { shooter: ShootState } = $props()

	const toggles = $derived(cameraToggles(shooter))
</script>

<div class="flex w-24 justify-end rail:hidden">
	<Popover.Root>
		<Popover.Trigger
			aria-label={m['session.shoot.settings']()}
			class="flex h-11 items-center gap-1.5 border-[1.5px] border-paper px-3 font-mono text-xs text-paper"
		>
			<RiSettings3Line aria-hidden="true" class="size-4" />
			{shooter.timer}s
		</Popover.Trigger>

		<Popover.Content
			side="top"
			align="end"
			sideOffset={16}
			class="z-40 flex gap-1 rounded-2xl bg-ink/92 p-2 text-paper shadow-lg outline-none"
		>
			<button
				type="button"
				onclick={() => shooter.cycleTimer()}
				disabled={shooter.isBusy}
				aria-label={m['session.shoot.timer_cycle']({ n: shooter.timer })}
				class="group flex w-16 flex-col items-center gap-1 py-1 disabled:opacity-50"
			>
				<span class="grid size-11 place-items-center rounded-full bg-paper text-ink">
					<RiTimerLine aria-hidden="true" class="size-5" />
				</span>
				<span class="{mono} text-[10px]">{shooter.timer}s</span>
			</button>

			{#each toggles as item (item.label)}
				<button
					type="button"
					onclick={item.flip}
					disabled={item.isLocked && shooter.isBusy}
					aria-pressed={item.isOn}
					aria-label={item.label}
					class="group flex w-16 flex-col items-center gap-1 py-1 disabled:opacity-50"
				>
					<span
						class="grid size-11 place-items-center rounded-full bg-paper/12 group-aria-pressed:bg-paper group-aria-pressed:text-ink"
					>
						<item.icon aria-hidden="true" class="size-5" />
					</span>
					<span class="{mono} text-[10px]">{item.label}</span>
				</button>
			{/each}
		</Popover.Content>
	</Popover.Root>
</div>
