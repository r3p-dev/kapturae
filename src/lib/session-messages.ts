import { m } from '$lib/paraglide/messages'
import type { SessionStep } from '$lib/session'
import type { StickerId } from '$lib/stickers'
import { UPLOAD_MAX_MB, UPLOAD_MAX_MP, UPLOAD_MIN_SIDE, type UploadProblem } from '$lib/upload'

type Message = () => string

export const STEP_LABELS: Record<SessionStep, Message> = {
	frame: m['session.steps.frame'],
	shoot: m['session.steps.shoot'],
	edit: m['session.steps.edit'],
	done: m['session.steps.done']
}

export const STICKER_LABELS: Record<StickerId, Message> = {
	star: m['session.edit.stickers.star'],
	heart: m['session.edit.stickers.heart'],
	sparkle: m['session.edit.stickers.sparkle'],
	twinkle: m['session.edit.stickers.twinkle'],
	smile: m['session.edit.stickers.smile'],
	sun: m['session.edit.stickers.sun'],
	moon: m['session.edit.stickers.moon'],
	cloud: m['session.edit.stickers.cloud'],
	rainbow: m['session.edit.stickers.rainbow'],
	bolt: m['session.edit.stickers.bolt'],
	fire: m['session.edit.stickers.fire'],
	snowflake: m['session.edit.stickers.snowflake'],
	flower: m['session.edit.stickers.flower'],
	tree: m['session.edit.stickers.tree'],
	cherry: m['session.edit.stickers.cherry'],
	balloon: m['session.edit.stickers.balloon'],
	gift: m['session.edit.stickers.gift'],
	bow: m['session.edit.stickers.bow'],
	crown: m['session.edit.stickers.crown'],
	gem: m['session.edit.stickers.gem'],
	note: m['session.edit.stickers.note'],
	bubble: m['session.edit.stickers.bubble'],
	snowman: m['session.edit.stickers.snowman'],
	cross: m['session.edit.stickers.cross']
}

export const UPLOAD_PROBLEMS: Record<UploadProblem, Message> = {
	format: m['session.upload.problems.format'],
	size: () => m['session.upload.problems.size']({ n: UPLOAD_MAX_MB }),
	small: () => m['session.upload.problems.small']({ n: UPLOAD_MIN_SIDE }),
	large: () => m['session.upload.problems.large']({ n: UPLOAD_MAX_MP }),
	heic: m['session.upload.problems.heic'],
	unreadable: m['session.upload.problems.unreadable']
}
