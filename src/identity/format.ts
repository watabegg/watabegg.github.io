import type { Experience } from './schema'

export function formatYearMonthValue(value: string): string {
	const [year, month] = value.split('-')
	return `${year}年${Number(month)}月`
}

export function formatIdentityPeriod(period: Experience['period']): string {
	const from = formatYearMonthValue(period.from)
	const to = period.to === 'present' ? '現在' : formatYearMonthValue(period.to)
	return `${from} – ${to}`
}

export function calculateIdentityDurationMonths(
	period: Experience['period'],
	referenceDate = new Date(),
): number {
	const [fromYear, fromMonth] = period.from.split('-').map(Number)
	const end =
		period.to === 'present'
			? {
					year: referenceDate.getFullYear(),
					month: referenceDate.getMonth() + 1,
				}
			: (() => {
					const [year, month] = period.to.split('-').map(Number)
					return { year, month }
				})()

	return Math.max(1, (end.year - fromYear) * 12 + end.month - fromMonth + 1)
}
