<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants'

	export const shutterVariants = tv({
		slots: {
			ring: 'rounded-full p-0 hover:bg-transparent',
			disc: 'flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform'
		},
		variants: {
			size: {
				md: {
					ring: 'size-22 border-3 border-foreground',
					disc: 'size-16 group-active/button:scale-90'
				},
				lg: {
					ring: 'size-55 border-4 border-foreground',
					disc: 'size-44 font-display text-[26px] font-black tracking-[0.06em] uppercase font-stretch-118% group-hover/button:scale-95 group-active/button:scale-90'
				}
			}
		},
		defaultVariants: { size: 'md' }
	})

	export type ShutterSize = VariantProps<typeof shutterVariants>['size']
</script>

<script lang="ts">
	import type { Snippet } from 'svelte'
	import { Button, type ButtonProps } from '$lib/components/ui/button'
	import { cn } from '$lib/utils'

	let {
		size,
		children,
		class: className,
		...restProps
	}: Omit<ButtonProps, 'size' | 'variant'> & { size?: ShutterSize; children?: Snippet } = $props()

	const styles = $derived(shutterVariants({ size }))
</script>

<Button variant="ghost" class={cn(styles.ring(), className)} {...restProps}>
	<span class={styles.disc()}>{@render children?.()}</span>
</Button>
