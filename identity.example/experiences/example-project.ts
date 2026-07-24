import { defineExperience } from '../../src/identity/schema'

export default defineExperience({
	id: 'example-project',
	kind: 'project',
	exposure: 'documents-only',
	period: { from: '2025-01', to: 'present' },
	content: {
		title: 'サンプルプロジェクト',
		summary: '採用文書だけで使用するサンプルプロジェクトです。',
		responsibilities: ['設計', '実装'],
		techStack: [{ name: 'TypeScript', description: '型安全な実装' }],
		achievements: ['TypeScriptのSSoTから3種類の文書を生成'],
		deliverables: [
			{
				label: 'PRIVATE_CANARY_EXAMPLE_DELIVERABLE',
				url: 'https://example.com',
			},
		],
	},
})
