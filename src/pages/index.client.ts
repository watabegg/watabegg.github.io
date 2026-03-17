import { gsap } from 'gsap'

const enterTimeline = () => {
	const tl = gsap.timeline()
	tl.to(
		'#page-links-home h1, #page-links-home a.page-link, #social-links-home a',
		{ duration: 0.2, opacity: 0.85, x: 0, stagger: 0.1, ease: 'power3.out' },
		'content',
	)
}

document.addEventListener('astro:page-load', enterTimeline)
