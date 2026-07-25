import { defineExperience } from '../../src/identity/schema'

export default defineExperience({
	id: 'masked-employment',
	kind: 'employment',
	exposure: 'public',
	period: { from: '2024-07', to: '2024-12' },
	organization: '秘匿社',
	content: {
		title: 'PRIVATE_CANARY_MASKED_TITLE',
		summary: 'PRIVATE_CANARY_MASKED_SUMMARY',
		responsibilities: ['PRIVATE_CANARY_MASKED_RESPONSIBILITY'],
	},
	publicProjection: {
		organization: '非公開企業',
		content: {
			title: '社名非公開',
			summary: '公開用に匿名化した経歴です。',
		},
	},
})
