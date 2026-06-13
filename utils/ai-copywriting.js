import { callGenerateMomentsCopy, getErrorMessage } from '@/utils/cloud.js'

export const MOOD_OPTIONS = ['开心', '治愈', '感慨', '励志', '佛系', '吐槽']
export const STYLE_OPTIONS = ['日常', '文艺', '幽默', '专业', '小红书']

/**
 * @param {{
 *   theme: string,
 *   content?: string,
 *   mood?: string,
 *   style?: string,
 *   extra?: string,
 *   regenerate?: boolean,
 *   previousCopy?: string
 * }} options
 * @returns {Promise<string>}
 */
export async function generateMomentsCopy(options) {
	try {
		const data = await callGenerateMomentsCopy(options)
		return data.copy
	} catch (err) {
		throw new Error(getErrorMessage(err))
	}
}

/**
 * 客户端打字机效果（云函数返回完整文案后逐字展示）
 * @param {string} text
 * @param {(partial: string) => void} onUpdate
 * @param {{ interval?: number, chunkSize?: number }} [options]
 * @returns {{ promise: Promise<string>, cancel: () => void }}
 */
export function streamDisplayText(text, onUpdate, options = {}) {
	const full = text || ''
	const interval = options.interval ?? 28
	const chunkSize = options.chunkSize ?? 1
	let index = 0
	let timer = null

	const cancel = () => {
		if (timer) {
			clearInterval(timer)
			timer = null
		}
	}

	const promise = new Promise((resolve) => {
		if (!full) {
			onUpdate('')
			resolve('')
			return
		}

		onUpdate('')
		timer = setInterval(() => {
			index = Math.min(full.length, index + chunkSize)
			onUpdate(full.slice(0, index))
			if (index >= full.length) {
				cancel()
				resolve(full)
			}
		}, interval)
	})

	return { promise, cancel }
}

/**
 * @param {string} text
 * @returns {number}
 */
export function countCopyChars(text) {
	return (text || '').replace(/\s/g, '').length
}
