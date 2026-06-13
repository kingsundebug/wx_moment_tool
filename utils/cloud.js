import { CLOUD_ENV_ID } from '@/config/cloud.js'

const SETTINGS_KEY = 'app_settings'
const DEFAULT_SETTINGS = {
	draftSyncMode: 'local',
	defaultAntiFold: true,
	defaultAiMood: '开心',
	defaultAiStyle: '日常'
}

export const ERROR_MSG = {
	INVALID_INPUT: '请至少填写朋友圈主题',
	GENERATE_FAILED: '文案生成失败，请稍后重试',
	RATE_LIMIT: '请求过于频繁，请稍后再试',
	CLOUD_NOT_READY: '云开发未就绪，请确认已开通并填写环境 ID',
	MOMENTS_CLOUD_FAIL:
		'云函数调用失败，请确认 generateMomentsCopy 已上传部署到云端',
	FUNCTION_TIMEOUT:
		'云函数执行超时，请在云开发控制台将 generateMomentsCopy 超时时间改为 60 秒后重试'
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function getErrorMessage(err) {
	if (err && typeof err === 'object') {
		if ('errMsg' in err && err.errMsg) {
			const msg = String(err.errMsg)
			if (/FUNCTION_NOT_FOUND|501000|could not find function/i.test(msg)) {
				return ERROR_MSG.MOMENTS_CLOUD_FAIL
			}
			if (/504003|FUNCTIONS_TIME_LIMIT_EXCEEDED|timed out after 3/i.test(msg)) {
				return ERROR_MSG.FUNCTION_TIMEOUT
			}
			if (/cloud init|Environment not found/i.test(msg)) {
				return '云环境未找到，请检查 config/cloud.js 中的 CLOUD_ENV_ID'
			}
			return msg
		}
		if ('message' in err && err.message) {
			return String(err.message)
		}
		if ('code' in err && err.code && ERROR_MSG[err.code]) {
			return ERROR_MSG[err.code]
		}
	}
	if (typeof err === 'string' && err) {
		return err
	}
	return ERROR_MSG.GENERATE_FAILED
}

export function initCloud() {
	// #ifdef MP-WEIXIN
	if (!wx.cloud) {
		console.error('请使用 2.2.3 或以上基础库，并开通云开发')
		return false
	}
	if (!CLOUD_ENV_ID || CLOUD_ENV_ID === 'your-env-id') {
		console.warn('请在 config/cloud.js 中配置 CLOUD_ENV_ID')
	}
	wx.cloud.init({
		env: CLOUD_ENV_ID,
		traceUser: true
	})
	return true
	// #endif
	// #ifndef MP-WEIXIN
	return false
	// #endif
}

export function ensureCloudReady() {
	// #ifdef MP-WEIXIN
	if (typeof wx === 'undefined' || !wx.cloud) {
		return Promise.reject(new Error(ERROR_MSG.CLOUD_NOT_READY))
	}
	if (!CLOUD_ENV_ID || CLOUD_ENV_ID === 'your-env-id') {
		return Promise.reject(
			new Error('请在 config/cloud.js 填写 CLOUD_ENV_ID')
		)
	}
	wx.cloud.init({
		env: CLOUD_ENV_ID,
		traceUser: true
	})
	return Promise.resolve()
	// #endif
	// #ifndef MP-WEIXIN
	return Promise.reject(new Error('仅支持微信小程序'))
	// #endif
}

export function callCloud(name, data = {}) {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		wx.cloud.callFunction({
			name,
			data,
			success: (res) => resolve(res.result),
			fail: reject
		})
		// #endif
		// #ifndef MP-WEIXIN
		reject(new Error('仅支持微信小程序'))
		// #endif
	})
}

/**
 * @param {{
 *   theme: string,
 *   content?: string,
 *   mood?: string,
 *   style?: string,
 *   extra?: string,
 *   regenerate?: boolean,
 *   previousCopy?: string
 * }} payload
 * @returns {Promise<{ ok: true, copy: string }>}
 */
export function callGenerateMomentsCopy(payload) {
	return ensureCloudReady().then(
		() =>
			new Promise((resolve, reject) => {
				// #ifdef MP-WEIXIN
				wx.cloud.callFunction({
					name: 'generateMomentsCopy',
					data: payload,
					config: {
						timeout: 60000
					},
					success(res) {
						const data = res.result
						if (data && data.ok && data.copy) {
							resolve(data)
							return
						}
						reject(
							data || {
								code: 'GENERATE_FAILED',
								message: ERROR_MSG.GENERATE_FAILED
							}
						)
					},
					fail(err) {
						reject(err || { errMsg: ERROR_MSG.MOMENTS_CLOUD_FAIL })
					}
				})
				// #endif
			})
	)
}

export function getSettings() {
	try {
		const raw = uni.getStorageSync(SETTINGS_KEY)
		return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
	} catch (e) {
		return { ...DEFAULT_SETTINGS }
	}
}

export function saveSettings(settings) {
	const merged = { ...getSettings(), ...settings }
	uni.setStorageSync(SETTINGS_KEY, JSON.stringify(merged))
	return merged
}

export { CLOUD_ENV_ID }
