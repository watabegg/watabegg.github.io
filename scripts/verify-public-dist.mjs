import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { basename, extname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const DEFAULT_DIST_DIR = 'dist'
const DEFAULT_CNAME = 'watabe.gg'
const DEFAULT_PUBLIC_CONTENT_DIR = 'src/content/products'
const TEXT_EXTENSIONS = new Set([
	'.css',
	'.htm',
	'.html',
	'.js',
	'.json',
	'.mjs',
	'.svg',
	'.txt',
	'.webmanifest',
	'.xml',
])
const ROOT_DOCUMENT_ROUTE_PATTERN =
	/(?:^|["'(<\s=])\/(?:skillsheet|resume|work-history|work_history|documents)(?:[/#?"'.<\s]|$)/i
const DOCUMENT_PATH_PATTERN =
	/^\/(?:skillsheet|resume|work-history|work_history|documents)(?:\/|$)/i
const IDENTITY_PATH_PATTERN =
	/(?:file:\/\/)?(?:[a-z]:)?\/[^"'<>\s]*identity(?:\.example|\.local)?\/[^"'<>\s]+/i
const PRIVATE_KEY_PATTERN = /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/
const TOKEN_PATTERNS = [
	/\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
	/\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
	/\bsk-[A-Za-z0-9_-]{20,}\b/,
]
const FORBIDDEN_SOURCE_EXTENSIONS = new Set([
	'.astro',
	'.cts',
	'.jsx',
	'.mts',
	'.ts',
	'.tsx',
])
const FORBIDDEN_SECRET_EXTENSIONS = new Set(['.key', '.p12', '.pem', '.pfx'])
const FORBIDDEN_PUBLIC_ASSETS = new Set(['images/product/private-project.png'])

function parseArgs(argv) {
	const options = {
		distDir: process.env.PUBLIC_DIST_DIR ?? DEFAULT_DIST_DIR,
		expectedCname: process.env.PAGES_CNAME ?? DEFAULT_CNAME,
		identityDir:
			process.env.IDENTITY_SOURCE === 'example'
				? 'identity.example'
				: 'identity',
		publicContentDir:
			process.env.PUBLIC_CONTENT_DIR ?? DEFAULT_PUBLIC_CONTENT_DIR,
	}

	for (const arg of argv) {
		if (arg.startsWith('--dist=')) {
			options.distDir = arg.slice('--dist='.length)
			continue
		}
		if (arg.startsWith('--expected-cname=')) {
			options.expectedCname = arg.slice('--expected-cname='.length)
			continue
		}
		if (arg.startsWith('--identity-dir=')) {
			options.identityDir = arg.slice('--identity-dir='.length)
			continue
		}
		if (arg.startsWith('--public-content-dir=')) {
			options.publicContentDir = arg.slice('--public-content-dir='.length)
			continue
		}
		throw new Error(`不明なオプションです: ${arg}`)
	}

	if (!options.expectedCname.trim()) {
		throw new Error('expected CNAME は空にできません')
	}

	return options
}

function toPosixPath(path) {
	return path.replaceAll('\\', '/')
}

async function walkFiles(rootDir) {
	const files = []
	const errors = []

	async function walk(currentDir) {
		const entries = await readdir(currentDir, { withFileTypes: true })
		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name)
			const relativePath = toPosixPath(relative(rootDir, fullPath))
			const stats = await lstat(fullPath)

			if (stats.isSymbolicLink()) {
				errors.push(`${relativePath}: symlinkは公開できません`)
				continue
			}
			if (stats.isDirectory()) {
				await walk(fullPath)
				continue
			}
			if (stats.isFile()) {
				files.push({ fullPath, relativePath, stats })
				continue
			}

			errors.push(`${relativePath}: 通常ファイル以外は公開できません`)
		}
	}

	const rootStats = await lstat(rootDir)
	if (rootStats.isSymbolicLink()) {
		throw new Error(`${rootDir}: dist自体をsymlinkにはできません`)
	}
	if (!rootStats.isDirectory()) {
		throw new Error(`${rootDir}: distがディレクトリではありません`)
	}

	await walk(rootDir)
	return { files, errors }
}

function validatePublishedPath(relativePath) {
	const errors = []
	const lowerPath = relativePath.toLowerCase()
	const segments = lowerPath.split('/')
	const fileName = basename(lowerPath)
	const extension = extname(fileName)

	if (FORBIDDEN_PUBLIC_ASSETS.has(lowerPath)) {
		errors.push(`${relativePath}: private-onlyプロジェクトの資産です`)
	}

	if (
		/(?:^|\/)(?:skillsheet|resume|work-history|work_history|documents)(?:[/._-]|$)/i.test(
			lowerPath,
		)
	) {
		errors.push(`${relativePath}: 文書用パスが公開成果物に含まれています`)
	}
	if (extension === '.pdf') {
		errors.push(`${relativePath}: PDFは公開成果物に含められません`)
	}
	if (extension === '.map') {
		errors.push(`${relativePath}: sourcemapは公開成果物に含められません`)
	}
	if (FORBIDDEN_SOURCE_EXTENSIONS.has(extension)) {
		errors.push(`${relativePath}: ソースファイルは公開成果物に含められません`)
	}
	if (FORBIDDEN_SECRET_EXTENSIONS.has(extension)) {
		errors.push(`${relativePath}: 秘密鍵になり得る拡張子です`)
	}
	if (
		segments.some((segment) =>
			[
				'.git',
				'.github',
				'identity',
				'identity.example',
				'identity.local',
			].includes(segment),
		)
	) {
		errors.push(`${relativePath}: VCSまたはIdentityデータのパスです`)
	}
	if (
		segments.some(
			(segment) =>
				segment === '.env' ||
				segment.startsWith('.env.') ||
				/^id_(?:dsa|ecdsa|ed25519|rsa)(?:\.|$)/.test(segment) ||
				/^(?:credentials|secrets?)(?:\.|$)/.test(segment),
		)
	) {
		errors.push(`${relativePath}: 秘密情報になり得るファイル名です`)
	}

	return errors
}

function normalizeEscapedSlashes(text) {
	return text
		.replaceAll('\\/', '/')
		.replace(/\\u002f/gi, '/')
		.replace(/&#x0*2f;|&#0*47;|&sol;/gi, '/')
}

function normalizeWhitespace(text) {
	return text.replace(/\s+/g, ' ').trim()
}

function containsPrivateDocumentRoute(content, expectedHostname) {
	if (ROOT_DOCUMENT_ROUTE_PATTERN.test(content)) return true

	for (const match of content.matchAll(/https?:\/\/[^"'(<>{}\s]+/gi)) {
		try {
			const url = new URL(match[0])
			if (
				url.hostname.toLowerCase() === expectedHostname.toLowerCase() &&
				DOCUMENT_PATH_PATTERN.test(url.pathname)
			) {
				return true
			}
		} catch {
			// Other URL-like text is handled by the remaining output checks.
		}
	}

	return false
}

function escapeHtml(text) {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function propertyNameText(property) {
	if (!property.name) return undefined
	if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
		return property.name.text
	}
	return undefined
}

function callName(expression) {
	if (ts.isIdentifier(expression)) return expression.text
	if (ts.isPropertyAccessExpression(expression)) return expression.name.text
	return undefined
}

function getObjectProperty(object, name) {
	return object.properties.find(
		(property) => propertyNameText(property) === name,
	)
}

function sourceLocation(sourceFile, node, rootDir) {
	const location = sourceFile.getLineAndCharacterOfPosition(
		node.getStart(sourceFile),
	)
	return {
		file: toPosixPath(relative(rootDir, sourceFile.fileName)),
		line: location.line + 1,
	}
}

function assertStaticPrivateValue(node, sourceFile, rootDir, errors) {
	if (
		ts.isStringLiteral(node) ||
		ts.isNoSubstitutionTemplateLiteral(node) ||
		ts.isNumericLiteral(node) ||
		node.kind === ts.SyntaxKind.TrueKeyword ||
		node.kind === ts.SyntaxKind.FalseKeyword ||
		node.kind === ts.SyntaxKind.NullKeyword
	) {
		return
	}
	if (
		ts.isAsExpression(node) ||
		ts.isSatisfiesExpression(node) ||
		ts.isParenthesizedExpression(node)
	) {
		assertStaticPrivateValue(node.expression, sourceFile, rootDir, errors)
		return
	}
	if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
		return
	}
	if (ts.isArrayLiteralExpression(node)) {
		for (const element of node.elements) {
			if (ts.isSpreadElement(element)) {
				const location = sourceLocation(sourceFile, element, rootDir)
				errors.push(
					`${location.file}:${location.line}: privateデータ内のspreadは漏洩検査できません`,
				)
				continue
			}
			assertStaticPrivateValue(element, sourceFile, rootDir, errors)
		}
		return
	}
	if (ts.isObjectLiteralExpression(node)) {
		for (const property of node.properties) {
			if (!ts.isPropertyAssignment(property)) {
				const location = sourceLocation(sourceFile, property, rootDir)
				errors.push(
					`${location.file}:${location.line}: privateデータは静的なproperty assignmentで記述してください`,
				)
				continue
			}
			assertStaticPrivateValue(
				property.initializer,
				sourceFile,
				rootDir,
				errors,
			)
		}
		return
	}

	const location = sourceLocation(sourceFile, node, rootDir)
	errors.push(
		`${location.file}:${location.line}: privateデータは文字列・数値・真偽値・配列・object literalだけで記述してください`,
	)
}

function isPropertyNameLiteral(node) {
	return (
		(ts.isPropertyAssignment(node.parent) ||
			ts.isMethodDeclaration(node.parent) ||
			ts.isPropertySignature(node.parent)) &&
		node.parent.name === node
	)
}

function collectStringLiterals(root, sourceFile, sourceRoot) {
	const values = []

	function visit(node) {
		if (
			(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
			!isPropertyNameLiteral(node)
		) {
			const location = sourceLocation(sourceFile, node, sourceRoot)
			values.push({ value: node.text, ...location })
		}
		ts.forEachChild(node, visit)
	}

	visit(root)
	return values
}

async function walkTypeScriptFiles(rootDir) {
	const files = []

	async function walk(currentDir) {
		const entries = await readdir(currentDir, { withFileTypes: true })
		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name)
			if (entry.isSymbolicLink()) {
				throw new Error(
					`${toPosixPath(relative(rootDir, fullPath))}: Identity sourceのsymlinkは検査できません`,
				)
			}
			if (entry.isDirectory()) {
				await walk(fullPath)
			} else if (entry.isFile() && entry.name.endsWith('.ts')) {
				files.push(fullPath)
			}
		}
	}

	await walk(rootDir)
	return files
}

async function readPublicContent(publicContentDir) {
	const { files, errors } = await walkFiles(publicContentDir)
	if (errors.length > 0) {
		throw new Error(`公開コンテンツを検査できません:\n${errors.join('\n')}`)
	}

	const contents = await Promise.all(
		files
			.filter((file) => ['.md', '.mdx'].includes(extname(file.relativePath)))
			.map((file) => readFile(file.fullPath, 'utf8')),
	)
	return normalizeWhitespace(contents.join('\n'))
}

async function collectPrivateOnlyTokens(identityDir, publicContentDir) {
	const sourcePaths = await walkTypeScriptFiles(identityDir)
	if (sourcePaths.length === 0) {
		throw new Error(`${identityDir}: Identity TypeScriptファイルがありません`)
	}

	const privateValues = []
	const publicValues = new Set()
	const errors = []
	let profileDefinitionCount = 0
	let experienceDefinitionCount = 0
	const publicContent = await readPublicContent(publicContentDir)

	for (const sourcePath of sourcePaths) {
		const sourceText = await readFile(sourcePath, 'utf8')
		const sourceFile = ts.createSourceFile(
			sourcePath,
			sourceText,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		)
		for (const diagnostic of sourceFile.parseDiagnostics ?? []) {
			const location = diagnostic.start
				? sourceFile.getLineAndCharacterOfPosition(diagnostic.start)
				: { line: 0 }
			errors.push(
				`${toPosixPath(relative(identityDir, sourcePath))}:${location.line + 1}: TypeScriptをparseできません`,
			)
		}

		const privateRoots = new Set()

		function inspectDefinitions(node) {
			if (ts.isCallExpression(node)) {
				const name = callName(node.expression)
				if (name === 'defineExperience') {
					experienceDefinitionCount += 1
					const root = node.arguments[0]
					if (!root || !ts.isObjectLiteralExpression(root)) {
						const location = sourceLocation(sourceFile, node, identityDir)
						errors.push(
							`${location.file}:${location.line}: defineExperienceにはobject literalを直接渡してください`,
						)
					} else {
						const exposure = getObjectProperty(root, 'exposure')
						if (
							!exposure ||
							!ts.isPropertyAssignment(exposure) ||
							!ts.isStringLiteralLike(exposure.initializer)
						) {
							const location = sourceLocation(sourceFile, root, identityDir)
							errors.push(
								`${location.file}:${location.line}: exposureは文字列リテラルで指定してください`,
							)
						} else if (exposure.initializer.text === 'documents-only') {
							privateRoots.add(root)
						}
					}
				}
				if (name === 'defineProfile') {
					profileDefinitionCount += 1
					const root = node.arguments[0]
					if (!root || !ts.isObjectLiteralExpression(root)) {
						const location = sourceLocation(sourceFile, node, identityDir)
						errors.push(
							`${location.file}:${location.line}: defineProfileにはobject literalを直接渡してください`,
						)
					} else {
						const person = getObjectProperty(root, 'person')
						if (
							person &&
							ts.isPropertyAssignment(person) &&
							ts.isObjectLiteralExpression(person.initializer)
						) {
							const phone = getObjectProperty(person.initializer, 'phone')
							if (phone && ts.isPropertyAssignment(phone)) {
								privateRoots.add(phone.initializer)
							}
						}
						const documents = getObjectProperty(root, 'documents')
						if (documents) {
							if (
								!ts.isPropertyAssignment(documents) ||
								!ts.isObjectLiteralExpression(documents.initializer)
							) {
								const location = sourceLocation(
									sourceFile,
									documents,
									identityDir,
								)
								errors.push(
									`${location.file}:${location.line}: profile.documentsはobject literalで記述してください`,
								)
							} else {
								privateRoots.add(documents.initializer)
							}
						}
					}
				}
			}

			if (ts.isObjectLiteralExpression(node)) {
				for (const property of node.properties) {
					if (propertyNameText(property) !== 'documentOverride') continue
					if (
						!ts.isPropertyAssignment(property) ||
						!ts.isObjectLiteralExpression(property.initializer)
					) {
						const location = sourceLocation(sourceFile, property, identityDir)
						errors.push(
							`${location.file}:${location.line}: documentOverrideはobject literalで記述してください`,
						)
					} else {
						privateRoots.add(property.initializer)
					}
				}
			}

			ts.forEachChild(node, inspectDefinitions)
		}

		inspectDefinitions(sourceFile)

		for (const root of privateRoots) {
			assertStaticPrivateValue(root, sourceFile, identityDir, errors)
			privateValues.push(
				...collectStringLiterals(root, sourceFile, identityDir),
			)
		}

		function collectPublicValues(node, withinPrivateRoot = false) {
			const isPrivate = withinPrivateRoot || privateRoots.has(node)
			if (
				!isPrivate &&
				(ts.isStringLiteral(node) ||
					ts.isNoSubstitutionTemplateLiteral(node)) &&
				!isPropertyNameLiteral(node)
			) {
				publicValues.add(normalizeWhitespace(node.text))
			}
			ts.forEachChild(node, (child) => collectPublicValues(child, isPrivate))
		}

		collectPublicValues(sourceFile)
	}

	if (profileDefinitionCount !== 1) {
		errors.push(
			`${identityDir}: defineProfileはちょうど1件必要です（検出: ${profileDefinitionCount}件）`,
		)
	}
	if (experienceDefinitionCount === 0) {
		errors.push(`${identityDir}: defineExperienceが1件もありません`)
	}
	if (errors.length > 0) {
		throw new Error(`Identity漏洩検査を準備できません:\n${errors.join('\n')}`)
	}

	const tokens = new Map()
	for (const candidate of privateValues) {
		const value = normalizeWhitespace(candidate.value)
		if (
			value.length < 4 ||
			publicValues.has(value) ||
			publicContent.includes(value)
		) {
			continue
		}
		if (!tokens.has(value)) tokens.set(value, { ...candidate, value })
	}

	return [...tokens.values()]
}

function tokenFingerprint(value) {
	return createHash('sha256').update(value).digest('hex').slice(0, 12)
}

function containsPrivateToken(content, token) {
	const normalizedContent = normalizeWhitespace(content)
	const variants = new Set([
		token,
		escapeHtml(token),
		JSON.stringify(token).slice(1, -1),
		encodeURI(token),
		encodeURIComponent(token),
	])

	for (const variant of variants) {
		if (!variant) continue
		if (content.includes(variant)) return true
		if (normalizedContent.includes(normalizeWhitespace(variant))) return true
	}
	return false
}

async function verifyPublicDist(options) {
	const distDir = resolve(options.distDir)
	const identityDir = resolve(options.identityDir)
	const publicContentDir = resolve(options.publicContentDir)
	const { files, errors } = await walkFiles(distDir)

	if (files.length === 0) errors.push('distが空です')
	if (!files.some((file) => file.relativePath === 'index.html')) {
		errors.push('dist直下にindex.htmlがありません')
	}

	for (const file of files) {
		errors.push(...validatePublishedPath(file.relativePath))
	}

	const cnameFile = files.find((file) => file.relativePath === 'CNAME')
	if (!cnameFile) {
		errors.push('dist直下にCNAMEがありません')
	} else {
		const cname = (await readFile(cnameFile.fullPath, 'utf8')).trim()
		if (cname !== options.expectedCname) {
			errors.push(
				`CNAMEが想定と一致しません（expected: ${options.expectedCname}）`,
			)
		}
	}
	if (!files.some((file) => file.relativePath === '.nojekyll')) {
		errors.push('dist直下に.nojekyllがありません')
	}

	const privateTokens = await collectPrivateOnlyTokens(
		identityDir,
		publicContentDir,
	)
	const identityRelativePath = toPosixPath(relative(process.cwd(), identityDir))
	const identityMarkers = [
		toPosixPath(identityDir),
		`${identityRelativePath}/`,
		`/${identityRelativePath}/`,
	].filter((marker) => marker && marker !== '.')

	for (const file of files) {
		if (!TEXT_EXTENSIONS.has(extname(file.relativePath).toLowerCase())) continue
		const content = await readFile(file.fullPath, 'utf8')
		const normalizedContent = normalizeEscapedSlashes(content)

		if (
			containsPrivateDocumentRoute(normalizedContent, options.expectedCname)
		) {
			errors.push(
				`${file.relativePath}: 文書用ルートへのリンクまたはsitemap記載があります`,
			)
		}
		if (/sourceMappingURL\s*=/.test(content)) {
			errors.push(`${file.relativePath}: sourcemap参照があります`)
		}
		if (
			IDENTITY_PATH_PATTERN.test(normalizedContent) ||
			identityMarkers.some((marker) => normalizedContent.includes(marker))
		) {
			errors.push(`${file.relativePath}: Identity sourceのパスが露出しています`)
		}
		if (PRIVATE_KEY_PATTERN.test(content)) {
			errors.push(`${file.relativePath}: private keyらしき内容があります`)
		}
		if (TOKEN_PATTERNS.some((pattern) => pattern.test(content))) {
			errors.push(`${file.relativePath}: access tokenらしき内容があります`)
		}

		for (const token of privateTokens) {
			if (!containsPrivateToken(content, token.value)) continue
			errors.push(
				`${file.relativePath}: private-only値が露出しています ` +
					`(sha256:${tokenFingerprint(token.value)}, source:${token.file}:${token.line})`,
			)
		}
	}

	if (errors.length > 0) {
		throw new Error(`公開成果物の検査に失敗しました:\n${errors.join('\n')}`)
	}

	console.log(
		`公開成果物を検査しました: ${files.length} files, ${privateTokens.length} private-only markers`,
	)
}

try {
	const options = parseArgs(process.argv.slice(2))
	await verifyPublicDist(options)
} catch (error) {
	console.error(error instanceof Error ? error.message : error)
	process.exitCode = 1
}
