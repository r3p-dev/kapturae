import { m } from '$lib/paraglide/messages'
import type { FrameDesign, SessionStep } from '$lib/session'

type Message = () => string

export const STEP_LABELS: Record<SessionStep, Message> = {
	frame: m['session.steps.frame'],
	shoot: m['session.steps.shoot'],
	edit: m['session.steps.edit'],
	done: m['session.steps.done']
}

export const FRAME_NAMES: Record<FrameDesign, Message> = {
	classic: m['session.frames.classic'],
	film: m['session.frames.film'],
	christmas: m['session.frames.christmas'],
	birthday: m['session.frames.birthday'],
	lines: m['session.frames.lines'],
	accent: m['session.frames.accent']
}

const FRAME_LABELS: Partial<Record<FrameDesign, Message>> = {
	christmas: m['session.frames.christmas_label'],
	birthday: m['session.frames.birthday_label'],
	lines: m['session.frames.lines_label']
}

export const frameLabel = (design: FrameDesign) => (FRAME_LABELS[design] ?? m['common.brand'])()
