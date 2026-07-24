import { z } from 'astro/zod'

function isLeapYear(year: number) {
	return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

function isValidIsoDate(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
	if (!match) return false

	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])
	const daysByMonth = [
		31,
		isLeapYear(year) ? 29 : 28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31,
	]

	return month >= 1 && month <= 12 && day >= 1 && day <= daysByMonth[month - 1]
}

const isoDateSchema = z
	.string()
	.refine(isValidIsoDate, '実在する日付をYYYY-MM-DD形式で入力してください')

const yearMonthSchema = z
	.string()
	.refine(
		(value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value),
		'実在する年月をYYYY-MM形式で入力してください',
	)

const socialIconSchema = z.enum(['twitter', 'github', 'instagram', 'gmail'])

export const skillGroupSchema = z
	.object({
		id: z.string().min(1),
		label: z.string().min(1),
		values: z.array(z.string().min(1)).min(1),
	})
	.strict()

export const profileSchema = z
	.object({
		updatedAt: isoDateSchema,
		site: z
			.object({
				brand: z.string().min(1),
				title: z.string().min(1),
				description: z.string().min(1),
				url: z.url(),
			})
			.strict(),
		person: z
			.object({
				name: z.string().min(1),
				nameKana: z.string().min(1),
				handle: z.string().min(1),
				gender: z.string().min(1).optional(),
				birthDate: isoDateSchema,
				location: z.string().min(1),
				email: z.email(),
				phone: z.string().min(1).optional(),
				website: z.url(),
				documentOverride: z
					.object({
						name: z.string().min(1).optional(),
						nameKana: z.string().min(1).optional(),
						gender: z.string().min(1).optional(),
						location: z.string().min(1).optional(),
						email: z.email().optional(),
						phone: z.string().min(1).optional(),
					})
					.strict()
					.optional(),
			})
			.strict(),
		socialLinks: z.array(
			z
				.object({
					name: z.string().min(1),
					href: z.url(),
					iconId: socialIconSchema,
				})
				.strict(),
		),
		externalProfiles: z
			.object({
				qiitaUsername: z.string().min(1).optional(),
				zennUsername: z.string().min(1).optional(),
			})
			.strict(),
		skills: z.array(skillGroupSchema),
		documents: z
			.object({
				professionalSummary: z.string().min(1).optional(),
				selfPromotion: z.array(z.string().min(1)).default([]),
				qualifications: z
					.array(
						z
							.object({
								date: yearMonthSchema.optional(),
								name: z.string().min(1),
							})
							.strict(),
					)
					.default([]),
			})
			.strict(),
	})
	.strict()
	.superRefine((profile, context) => {
		const siteUrl = new URL(profile.site.url)
		if (siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
			context.addIssue({
				code: 'custom',
				message: 'サイトURLにはoriginだけを指定してください',
				path: ['site', 'url'],
			})
		}
		if (profile.person.birthDate > profile.updatedAt) {
			context.addIssue({
				code: 'custom',
				message: '生年月日は更新日以前である必要があります',
				path: ['person', 'birthDate'],
			})
		}
	})

export const periodSchema = z
	.object({
		from: yearMonthSchema,
		to: z.union([yearMonthSchema, z.literal('present')]),
	})
	.strict()
	.superRefine((period, context) => {
		if (period.to !== 'present' && period.to < period.from) {
			context.addIssue({
				code: 'custom',
				message: '終了年月は開始年月以降である必要があります',
				path: ['to'],
			})
		}
	})

export const technologySchema = z
	.object({
		name: z.string().min(1),
		description: z.string().min(1).optional(),
	})
	.strict()

export const deliverableSchema = z
	.object({
		label: z.string().min(1),
		url: z.url(),
	})
	.strict()

export const experienceContentSchema = z
	.object({
		title: z.string().min(1),
		summary: z.string().min(1),
		responsibilities: z.array(z.string().min(1)).default([]),
		techStack: z.array(technologySchema).default([]),
		achievements: z.array(z.string().min(1)).default([]),
		deliverables: z.array(deliverableSchema).default([]),
	})
	.strict()

export const experienceSchema = z
	.object({
		id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		kind: z.enum(['education', 'employment', 'project', 'certification']),
		exposure: z.enum(['public', 'documents-only']),
		period: periodSchema,
		organization: z.string().min(1).optional(),
		content: experienceContentSchema,
	})
	.strict()

export type IdentityProfile = z.infer<typeof profileSchema>
export type IdentityProfileInput = z.input<typeof profileSchema>
export type IdentityPerson = IdentityProfile['person']
export type SkillGroup = z.infer<typeof skillGroupSchema>
export type Experience = z.infer<typeof experienceSchema>
export type ExperienceInput = z.input<typeof experienceSchema>
export type ExperienceContent = z.infer<typeof experienceContentSchema>
export type ExperienceKind = Experience['kind']
export type ResolvedExperience = Experience

export function defineProfile(profile: IdentityProfileInput): IdentityProfile {
	return profileSchema.parse(profile)
}

export function defineExperience(experience: ExperienceInput): Experience {
	return experienceSchema.parse(experience)
}
