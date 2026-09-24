export function useClock() {
	let now = $state(Date.now())

	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 1000)
		return () => clearInterval(timer)
	})

	return {
		now() {
			return now
		}
	}
}

export function formatDuration(milliseconds: number) {
	const seconds = Math.max(0, Math.floor(milliseconds / 1000))
	return [seconds / 3600, (seconds / 60) % 60, seconds % 60]
		.map((part) => String(Math.floor(part)).padStart(2, '0'))
		.join(':')
}
