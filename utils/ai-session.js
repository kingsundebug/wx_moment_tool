const SESSION_KEY = 'ai_copy_session'

/**
 * @param {{
 *   theme: string,
 *   content?: string,
 *   mood?: string,
 *   style?: string,
 *   extra?: string,
 *   previousCopy?: string
 * }} payload
 */
export function saveAiSession(payload) {
	uni.setStorageSync(SESSION_KEY, payload)
}

/**
 * @returns {{
 *   theme: string,
 *   content?: string,
 *   mood?: string,
 *   style?: string,
 *   extra?: string,
 *   previousCopy?: string
 * } | null}
 */
export function getAiSession() {
	try {
		return uni.getStorageSync(SESSION_KEY) || null
	} catch (e) {
		return null
	}
}

export function clearAiSession() {
	try {
		uni.removeStorageSync(SESSION_KEY)
	} catch (e) {
		// ignore
	}
}
