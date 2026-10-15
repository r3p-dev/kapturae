export {}

const port = process.env.PORT ?? '4173'

try {
	const response = await fetch(`http://127.0.0.1:${port}/robots.txt`, {
		signal: AbortSignal.timeout(3000)
	})
	process.exit(response.ok ? 0 : 1)
} catch {
	process.exit(1)
}
