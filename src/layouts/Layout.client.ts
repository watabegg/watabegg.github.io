import { gsap } from 'gsap'
import type { PageType } from '@/types/page'

const HEADER = '#header-bg'
const FOOTER = '#footer-bg'
const $ = (sel: string) => document.querySelector<HTMLElement>(sel)

const getType = (): PageType =>
	document.body.classList.contains('is-home') ? 'home' : 'inner'

type Shape = {
	w: string
	h: string
	top?: string
	left?: string
	right?: string
	bottom?: string
	skewX: number
	skewY: number
	scaleX: number
	scaleY: number
	originX: string
	originY: string
}

const presets = {
	mobile: {
		home: {
			header: {
				w: '100vw',
				h: '60vh',
				top: '0',
				left: '0',
				skewX: 0,
				skewY: -6,
				scaleX: 1,
				scaleY: 1,
				originX: '0%',
				originY: '0%',
			},
			footer: {
				w: '100vw',
				h: '40vh',
				bottom: '-20vh',
				right: '0',
				skewX: 0,
				skewY: -6,
				scaleX: 1,
				scaleY: 1,
				originX: '0%',
				originY: '100%',
			},
		},
		inner: {
			header: {
				w: '100vw',
				h: '66px',
				top: '0',
				left: '0',
				skewX: 0,
				skewY: -2,
				scaleX: 1,
				scaleY: 1,
				originX: '0%',
				originY: '0%',
			},
			footer: {
				w: '100vw',
				h: '184px',
				bottom: '0',
				right: '0',
				skewX: 0,
				skewY: 0,
				scaleX: 1,
				scaleY: 1,
				originX: '0%',
				originY: '100%',
			},
		},
	},
	desktop: {
		home: {
			header: {
				w: '60vw',
				h: '100%',
				top: '0',
				left: '0',
				skewX: -6,
				skewY: 0,
				scaleX: 1,
				scaleY: 1,
				originX: '0%',
				originY: '0%',
			},
			footer: {
				w: '40vw',
				h: '100%',
				bottom: '0',
				right: '-10vw',
				skewX: -6,
				skewY: 0,
				scaleX: 1,
				scaleY: 1,
				originX: '100%',
				originY: '100%',
			},
		},
		inner: {
			header: {
				w: '100vw',
				h: '72px',
				top: '0',
				left: '0',
				skewX: 0,
				skewY: -2,
				scaleX: 1,
				scaleY: 1,
				originX: '0%',
				originY: '0%',
			},
			footer: {
				w: '100vw',
				h: '148px',
				bottom: '0',
				right: '0',
				skewX: 0,
				skewY: 0,
				scaleX: 1,
				scaleY: 1,
				originX: '100%',
				originY: '100%',
			},
		},
	},
} as const

const mm = window.matchMedia('(min-width: 768px)')
const getPreset = (type: PageType) =>
	mm.matches ? presets.desktop[type] : presets.mobile[type]

const buildVars = (shape: Shape): gsap.TweenVars => ({
	'--w': shape.w,
	'--h': shape.h,
	'--top': shape.top ?? 'auto',
	'--left': shape.left ?? 'auto',
	'--right': shape.right ?? 'auto',
	'--bottom': shape.bottom ?? 'auto',
	skewX: shape.skewX,
	skewY: shape.skewY,
	scaleX: shape.scaleX,
	scaleY: shape.scaleY,
	transformOrigin: `${shape.originX} ${shape.originY}`,
})

const setShape = (el: HTMLElement, shape: Shape) =>
	gsap.set(el, buildVars(shape))

const prep = (type: PageType) => {
	const preset = getPreset(type)
	const h = $(HEADER)
	const f = $(FOOTER)
	if (h) setShape(h, preset.header)
	if (f) setShape(f, preset.footer)
}

let currentTl: gsap.core.Timeline | null = null

const animateTo = (to: PageType, duration = 0.7, emitReady = false) => {
	currentTl?.kill()
	const preset = getPreset(to)
	const h = $(HEADER)
	const f = $(FOOTER)
	currentTl = gsap.timeline({
		defaults: { duration, ease: 'power3.inOut' },
		onComplete: () => {
			if (emitReady && to === 'home') {
				document.dispatchEvent(new CustomEvent('app:bg-ready'))
			}
		},
	})
	if (h) currentTl.to(h, buildVars(preset.header), 0)
	if (f) currentTl.to(f, buildVars(preset.footer), 0.06)
}

document.addEventListener('astro:after-swap', () => {
	// home に来るときは prep しない（即座リセットが白フラッシュの原因になる）
	// page-load の animateTo が現在位置からスムーズにアニメーションする
	const next = getType()
	if (next === 'home') return
	const prev = (window.__lastPageType as PageType) ?? 'inner'
	prep(prev)
})

document.addEventListener('astro:page-load', () => {
	const current = getType()
	if (window.__lastPageType === undefined) {
		prep('inner')
	}
	animateTo(current, 0.8, true)
	window.__lastPageType = current
})
