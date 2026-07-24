import { spawn } from 'node:child_process'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, relative, resolve } from 'node:path'
import { chromium } from 'playwright'

const documentDefinitions = [
	{ slug: 'skillsheet', filename: 'skillsheet.pdf' },
	{ slug: 'resume', filename: 'resume.pdf' },
	{ slug: 'work-history', filename: 'work-history.pdf' },
]

const args = new Map()
for (const arg of process.argv.slice(2)) {
	if (arg === '--') continue
	const [key, value] = arg.split('=')
	if (!['--only', '--output-dir', '--skip-build'].includes(key)) {
		throw new Error(`不明なオプションです: ${arg}`)
	}
	if (args.has(key)) throw new Error(`オプションが重複しています: ${key}`)
	if (key === '--skip-build') {
		if (value !== undefined) {
			throw new Error('--skip-buildには値を指定できません')
		}
		args.set(key, true)
		continue
	}
	if (!value) throw new Error(`${key}には値が必要です`)
	args.set(key, value)
}

const selectedSlug = args.get('--only')
const selectedDocuments = selectedSlug
	? documentDefinitions.filter(({ slug }) => slug === selectedSlug)
	: documentDefinitions

if (selectedDocuments.length === 0) {
	throw new Error(
		`不明な文書です: ${selectedSlug}。skillsheet, resume, work-historyから選んでください。`,
	)
}

const distDir = resolve('.documents-dist')
const outputDir = resolve(args.get('--output-dir') ?? 'documents/output')
const skipBuild = args.has('--skip-build')

const mimeTypes = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
}

async function run(command, commandArgs, environment = {}) {
	await new Promise((resolveRun, rejectRun) => {
		const child = spawn(command, commandArgs, {
			stdio: 'inherit',
			env: { ...process.env, ...environment },
		})
		child.on('exit', (code) => {
			if (code === 0) resolveRun()
			else rejectRun(new Error(`${command} がコード ${code} で終了しました`))
		})
		child.on('error', rejectRun)
	})
}

async function ensureBuild() {
	if (skipBuild) {
		if (!existsSync(distDir)) {
			throw new Error(
				'.documents-dist がありません。--skip-buildを外して実行してください。',
			)
		}
		return
	}

	await run('pnpm', ['documents:build'])
}

function resolveRequestPath(rootDir, pathname) {
	const decoded = decodeURIComponent(pathname)
	const normalizedPath = normalize(decoded).replace(/^[/\\]+/, '')
	let filePath = resolve(rootDir, normalizedPath)

	if (relative(rootDir, filePath).startsWith('..')) return null

	try {
		if (statSync(filePath).isDirectory())
			filePath = join(filePath, 'index.html')
	} catch {
		if (!extname(filePath)) filePath = join(filePath, 'index.html')
	}

	return filePath
}

function startStaticServer(rootDir) {
	return new Promise((resolveServer, rejectServer) => {
		const server = createServer((request, response) => {
			const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
			const filePath = resolveRequestPath(rootDir, requestUrl.pathname)

			if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
				response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
				response.end('Not Found')
				return
			}

			const contentType =
				mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
			response.writeHead(200, { 'Content-Type': contentType })
			createReadStream(filePath).pipe(response)
		})

		server.listen(0, '127.0.0.1', () => {
			const address = server.address()
			if (address && typeof address === 'object') {
				resolveServer({ server, port: address.port })
				return
			}
			rejectServer(new Error('文書サーバーのポート取得に失敗しました'))
		})
		server.on('error', rejectServer)
	})
}

async function generatePdfs(baseUrl) {
	await mkdir(outputDir, { recursive: true })
	const bundledExecutable = chromium.executablePath()
	const systemExecutables = [
		process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
		'/usr/bin/google-chrome',
		'/usr/bin/google-chrome-stable',
		'/usr/bin/chromium',
	].filter(Boolean)
	const fallbackExecutable = systemExecutables.find((path) => existsSync(path))
	const browser = await chromium.launch(
		existsSync(bundledExecutable)
			? {}
			: fallbackExecutable
				? { executablePath: fallbackExecutable }
				: {},
	)

	try {
		for (const document of selectedDocuments) {
			const page = await browser.newPage()
			try {
				const response = await page.goto(
					`${baseUrl}/documents/${document.slug}/`,
					{ waitUntil: 'networkidle' },
				)
				if (!response?.ok()) {
					throw new Error(
						`${document.slug} のプレビュー取得に失敗しました (${response?.status() ?? 'no response'})`,
					)
				}
				await page.evaluate(async () => document.fonts?.ready)
				await page.emulateMedia({ media: 'print' })
				const outputPath = join(outputDir, document.filename)
				await page.pdf({
					path: outputPath,
					printBackground: true,
					preferCSSPageSize: true,
					displayHeaderFooter: false,
					tagged: true,
					outline: true,
				})
				console.log(`PDFを生成しました: ${outputPath}`)
			} finally {
				await page.close()
			}
		}
	} finally {
		await browser.close()
	}
}

async function main() {
	await ensureBuild()
	const { server, port } = await startStaticServer(distDir)
	try {
		await generatePdfs(`http://127.0.0.1:${port}`)
	} finally {
		await new Promise((resolveClose, rejectClose) =>
			server.close((error) => (error ? rejectClose(error) : resolveClose())),
		)
	}
}

main().catch((error) => {
	console.error(error)
	if (error?.message?.includes("Executable doesn't exist")) {
		console.error(
			'Playwrightのブラウザがありません。`pnpm exec playwright install chromium`を実行してください。',
		)
	}
	process.exitCode = 1
})
