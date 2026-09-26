import { FRAMES } from '$lib/frames/frames'
import { PRINT_SIZES, pick, type Frame } from '$lib/session/session'

export function frameFor(search: URLSearchParams) {
	const requested = pick(PRINT_SIZES, search.get('size')) ?? '2x6'
	return (
		FRAMES.find((candidate) => candidate.id === search.get('frame')) ??
		FRAMES.find((candidate) => candidate.size === requested) ??
		FRAMES[0]
	)
}

export function frameQuery(frame: Frame) {
	return new URLSearchParams({ size: frame.size, frame: frame.id }).toString()
}
