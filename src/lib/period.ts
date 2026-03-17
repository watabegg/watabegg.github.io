import { differenceInMonths, formatYearMonth } from './time'

export type PeriodRange = {
	start: Date
	end: Date | null
}

export function parsePeriodRange(period: string): PeriodRange {
	const [startRaw, endRaw] = period.replace(/\s+/g, '').split('/')

	const start = new Date(startRaw)
	if (Number.isNaN(start.valueOf())) {
		throw new Error(`Invalid start date in period: ${period}`)
	}

	if (!endRaw || endRaw.toLowerCase() === 'present') {
		return { start, end: null }
	}

	const end = new Date(endRaw)
	if (Number.isNaN(end.valueOf())) {
		throw new Error(`Invalid end date in period: ${period}`)
	}

	return { start, end }
}

export function formatPeriodLabel(range: PeriodRange): string {
	const startLabel = formatYearMonth(range.start)

	if (!range.end) {
		return `${startLabel}-現在`
	}

	const endLabel = formatYearMonth(range.end)
	return `${startLabel}-${endLabel}`
}

export function calculateDurationMonths(
	range: PeriodRange,
	referenceDate = new Date(),
): number {
	const endDate = range.end ?? referenceDate
	return Math.max(1, differenceInMonths(range.start, endDate))
}
