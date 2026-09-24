import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const FILES = ['messages/en.json', 'messages/id.json']

function git(...args: string[]) {
	return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

function snapshot(read: (file: string) => string) {
	return FILES.map((file) => {
		try {
			return JSON.stringify(JSON.parse(read(file)).legal ?? null)
		} catch {
			return 'null'
		}
	}).join('\n')
}

function today() {
	const d = new Date()
	return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
}

function at(rev: string) {
	return snapshot((file) => git('show', `${rev}:${file}`))
}

export function legalUpdated() {
	if (process.env.LEGAL_UPDATED) return process.env.LEGAL_UPDATED

	try {
		if (snapshot((file) => readFileSync(file, 'utf8')) !== at('HEAD')) return today()

		for (const line of git('log', '--format=%H %cs', '--', ...FILES)
			.trim()
			.split('\n')) {
			const [rev, date] = line.split(' ')
			if (at(rev) !== at(`${rev}^`)) return date
		}
	} catch {}
}

if (import.meta.main) console.log(legalUpdated() ?? '')
