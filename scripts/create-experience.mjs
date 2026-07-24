import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const allowedKinds = new Set([
	'education',
	'employment',
	'project',
	'certification',
])
const allowedExposures = new Set(['public', 'documents-only'])
const options = {
	id: '',
	kind: 'project',
	exposure: 'documents-only',
}

for (const arg of process.argv.slice(2)) {
	if (arg === '--') continue
	const [key, value] = arg.split('=')
	if (key === '--id') options.id = value ?? ''
	else if (key === '--kind') options.kind = value ?? ''
	else if (key === '--exposure') options.exposure = value ?? ''
	else throw new Error(`不明なオプションです: ${arg}`)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.id)) {
	throw new Error('--idには小文字英数字とハイフンだけを指定してください')
}
if (!allowedKinds.has(options.kind)) {
	throw new Error(`--kindが不正です: ${options.kind}`)
}
if (!allowedExposures.has(options.exposure)) {
	throw new Error(`--exposureが不正です: ${options.exposure}`)
}

const now = new Date()
const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const experiencesDir = resolve('identity/experiences')
const outputPath = resolve(experiencesDir, `${options.id}.ts`)
const source = `import { defineExperience } from '../../src/identity/schema'

export default defineExperience({
\tid: '${options.id}',
\tkind: '${options.kind}',
\texposure: '${options.exposure}',
\tperiod: { from: '${yearMonth}', to: 'present' },
\tcontent: {
\t\ttitle: 'TODO: タイトル',
\t\tsummary: 'TODO: 概要',
\t\tresponsibilities: [],
\t\ttechStack: [],
\t\tachievements: [],
\t\tdeliverables: [],
\t},
})
`

await mkdir(experiencesDir, { recursive: true })
await writeFile(outputPath, source, { encoding: 'utf8', flag: 'wx' })
console.log(`経歴ファイルを作成しました: ${outputPath}`)
console.log(`公開範囲: ${options.exposure}`)
console.log('編集後にpnpm identity:checkを実行してください。')
