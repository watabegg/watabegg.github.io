import { spawn } from 'node:child_process'
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'

const DEPLOY_BRANCH = 'gh-pages'
const DEFAULT_EXPECTED_REPOSITORY = 'github.com/watabegg/watabegg-hp'

function parseArgs(argv) {
	const options = {
		remote: process.env.PAGES_REMOTE ?? 'watabegg-hp',
		expectedRepository:
			process.env.PAGES_EXPECTED_REPOSITORY ?? DEFAULT_EXPECTED_REPOSITORY,
		dryRun: false,
	}

	for (const arg of argv) {
		if (arg === '--') continue
		if (arg.startsWith('--remote=')) {
			options.remote = arg.slice('--remote='.length)
			continue
		}
		if (arg.startsWith('--expected-repository=')) {
			options.expectedRepository = arg.slice('--expected-repository='.length)
			continue
		}
		if (arg === '--dry-run') {
			options.dryRun = true
			continue
		}
		throw new Error(`不明なオプションです: ${arg}`)
	}

	if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(options.remote)) {
		throw new Error(`不正なremote名です: ${options.remote}`)
	}
	if (!/^[A-Za-z0-9.-]+\/[A-Za-z0-9._/-]+$/.test(options.expectedRepository)) {
		throw new Error(
			`不正なexpected repositoryです: ${options.expectedRepository}`,
		)
	}

	return options
}

function run(command, args, options = {}) {
	return new Promise((resolveRun, rejectRun) => {
		const child = spawn(command, args, {
			cwd: options.cwd,
			env: options.environment
				? { ...process.env, ...options.environment }
				: process.env,
			stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
		})
		let stdout = ''
		let stderr = ''

		if (options.capture) {
			child.stdout.setEncoding('utf8')
			child.stderr.setEncoding('utf8')
			child.stdout.on('data', (chunk) => {
				stdout += chunk
			})
			child.stderr.on('data', (chunk) => {
				stderr += chunk
			})
		}

		child.on('error', rejectRun)
		child.on('close', (code, signal) => {
			if (code === 0) {
				resolveRun({ stdout, stderr })
				return
			}
			const detail = signal ? `signal ${signal}` : `exit code ${code}`
			const captured = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n')
			rejectRun(
				new Error(
					`${command} ${args.join(' ')} が失敗しました (${detail})` +
						(captured ? `\n${captured}` : ''),
				),
			)
		})
	})
}

async function copyDirectoryContents(sourceDir, destinationDir) {
	const entries = await readdir(sourceDir, { withFileTypes: true })
	for (const entry of entries) {
		await cp(join(sourceDir, entry.name), join(destinationDir, entry.name), {
			recursive: true,
			force: false,
			errorOnExist: true,
			preserveTimestamps: true,
		})
	}
}

function sanitizedRemoteUrl(remoteUrl) {
	return remoteUrl.replace(/^(https?:\/\/)[^/@]+@/, '$1***@')
}

function assertNoEmbeddedCredentials(remoteUrl) {
	if (!/^https?:\/\//i.test(remoteUrl)) return
	const parsed = new URL(remoteUrl)
	if (parsed.username || parsed.password) {
		throw new Error(
			'remote URLへ認証情報を埋め込まないでください。Git credential helperまたはSSHを使用してください',
		)
	}
}

function normalizeRepositoryId(remoteUrl) {
	if (/^[^/@\s]+@[^:/\s]+:[^\s]+$/.test(remoteUrl)) {
		const separator = remoteUrl.indexOf(':')
		const host = remoteUrl.slice(0, separator).split('@').at(-1)?.toLowerCase()
		const path = remoteUrl.slice(separator + 1).replace(/^\/+|\/+$/g, '')
		return host && path ? `${host}/${path.replace(/\.git$/i, '')}` : null
	}

	try {
		const parsed = new URL(remoteUrl)
		if (!['http:', 'https:', 'ssh:'].includes(parsed.protocol)) return null
		const path = parsed.pathname
			.replace(/^\/+|\/+$/g, '')
			.replace(/\.git$/i, '')
		return parsed.hostname && path
			? `${parsed.hostname.toLowerCase()}/${path}`
			: null
	} catch {
		return null
	}
}

function assertExpectedRepository(remoteUrl, expectedRepository) {
	const actualRepository = normalizeRepositoryId(remoteUrl)
	if (actualRepository === expectedRepository.toLowerCase()) return

	throw new Error(
		`deploy先が想定と一致しません（expected: ${expectedRepository}, actual: ${actualRepository ?? '検証不能'}）。` +
			'意図的に変更する場合だけ--expected-repositoryを指定してください',
	)
}

async function deploy(options) {
	const { stdout: rootOutput } = await run(
		'git',
		['rev-parse', '--show-toplevel'],
		{ capture: true },
	)
	const repositoryRoot = resolve(rootOutput.trim())
	const distDir = resolve(repositoryRoot, 'dist')
	const distRelativePath = relative(repositoryRoot, distDir)

	if (
		!distRelativePath ||
		distRelativePath.startsWith('..') ||
		resolve(repositoryRoot, distRelativePath) !== distDir
	) {
		throw new Error(
			'公開成果物はリポジトリ配下の明示的なディレクトリにしてください',
		)
	}

	await run('pnpm', ['build:public'], {
		cwd: repositoryRoot,
		environment: {
			IDENTITY_SOURCE: 'local',
			PUBLIC_DIST_DIR: 'dist',
		},
	})

	await run(
		process.execPath,
		[
			join(repositoryRoot, 'scripts/verify-public-dist.mjs'),
			`--dist=${distDir}`,
			`--identity-dir=${join(repositoryRoot, 'identity')}`,
		],
		{ cwd: repositoryRoot },
	)

	const { stdout: remoteUrlOutput } = await run(
		'git',
		['remote', 'get-url', '--push', options.remote],
		{ cwd: repositoryRoot, capture: true },
	)
	const remoteUrl = remoteUrlOutput.trim()
	if (!remoteUrl)
		throw new Error(`remote ${options.remote} にpush URLがありません`)
	assertNoEmbeddedCredentials(remoteUrl)
	assertExpectedRepository(remoteUrl, options.expectedRepository)

	const { stdout: remoteReferenceOutput } = await run(
		'git',
		['ls-remote', remoteUrl, `refs/heads/${DEPLOY_BRANCH}`],
		{ cwd: repositoryRoot, capture: true },
	)
	const remoteReferences = remoteReferenceOutput
		.trim()
		.split('\n')
		.filter(Boolean)
	if (remoteReferences.length > 1) {
		throw new Error(`remoteの${DEPLOY_BRANCH}参照を一意に解決できません`)
	}
	const remoteSha = remoteReferences[0]?.split(/\s+/)[0] ?? ''
	if (remoteSha && !/^[0-9a-f]{40,64}$/i.test(remoteSha)) {
		throw new Error(`remoteの${DEPLOY_BRANCH} SHAを検証できません`)
	}

	const { stdout: sourceShaOutput } = await run(
		'git',
		['rev-parse', '--short=12', 'HEAD'],
		{ cwd: repositoryRoot, capture: true },
	)
	const { stdout: statusOutput } = await run('git', ['status', '--porcelain'], {
		cwd: repositoryRoot,
		capture: true,
	})
	const sourceVersion = `${sourceShaOutput.trim()}${statusOutput.trim() ? '+dirty' : ''}`
	const temporaryDirectory = await mkdtemp(join(tmpdir(), 'watabegg-pages-'))

	console.log(
		`Pages対象: ${sanitizedRemoteUrl(remoteUrl)} refs/heads/${DEPLOY_BRANCH}`,
	)
	console.log(`公開元: ${distRelativePath} (${sourceVersion})`)

	try {
		await copyDirectoryContents(distDir, temporaryDirectory)
		await run(
			process.execPath,
			[
				join(repositoryRoot, 'scripts/verify-public-dist.mjs'),
				`--dist=${temporaryDirectory}`,
				`--identity-dir=${join(repositoryRoot, 'identity')}`,
			],
			{ cwd: repositoryRoot },
		)

		await run(
			'git',
			['init', `--initial-branch=${DEPLOY_BRANCH}`, temporaryDirectory],
			{ cwd: repositoryRoot, capture: true },
		)
		await run('git', ['config', 'user.name', 'watabegg Pages Deploy'], {
			cwd: temporaryDirectory,
			capture: true,
		})
		await run(
			'git',
			['config', 'user.email', 'watabegg-pages@users.noreply.github.com'],
			{ cwd: temporaryDirectory, capture: true },
		)
		await run('git', ['remote', 'add', 'pages', remoteUrl], {
			cwd: temporaryDirectory,
			capture: true,
		})
		await run('git', ['add', '--all'], {
			cwd: temporaryDirectory,
			capture: true,
		})
		await run('git', ['commit', '--message', `deploy: ${sourceVersion}`], {
			cwd: temporaryDirectory,
			capture: true,
		})

		const { stdout: deploymentShaOutput } = await run(
			'git',
			['rev-parse', 'HEAD'],
			{ cwd: temporaryDirectory, capture: true },
		)
		const deploymentSha = deploymentShaOutput.trim()

		if (options.dryRun) {
			console.log(
				`dry-run: snapshot ${deploymentSha} を作成しました（pushなし）`,
			)
			return
		}

		await run(
			'git',
			[
				'push',
				'--porcelain',
				`--force-with-lease=refs/heads/${DEPLOY_BRANCH}:${remoteSha}`,
				'pages',
				`HEAD:refs/heads/${DEPLOY_BRANCH}`,
			],
			{ cwd: temporaryDirectory },
		)
		console.log(`GitHub Pagesへsnapshot ${deploymentSha} をpushしました`)
	} finally {
		await rm(temporaryDirectory, { recursive: true, force: true })
	}
}

try {
	const options = parseArgs(process.argv.slice(2))
	await deploy(options)
} catch (error) {
	console.error(error instanceof Error ? error.message : error)
	process.exitCode = 1
}
