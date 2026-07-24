// @ts-check

const documentRoutes = [
	['/documents', '../documents/pages/index.astro'],
	['/documents/skillsheet', '../documents/pages/skillsheet.astro'],
	['/documents/resume', '../documents/pages/resume.astro'],
	['/documents/work-history', '../documents/pages/work-history.astro'],
]

/**
 * Registers private document routes only for an explicitly enabled local run.
 * Keeping the entrypoints outside `src/pages` means a normal public build does
 * not discover these pages at all.
 *
 * @returns {import('astro').AstroIntegration}
 */
export default function localDocuments() {
	return {
		name: 'watabegg-local-documents',
		hooks: {
			'astro:config:setup': ({ injectRoute }) => {
				if (process.env.LOCAL_DOCUMENTS !== '1') return

				for (const [pattern, entrypoint] of documentRoutes) {
					injectRoute({
						pattern,
						entrypoint: new URL(entrypoint, import.meta.url),
					})
				}
			},
		},
	}
}
