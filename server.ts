import { serveBuild } from './scripts/serve_build.ts'

const server = serveBuild(Number(process.env.PORT ?? 4173), process.env.HOST ?? '0.0.0.0')
console.log(`Listening on ${server.url}`)

for (const signal of ['SIGTERM', 'SIGINT']) {
	process.on(signal, () => process.exit(0))
}
