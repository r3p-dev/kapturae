import { m } from '$lib/paraglide/messages'
import type { SessionStep } from '$lib/session/session'
import type { StickerId } from '$lib/stickers/stickers'
import { UPLOAD_MAX_MB, UPLOAD_MAX_MP, UPLOAD_MIN_SIDE, type UploadProblem } from '$lib/capture/upload'
import type { LegalDocument } from '$lib/site/legal'

type Message = () => string

type Page = {
	title: Message
	summary: Message
	sections: [title: Message, body: Message, href?: string][]
}

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

	size() {
		return m['session.upload.problems.size']({ n: UPLOAD_MAX_MB })
	},
	small() {
		return m['session.upload.problems.small']({ n: UPLOAD_MIN_SIDE })
	},
	large() {
		return m['session.upload.problems.large']({ n: UPLOAD_MAX_MP })
	},

	heic: m['session.upload.problems.heic'],
	unreadable: m['session.upload.problems.unreadable']
}

export const LEGAL_PAGES: Record<LegalDocument, Page> = {
	privacy: {
		title: m['legal.privacy.title'],
		summary: m['legal.privacy.summary'],
		sections: [
			[m['legal.privacy.device.title'], m['legal.privacy.device.body']],
			[m['legal.privacy.camera.title'], m['legal.privacy.camera.body']],
			[m['legal.privacy.storage.title'], m['legal.privacy.storage.body']],
			[m['legal.privacy.clearing.title'], m['legal.privacy.clearing.body']],
			[m['legal.privacy.server.title'], m['legal.privacy.server.body']],
			[m['legal.privacy.third_parties.title'], m['legal.privacy.third_parties.body']],
			[m['legal.privacy.rights.title'], m['legal.privacy.rights.body']],
			[m['legal.privacy.changes.title'], m['legal.privacy.changes.body']]
		]
	},
	terms: {
		title: m['legal.terms.title'],
		summary: m['legal.terms.summary'],
		sections: [
			[m['legal.terms.service.title'], m['legal.terms.service.body']],
			[m['legal.terms.responsibility.title'], m['legal.terms.responsibility.body']],
			[m['legal.terms.access.title'], m['legal.terms.access.body']],
			[m['legal.terms.watermark.title'], m['legal.terms.watermark.body']],
			[m['legal.terms.prohibited.title'], m['legal.terms.prohibited.body']],
			[m['legal.terms.designs.title'], m['legal.terms.designs.body']],
			[m['legal.terms.warranty.title'], m['legal.terms.warranty.body']],
			[m['legal.terms.law.title'], m['legal.terms.law.body']]
		]
	},
	deletion: {
		title: m['legal.deletion.title'],
		summary: m['legal.deletion.summary'],
		sections: [
			[m['legal.deletion.cleared.title'], m['legal.deletion.cleared.body']],
			[m['legal.deletion.yourself.title'], m['legal.deletion.yourself.body']],
			[m['legal.deletion.elsewhere.title'], m['legal.deletion.elsewhere.body']],
			[m['legal.deletion.requests.title'], m['legal.deletion.requests.body']]
		]
	},
	camera: {
		title: m['legal.camera.title'],
		summary: m['legal.camera.summary'],
		sections: [
			[m['legal.camera.why.title'], m['legal.camera.why.body']],
			[m['legal.camera.when.title'], m['legal.camera.when.body']],
			[m['legal.camera.recording.title'], m['legal.camera.recording.body']],
			[m['legal.camera.manage.title'], m['legal.camera.manage.body']],
			[m['legal.camera.denied.title'], m['legal.camera.denied.body']]
		]
	},
	data: {
		title: m['legal.data.title'],
		summary: m['legal.data.summary'],
		sections: [
			[m['legal.data.capture.title'], m['legal.data.capture.body']],
			[m['legal.data.edit.title'], m['legal.data.edit.body']],
			[m['legal.data.finish.title'], m['legal.data.finish.body']],
			[m['legal.data.storage.title'], m['legal.data.storage.body']],
			[m['legal.data.cookies.title'], m['legal.data.cookies.body']]
		]
	},
	contact: {
		title: m['legal.contact.title'],
		summary: m['legal.contact.summary'],
		sections: [
			[m['legal.contact.email.title'], m['legal.contact.email.body'], `mailto:${m['legal.contact.email.body']()}`],
			[m['legal.contact.website.title'], m['legal.contact.website.body'], 'https://r3p.dev'],
			[m['legal.contact.shared.title'], m['legal.contact.shared.body']],
			[m['legal.contact.response.title'], m['legal.contact.response.body']],
			[m['legal.contact.operator.title'], m['legal.contact.operator.body']]
		]
	}
}
