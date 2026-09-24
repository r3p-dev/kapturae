<script lang="ts">
	import type { Pathname } from '$app/types'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import LangSwitch from '$lib/components/molecules/lang-switch.svelte'
	import Logo from '$lib/components/atoms/logo.svelte'
	import * as Select from '$lib/components/ui/select'
	import { LEGAL_DOCUMENTS, type LegalDocument } from '$lib/legal'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { PageProps } from './$types'

	type Message = () => string
	type Page = {
		title: Message
		summary: Message
		sections: [title: Message, body: Message, href?: string][]
	}

	let { params }: PageProps = $props()

	const pages: Record<LegalDocument, Page> = {
		privacy: {
			title: m['legal.privacy.title'],
			summary: m['legal.privacy.summary'],
			sections: [
				[m['legal.privacy.processed.title'], m['legal.privacy.processed.body']],
				[m['legal.privacy.purpose.title'], m['legal.privacy.purpose.body']],
				[m['legal.privacy.retention.title'], m['legal.privacy.retention.body']],
				[m['legal.privacy.sharing.title'], m['legal.privacy.sharing.body']],
				[m['legal.privacy.rights.title'], m['legal.privacy.rights.body']]
			]
		},
		terms: {
			title: m['legal.terms.title'],
			summary: m['legal.terms.summary'],
			sections: [
				[m['legal.terms.service.title'], m['legal.terms.service.body']],
				[m['legal.terms.prohibited.title'], m['legal.terms.prohibited.body']],
				[m['legal.terms.ownership.title'], m['legal.terms.ownership.body']],
				[m['legal.terms.liability.title'], m['legal.terms.liability.body']],
				[m['legal.terms.changes.title'], m['legal.terms.changes.body']]
			]
		},
		deletion: {
			title: m['legal.deletion.title'],
			summary: m['legal.deletion.summary'],
			sections: [
				[m['legal.deletion.auto.title'], m['legal.deletion.auto.body']],
				[m['legal.deletion.now.title'], m['legal.deletion.now.body']],
				[m['legal.deletion.excluded.title'], m['legal.deletion.excluded.body']],
				[m['legal.deletion.manual.title'], m['legal.deletion.manual.body']]
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
				[m['legal.data.expiry.title'], m['legal.data.expiry.body']],
				[m['legal.data.cookies.title'], m['legal.data.cookies.body']]
			]
		},
		contact: {
			title: m['legal.contact.title'],
			summary: m['legal.contact.summary'],
			sections: [
				[m['legal.contact.email.title'], m['legal.contact.email.body'], `mailto:${m['legal.contact.email.body']()}`],
				[m['legal.contact.website.title'], m['legal.contact.website.body'], 'https://r3p.dev'],
				[m['legal.contact.deletion.title'], m['legal.contact.deletion.body']],
				[m['legal.contact.response.title'], m['legal.contact.response.body']],
				[m['legal.contact.operator.title'], m['legal.contact.operator.body']]
			]
		}
	}

	const home = localizeHref('/').replace(/(.)\/$/, '$1')
	function href(name: LegalDocument) {
		return localizeHref(`/legal/${name}`)
	}
	function pad(value: number) {
		return String(value).padStart(2, '0')
	}

	const slug = $derived<LegalDocument>(params.doc ?? 'privacy')
	const current = $derived(pages[slug])
	const count = $derived(
		m['legal.count']({ n: pad(LEGAL_DOCUMENTS.indexOf(slug) + 1), total: pad(LEGAL_DOCUMENTS.length) })
	)

	function pick(next: string) {
		if (next === slug) {
			return
		}
		goto(resolve(href(next as LegalDocument) as Pathname), { noScroll: true })
	}

	const updated = __LEGAL_UPDATED__
		? m['legal.updated']({
				date: new Intl.DateTimeFormat('id-ID', {
					dateStyle: 'long',
					timeZone: 'UTC'
				}).format(new Date(__LEGAL_UPDATED__))
			})
		: undefined

	const bracket = 'h-3.5 w-1.75 border-2 border-current'
	const stamp = 'font-mono text-[11px] tracking-widest text-muted-foreground uppercase'
</script>

<svelte:head>
	<title>{m['legal.meta_title']({ doc: current.title() })}</title>
	<meta name="description" content={m['legal.meta_description']()} />
</svelte:head>

<div class="flex min-h-svh flex-col bg-background text-foreground">
	<header class="flex h-15 shrink-0 items-center justify-between border-b-2 border-ink pr-2 pl-4 rail:h-18 rail:px-10">
		<a href={home} class="flex items-center gap-2.5 text-foreground no-underline rail:gap-3">
			<Logo class="size-7.5 shrink-0 rail:size-9" />
			<span
				class="font-display text-sm font-extrabold uppercase font-stretch-118% rail:text-base rail:tracking-[0.04em]"
			>
				{m['common.brand']()}
			</span>
		</a>

		<span class="hidden font-mono text-xs tracking-[0.16em] uppercase rail:inline">{m['legal.hud']()}</span>

		<LangSwitch />
	</header>

	<div class="flex flex-1">
		<nav aria-label={m['legal.nav_aria']()} class="hidden w-85 shrink-0 border-r border-rule px-8 py-10 rail:block">
			<div class="sticky top-10 flex flex-col gap-1.5">
				{#each LEGAL_DOCUMENTS as key, index (key)}
					<a
						href={href(key)}
						aria-current={key === slug ? 'page' : undefined}
						class="flex h-13 items-center gap-3.5 px-4 text-foreground no-underline hover:bg-paper-2 aria-[current=page]:bg-ink aria-[current=page]:text-paper"
					>
						<span class="font-mono text-xs tracking-widest">{pad(index + 1)}</span>
						<span class="text-[15px] font-medium">{pages[key].title()}</span>
					</a>
				{/each}

				{#if updated}
					<span class="{stamp} mt-5 px-4">{updated}</span>
				{/if}
			</div>
		</nav>

		<main class="flex max-w-230 min-w-0 flex-1 flex-col gap-4.5 px-5 py-6 rail:gap-6 rail:px-20 rail:py-12">
			<div class="flex flex-col gap-4.5 rail:hidden">
				<span id="legal-doc" class="font-mono text-[11px] tracking-[0.14em] uppercase">
					{m['legal.pick']()}
				</span>

				<Select.Root type="single" value={slug} onValueChange={pick}>
					<Select.Trigger
						aria-labelledby="legal-doc"
						class="h-12! w-full border-2 border-ink bg-paper px-3 text-base text-foreground focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5! [&_svg]:text-foreground"
					>
						{current.title()}
					</Select.Trigger>

					<Select.Content class="border-2 border-ink ring-0">
						{#each LEGAL_DOCUMENTS as key, index (key)}
							<Select.Item value={key} label={pages[key].title()} class="min-h-11 gap-3 text-base">
								<span class="font-mono text-xs tracking-widest text-muted-foreground">{pad(index + 1)}</span>
								{pages[key].title()}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<p class="m-0 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.16em] uppercase rail:text-xs">
				<span aria-hidden="true" class="{bracket} border-r-0"></span>
				{count}
				<span aria-hidden="true" class="{bracket} border-l-0"></span>
			</p>

			<h1
				class="m-0 font-display text-[38px] leading-[0.95] font-black uppercase font-stretch-115% rail:text-[56px] rail:font-stretch-118%"
			>
				{current.title()}
			</h1>

			<div
				class="dark flex flex-col gap-2 bg-background p-4 text-foreground rail:flex-row rail:items-start rail:gap-5 rail:px-6 rail:py-5"
			>
				<span class="shrink-0 font-mono text-[11px] tracking-[0.14em] text-primary-text uppercase rail:pt-0.75">
					{m['legal.summary']()}
				</span>
				<p class="m-0 text-[15px] leading-[1.55] rail:text-base">{current.summary()}</p>
			</div>

			{#each current.sections as [title, body, link], index (index)}
				<section class="flex flex-col gap-1.5 border-t border-rule pt-3.5 rail:gap-2 rail:pt-4.5">
					<h2 class="m-0 font-display text-[17px] font-extrabold font-stretch-110% rail:text-xl">
						{title()}
					</h2>

					<p class="m-0 text-[15px] leading-[1.6] text-body rail:text-base rail:leading-[1.65]">
						{#if link}<a href={link} class="underline underline-offset-4 hover:text-foreground">{body()}</a
							>{:else}{body()}{/if}
					</p>
				</section>
			{/each}

			{#if slug !== 'contact'}
				<a
					href={href('contact')}
					class="mt-2 inline-flex min-h-11 items-center self-start border-b-2 border-ink font-mono text-xs tracking-[0.12em] text-foreground uppercase no-underline"
				>
					{m['legal.ask']()} →
				</a>
			{/if}

			{#if updated}
				<span class="{stamp} rail:hidden">{updated}</span>
			{/if}
		</main>
	</div>
</div>
