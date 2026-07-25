import {
	type Experience,
	experienceSchema,
	type IdentityProfile,
	profileSchema,
	type ResolvedExperience,
} from './schema'

type DataModule = { default: unknown }

const localProfiles = import.meta.glob<DataModule>('/identity/profile.ts', {
	eager: true,
})
const localExperiences = import.meta.glob<DataModule>(
	'/identity/experiences/*.ts',
	{ eager: true },
)
const exampleProfiles = import.meta.glob<DataModule>(
	'/identity.example/profile.ts',
	{ eager: true },
)
const exampleExperiences = import.meta.glob<DataModule>(
	'/identity.example/experiences/*.ts',
	{ eager: true },
)

export type IdentityData = {
	profile: IdentityProfile
	experiences: Experience[]
}

type ResolvedPerson = Omit<IdentityProfile['person'], 'documentOverride'>
type PublicPerson = Omit<ResolvedPerson, 'phone'>

export type PublicIdentity = {
	profile: Omit<IdentityProfile, 'person' | 'documents'> & {
		person: PublicPerson
	}
	experiences: ResolvedExperience[]
}

export type DocumentIdentity = {
	profile: Omit<IdentityProfile, 'person'> & {
		person: ResolvedPerson
	}
	experiences: ResolvedExperience[]
}

function getSourceModules() {
	if (import.meta.env.IDENTITY_SOURCE === 'example') {
		return {
			profiles: exampleProfiles,
			experiences: exampleExperiences,
			sourceName: 'identity.example',
		}
	}

	return {
		profiles: localProfiles,
		experiences: localExperiences,
		sourceName: 'identity',
	}
}

function loadIdentity(): IdentityData {
	const { profiles, experiences, sourceName } = getSourceModules()
	const profileModules = Object.entries(profiles)

	if (profileModules.length !== 1) {
		throw new Error(
			`${sourceName}/profile.ts が必要です。identity.example を参考に未追跡のIdentity SSoTを用意してください。`,
		)
	}

	const [profilePath, profileModule] = profileModules[0]
	const profileResult = profileSchema.safeParse(profileModule.default)
	if (!profileResult.success) {
		throw new Error(
			`${profilePath}: Profileの検証に失敗しました\n${profileResult.error.message}`,
		)
	}
	const profile = profileResult.data
	const entries = Object.entries(experiences).map(([path, module]) => {
		const result = experienceSchema.safeParse(module.default)
		if (!result.success) {
			throw new Error(
				`${path}: Experienceの検証に失敗しました\n${result.error.message}`,
			)
		}
		return { path, experience: result.data }
	})
	const ids = new Set<string>()

	for (const { path, experience } of entries) {
		if (ids.has(experience.id)) {
			throw new Error(`経歴IDが重複しています: ${experience.id} (${path})`)
		}
		ids.add(experience.id)
	}

	return {
		profile,
		experiences: entries
			.map(({ experience }) => experience)
			.sort((a, b) => a.period.from.localeCompare(b.period.from)),
	}
}

const identity = loadIdentity()

function resolvePerson(useDocumentOverride: boolean): ResolvedPerson {
	const { documentOverride, ...person } = identity.profile.person
	return useDocumentOverride && documentOverride
		? { ...person, ...documentOverride }
		: person
}

function resolvePublicProfile(): PublicIdentity['profile'] {
	const {
		documents: _documents,
		person: _person,
		...profile
	} = identity.profile
	const { phone: _phone, ...person } = resolvePerson(false)
	return { ...profile, person }
}

function resolveDocumentProfile(): DocumentIdentity['profile'] {
	return { ...identity.profile, person: resolvePerson(true) }
}

function resolveCanonicalExperience(
	experience: Experience,
): ResolvedExperience {
	const { publicProjection: _publicProjection, ...canonical } = experience
	return canonical
}

function resolvePublicExperience(experience: Experience): ResolvedExperience {
	const canonical = resolveCanonicalExperience(experience)
	if (!experience.publicProjection) return canonical

	return {
		...canonical,
		organization: experience.publicProjection.organization,
		content: experience.publicProjection.content,
	}
}

export function getPublicIdentity(): PublicIdentity {
	return {
		profile: resolvePublicProfile(),
		experiences: identity.experiences
			.filter((experience) => experience.exposure === 'public')
			.map(resolvePublicExperience),
	}
}

export function getDocumentIdentity(): DocumentIdentity {
	return {
		profile: resolveDocumentProfile(),
		experiences: identity.experiences.map(resolveCanonicalExperience),
	}
}
