import { defineExperience } from '../../src/identity/schema'

export default defineExperience({
	id: 'documents-only-project',
	kind: 'project',
	exposure: 'documents-only',
	period: { from: '2024-01', to: '2024-06' },
	content: {
		title: 'PRIVATE_CANARY_DOCUMENTS_ONLY_PROJECT',
		summary: '公開成果物へ混入してはいけない検査用の経歴です。',
		responsibilities: ['PRIVATE_CANARY_DOCUMENTS_ONLY_RESPONSIBILITY'],
	},
})
