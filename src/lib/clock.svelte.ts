export function useClock() {
	let now = $state(Date.now())

	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 1000)
		return () => clearInterval(timer)
	})

	return {
		get now() {
			return now
		}
	}
}

export function hms(ms: number) {
	const s = Math.max(0, Math.floor(ms / 1000))
	return [s / 3600, (s / 60) % 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':')
}
