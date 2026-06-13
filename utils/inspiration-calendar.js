import calendar2026 from '@/static/calendar/2026.json'

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/**
 * Format a Date (or date parts) as YYYY-MM-DD.
 */
export function formatDateKey(date) {
	const d = date instanceof Date ? date : new Date(date)
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

/**
 * Build calendar grid cells for a month (includes leading/trailing blanks).
 * @returns {Array<{ dateKey: string|null, day: number|null, isCurrentMonth: boolean }>}
 */
export function getMonthDays(year, month) {
	const firstDay = new Date(year, month - 1, 1)
	const lastDay = new Date(year, month, 0)
	const startWeekday = firstDay.getDay()
	const daysInMonth = lastDay.getDate()
	const cells = []

	for (let i = 0; i < startWeekday; i++) {
		cells.push({ dateKey: null, day: null, isCurrentMonth: false })
	}
	for (let d = 1; d <= daysInMonth; d++) {
		const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
		cells.push({ dateKey, day: d, isCurrentMonth: true })
	}
	while (cells.length % 7 !== 0) {
		cells.push({ dateKey: null, day: null, isCurrentMonth: false })
	}
	return cells
}

export function getWeekdayLabels() {
	return WEEKDAY_LABELS
}

let cachedData = null

/**
 * Load static calendar JSON (2026).
 */
export function loadCalendarData() {
	if (!cachedData) {
		cachedData = calendar2026
	}
	return cachedData
}

/**
 * Merge holiday, solar term, and inspirations for a date key.
 */
export function getDayInfo(dateKey) {
	const data = loadCalendarData()
	const holiday = data.holidays?.[dateKey] || null
	const solarTerm = data.solarTerms?.[dateKey] || null
	const inspirations = data.inspirations?.[dateKey] || []

	return {
		dateKey,
		holiday,
		solarTerm,
		inspirations,
		hasMark: Boolean(holiday || solarTerm || inspirations.length)
	}
}

/**
 * Convenience: today's merged info.
 */
export function getTodayInfo() {
	return getDayInfo(formatDateKey(new Date()))
}

/**
 * Check if a date key has holiday, solar term, or inspiration marker.
 */
export function hasEventMark(dateKey) {
	const data = loadCalendarData()
	return Boolean(
		data.holidays?.[dateKey] ||
		data.solarTerms?.[dateKey] ||
		(data.inspirations?.[dateKey] && data.inspirations[dateKey].length)
	)
}
