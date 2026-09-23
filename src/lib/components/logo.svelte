<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements'

	let { label, ...restProps }: SVGAttributes<SVGSVGElement> & { label?: string } = $props()

	const uid = $props.id()
	const maskId = `logo-mask-${uid}`
</script>

<svg
	viewBox="0 0 1024 1024"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	{...restProps}
>
	<defs>
		<mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
			<rect width="1024" height="1024" fill="black" />
			<path
				d="M200 275C200 233.579 233.579 200 275 200H824V824H275C233.579 824 200 790.421 200 749V275Z"
				fill="white"
			/>
			<circle cx="644" cy="512" r="165" fill="none" stroke="black" stroke-width="30" />
			<rect x="717" y="679.344" width="151.808" height="213.72" transform="rotate(-45 717 679.344)" fill="black" />
			<rect x="868.123" y="186" width="151.808" height="213.72" transform="rotate(45 868.123 186)" fill="black" />
			<circle cx="659" cy="512" r="180" fill="none" stroke="white" stroke-width="30" />
			<rect x="620.553" y="158" width="50" height="500" transform="rotate(45 620.553 158)" fill="black" />
			<rect x="267" y="511.553" width="50" height="500" transform="rotate(-45 267 511.553)" fill="black" />
			<rect x="865.553" y="158" width="30" height="500" transform="rotate(45 865.553 158)" fill="black" />
			<rect x="512" y="511.553" width="30" height="500" transform="rotate(-45 512 511.553)" fill="black" />
			<rect x="426.088" y="423.165" width="600" height="125" transform="rotate(45 426.088 423.165)" fill="white" />
			<rect x="337.7" y="511.553" width="600" height="125" transform="rotate(-45 337.7 511.553)" fill="white" />
			<rect x="724" y="824" width="100" height="150" fill="black" />
			<rect x="724" y="50" width="100" height="150" fill="black" />
			<rect x="455" y="90" width="411" height="110" fill="black" />
			<rect x="450" y="824" width="411" height="110" fill="black" />
			<circle cx="690" cy="535" r="60" fill="black" />
			<circle cx="669" cy="519" r="75" fill="white" />
			<path
				d="M316 163C316 149.193 327.193 138 341 138H441C454.807 138 466 149.193 466 163V178H316V163Z"
				fill="white"
			/>
			<rect x="1024" y="1024" width="200" height="50" transform="rotate(-180 1024 1024)" fill="white" />
			<rect x="1024" y="824" width="200" height="50" transform="rotate(90 1024 824)" fill="white" />
			<rect y="1024" width="200" height="50" transform="rotate(-90 0 1024)" fill="white" />
			<rect x="200" y="1024" width="200" height="50" transform="rotate(-180 200 1024)" fill="white" />
			<rect x="1024" width="200" height="50" transform="rotate(90 1024 0)" fill="white" />
			<rect x="824" width="200" height="50" fill="white" />
			<rect width="200" height="50" fill="white" />
			<rect y="200" width="200" height="50" transform="rotate(-90 0 200)" fill="white" />
		</mask>
	</defs>
	<rect width="1024" height="1024" fill="currentColor" mask="url(#{maskId})" />
</svg>
