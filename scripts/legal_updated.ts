import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const FILES = ['messages/en.json', 'messages/id.json']

function git(...parameters: string[]) {
	return execFileSync('git', parameters, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
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
	const date = new Date()
	return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
		.map((part) => String(part).padStart(2, '0'))
		.join('-')
}

function at(revision: string) {
	return snapshot((file) => git('show', `${revision}:${file}`))
}

export function legalUpdated() {
	if (process.env.LEGAL_UPDATED) {
		return process.env.LEGAL_UPDATED
	}

	try {
		if (snapshot((file) => readFileSync(file, 'utf8')) !== at('HEAD')) {
			return today()
		}

		for (const line of git('log', '--format=%H %cs', '--', ...FILES)
			.trim()
			.split('\n')) {
			const [revision, date] = line.split(' ')
			if (at(revision) !== at(`${revision}^`)) {
				return date
			}
		}
	} catch {}
}

if (import.meta.main) {
	console.log(legalUpdated() ?? '')
}
