import { m } from '$lib/paraglide/messages'
import type { SessionStep } from '$lib/session'

type Message = () => string

export const STEP_LABELS: Record<SessionStep, Message> = {
	frame: m['session.steps.frame'],
	shoot: m['session.steps.shoot'],
	edit: m['session.steps.edit'],
	done: m['session.steps.done']
}
