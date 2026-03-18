import { gsap } from 'gsap'

let contentTl: gsap.core.Timeline | null = null

const enterTimeline = () => {
	contentTl?.kill()

	gsap.to('#home-images', { duration: 0.4, opacity: 0.8, ease: 'power2.out' })

	const h1 = document.querySelector<HTMLElement>('#page-links-home h1')

	// モバイルで非表示の要素をスキップ
	const visibleNavDivs: HTMLElement[] = []
	document
		.querySelectorAll<HTMLElement>('#page-links-home [data-nav-item]')
		.forEach((div) => {
			if (getComputedStyle(div).display !== 'none') visibleNavDivs.push(div)
		})

	const socialAs = [
		...document.querySelectorAll<HTMLElement>('#social-links-home a'),
	]

	const allTargets = [...(h1 ? [h1] : []), ...visibleNavDivs, ...socialAs]

	contentTl = gsap.timeline()
	// Phase 1: 一斉に opacity-15 へ
	contentTl.to(allTargets, { opacity: 0.15, duration: 0.2, ease: 'power2.out' })
	// Phase 2: 100ms ずつずらして opacity-100 へ
	contentTl.to(allTargets, {
		opacity: 1,
		duration: 0.6,
		ease: 'power2.inOut',
		stagger: 0.2,
	})
}

// モジュールスコープで追跡: 常に1つのハンドラのみ登録される状態を保証
let bgReadyHandler: (() => void) | null = null

document.addEventListener('astro:page-load', () => {
	// 古いハンドラを必ず削除（navigateが速くて発火せず残っていても除去）
	if (bgReadyHandler) {
		document.removeEventListener('app:bg-ready', bgReadyHandler)
		bgReadyHandler = null
	}
	if (document.body.classList.contains('is-home')) {
		bgReadyHandler = () => {
			bgReadyHandler = null
			enterTimeline()
		}
		document.addEventListener('app:bg-ready', bgReadyHandler)
	}
})
