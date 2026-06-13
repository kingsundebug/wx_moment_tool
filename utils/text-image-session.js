const SESSION_KEY = 'text_image_session'

/**
 * @param {{
 *   mode: 'short' | 'long',
 *   inputText: string,
 *   templateId: string
 * }} payload
 */
export function saveTextImageSession(payload) {
	uni.setStorageSync(SESSION_KEY, payload)
}

/**
 * @returns {{
 *   mode: 'short' | 'long',
 *   inputText: string,
 *   templateId: string
 * } | null}
 */
export function getTextImageSession() {
	try {
		return uni.getStorageSync(SESSION_KEY) || null
	} catch (e) {
		return null
	}
}

export function clearTextImageSession() {
	try {
		uni.removeStorageSync(SESSION_KEY)
	} catch (e) {
		// ignore
	}
}
