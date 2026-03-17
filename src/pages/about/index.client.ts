import { gsap } from 'gsap'

function getRandomDelay() {
	return (Math.random() * 2 + 1) * 1000
}

let currentIconIndex = 0
let intervalId: ReturnType<typeof setTimeout> | null = null
let isAnimating = false

function changeIcon(iconElements: NodeListOf<Element>) {
	if (isAnimating) return
	isAnimating = true

	if (intervalId) clearTimeout(intervalId)
	intervalId = null

	if (!iconElements || iconElements.length <= 1) {
		isAnimating = false
		return
	}

	const currentIconElement = iconElements[currentIconIndex]

	let nextIconIndex: number
	do {
		nextIconIndex = Math.floor(Math.random() * iconElements.length)
	} while (nextIconIndex === currentIconIndex)

	const nextIconElement = iconElements[nextIconIndex]

	if (!currentIconElement || !nextIconElement) {
		console.error('Current or next icon element not found during transition.')
		isAnimating = false
		return
	}

	const tl = gsap.timeline({
		onComplete: () => {
			currentIconIndex = nextIconIndex
			isAnimating = false
			intervalId = setTimeout(() => changeIcon(iconElements), getRandomDelay())
		},
	})

	tl.to(currentIconElement, {
		duration: 0.4,
		rotationY: -90,
		opacity: 0,
		ease: 'power2.in',
		onComplete: () => {
			gsap.set(nextIconElement, { rotationY: 90, opacity: 0 })
		},
	})

	tl.to(
		nextIconElement,
		{ duration: 0.4, rotationY: 0, opacity: 0.9, ease: 'power2.out' },
		'>',
	)
}

document.addEventListener('astro:page-load', () => {
	if (intervalId) clearTimeout(intervalId)
	intervalId = null
	isAnimating = false
	gsap.killTweensOf('.rotating-icon-item')
	gsap.killTweensOf(
		'#about-content > *:not(#about-icon), #about-content > span',
	)

	const iconWrapperElements = document.querySelectorAll('.rotating-icon-item')
	if (!iconWrapperElements || iconWrapperElements.length === 0) {
		console.error('Rotating icon wrapper elements not found.')
		return
	}

	gsap.set(iconWrapperElements, { rotationY: 0, opacity: 0, scale: 1 })
	gsap.set(iconWrapperElements[0], { opacity: 0.9 })
	currentIconIndex = 0

	if (iconWrapperElements[0]) {
		gsap.from(iconWrapperElements[0], {
			duration: 1,
			opacity: 0,
			scale: 0.8,
			ease: 'power3.out',
			delay: 0.2,
			onComplete: () => {
				if (intervalId) clearTimeout(intervalId)
				intervalId = setTimeout(
					() => changeIcon(iconWrapperElements),
					getRandomDelay(),
				)
			},
		})
	} else {
		console.error('First icon wrapper element not found for initial animation.')
	}

	gsap.from('#about-content > *:not(#about-icon), #about-content > span', {
		duration: 0.8,
		opacity: 1,
		y: 20,
		stagger: 0.15,
		ease: 'power3.out',
		delay: 0.4,
	})
})
