import type { DocumentIdentity } from '@/identity/load'

type DocumentExperience = DocumentIdentity['experiences'][number]

export type DocumentPerson = {
	name: string
	nameKana: string
	gender?: string
	birthDate: string
	age: number
	location: string
	email: string
	phone?: string
	website: string
}

export type ChronologyItem = {
	id: string
	period: string
	description: string
	note?: string
}

export type QualificationItem = {
	id: string
	date: string
	name: string
}

export type ProjectItem = {
	id: string
	period: string
	title: string
	organization?: string
	summary: string
	responsibilities: string[]
	achievements: string[]
	technologies: Array<{ name: string; description?: string }>
	deliverables: Array<{ label: string; url: string }>
}

export type SkillsheetViewModel = {
	person: DocumentPerson
	professionalSummary?: string
	skills: DocumentIdentity['profile']['skills']
	projects: ProjectItem[]
}

export type ResumeViewModel = {
	person: DocumentPerson
	education: ChronologyItem[]
	employment: ChronologyItem[]
	qualifications: QualificationItem[]
	selfPromotion: string[]
}

export type WorkHistoryViewModel = {
	person: Pick<DocumentPerson, 'name' | 'email' | 'phone' | 'website'>
	professionalSummary?: string
	employment: Array<ChronologyItem & { summary: string }>
	projects: ProjectItem[]
	skills: DocumentIdentity['profile']['skills']
	selfPromotion: string[]
}

function parseLocalDate(value: string): Date {
	const [year, month, day] = value.split('-').map(Number)
	return new Date(year, month - 1, day)
}

export function getDocumentReferenceDate(updatedAt: string): Date {
	return parseLocalDate(updatedAt)
}

export function formatDocumentDate(date: Date): string {
	return date.toLocaleDateString('ja-JP')
}

function calculateAge(birthDate: string, referenceDate: Date): number {
	const birth = parseLocalDate(birthDate)
	let age = referenceDate.getFullYear() - birth.getFullYear()
	if (
		referenceDate.getMonth() < birth.getMonth() ||
		(referenceDate.getMonth() === birth.getMonth() &&
			referenceDate.getDate() < birth.getDate())
	) {
		age -= 1
	}
	return age
}

function formatYearMonth(value: string): string {
	const [year, month] = value.split('-')
	return `${year}年${month}月`
}

export function formatPeriod(period: DocumentExperience['period']): string {
	const end = period.to === 'present' ? '現在' : formatYearMonth(period.to)
	return `${formatYearMonth(period.from)} – ${end}`
}

function newestFirst(a: DocumentExperience, b: DocumentExperience): number {
	return b.period.from.localeCompare(a.period.from)
}

function chronologyDescription(experience: DocumentExperience): string {
	const organization = experience.organization
	const title = experience.content.title
	if (
		!organization ||
		organization === title ||
		title.startsWith(`${organization} `)
	)
		return title
	return `${organization}　${title}`
}

function toProject(experience: DocumentExperience): ProjectItem {
	return {
		id: experience.id,
		period: formatPeriod(experience.period),
		title: experience.content.title,
		organization: experience.organization,
		summary: experience.content.summary,
		responsibilities: experience.content.responsibilities,
		achievements: experience.content.achievements,
		technologies: experience.content.techStack,
		deliverables: experience.content.deliverables,
	}
}

function toPerson(
	identity: DocumentIdentity,
	referenceDate: Date,
): DocumentPerson {
	const person = identity.profile.person
	return {
		name: person.name,
		nameKana: person.nameKana,
		gender: person.gender,
		birthDate: person.birthDate,
		age: calculateAge(person.birthDate, referenceDate),
		location: person.location,
		email: person.email,
		phone: person.phone,
		website: person.website,
	}
}

export function createSkillsheetViewModel(
	identity: DocumentIdentity,
	referenceDate = new Date(),
): SkillsheetViewModel {
	return {
		person: toPerson(identity, referenceDate),
		professionalSummary: identity.profile.documents.professionalSummary,
		skills: identity.profile.skills,
		projects: identity.experiences
			.filter((experience) => experience.kind === 'project')
			.sort(newestFirst)
			.map(toProject),
	}
}

export function createResumeViewModel(
	identity: DocumentIdentity,
	referenceDate = new Date(),
): ResumeViewModel {
	const toChronology = (experience: DocumentExperience): ChronologyItem => ({
		id: experience.id,
		period: formatPeriod(experience.period),
		description: chronologyDescription(experience),
		note: experience.content.summary,
	})

	const experienceQualifications = identity.experiences
		.filter((experience) => experience.kind === 'certification')
		.map((experience) => ({
			id: experience.id,
			date: formatYearMonth(experience.period.from),
			name: chronologyDescription(experience),
		}))
	const profileQualifications = identity.profile.documents.qualifications.map(
		(qualification, index) => ({
			id: `profile-qualification-${index}`,
			date: qualification.date ? formatYearMonth(qualification.date) : '',
			name: qualification.name,
		}),
	)

	return {
		person: toPerson(identity, referenceDate),
		education: identity.experiences
			.filter((experience) => experience.kind === 'education')
			.map(toChronology),
		employment: identity.experiences
			.filter((experience) => experience.kind === 'employment')
			.map(toChronology),
		qualifications: [
			...experienceQualifications,
			...profileQualifications,
		].sort((a, b) => a.date.localeCompare(b.date)),
		selfPromotion: identity.profile.documents.selfPromotion,
	}
}

export function createWorkHistoryViewModel(
	identity: DocumentIdentity,
	referenceDate = new Date(),
): WorkHistoryViewModel {
	const person = toPerson(identity, referenceDate)
	return {
		person: {
			name: person.name,
			email: person.email,
			phone: person.phone,
			website: person.website,
		},
		professionalSummary: identity.profile.documents.professionalSummary,
		employment: identity.experiences
			.filter((experience) => experience.kind === 'employment')
			.sort(newestFirst)
			.map((experience) => ({
				id: experience.id,
				period: formatPeriod(experience.period),
				description: chronologyDescription(experience),
				summary: experience.content.summary,
			})),
		projects: identity.experiences
			.filter((experience) => experience.kind === 'project')
			.sort(newestFirst)
			.map(toProject),
		skills: identity.profile.skills,
		selfPromotion: identity.profile.documents.selfPromotion,
	}
}
