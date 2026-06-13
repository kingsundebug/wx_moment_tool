const PRIVACY_AGREED_KEY = 'privacy_agreed_v1'
const PRIVACY_AGREE_BUTTON_ID = 'privacy-agree-btn'

let pendingPrivacyResolve = null
let showPrivacyPopupFn = null
let pendingClipboardAction = null
let privacyHandlerInited = false

export function isPrivacyAgreedLocally() {
	return !!uni.getStorageSync(PRIVACY_AGREED_KEY)
}

export function setPrivacyAgreedLocally() {
	uni.setStorageSync(PRIVACY_AGREED_KEY, '1')
}

export function registerPrivacyPopup(showFn) {
	showPrivacyPopupFn = showFn
	if (!privacyHandlerInited) {
		initPrivacyAuthorization()
	}
}

/**
 * 官方推荐：wx.onNeedPrivacyAuthorization 监听隐私接口调用
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/PrivacyAuthorize.html
 */
export function initPrivacyAuthorization() {
	if (privacyHandlerInited) {
		return
	}
	privacyHandlerInited = true
	// #ifdef MP-WEIXIN
	if (typeof wx !== 'undefined' && wx.onNeedPrivacyAuthorization) {
		wx.onNeedPrivacyAuthorization((resolve) => {
			pendingPrivacyResolve = resolve
			if (showPrivacyPopupFn) {
				showPrivacyPopupFn()
			}
		})
	}
	// #endif
}

export function resolvePrivacyAuthorization(agreed) {
	if (pendingPrivacyResolve) {
		if (agreed) {
			pendingPrivacyResolve({ event: 'agree', buttonId: PRIVACY_AGREE_BUTTON_ID })
		} else {
			pendingPrivacyResolve({ event: 'disagree' })
		}
		pendingPrivacyResolve = null
	}
	if (agreed) {
		runPendingClipboardAction()
	} else {
		clearPendingClipboardAction()
	}
}

export function setPendingClipboardAction(action) {
	pendingClipboardAction = action
}

export function clearPendingClipboardAction() {
	pendingClipboardAction = null
}

export function runPendingClipboardAction() {
	if (!pendingClipboardAction) {
		return
	}
	const action = pendingClipboardAction
	pendingClipboardAction = null
	action()
}

/**
 * 官方推荐：启动时用 wx.getPrivacySetting 判断是否需要弹窗
 */
export function checkNeedPrivacyAuth() {
	return new Promise((resolve) => {
		// #ifdef MP-WEIXIN
		if (typeof wx !== 'undefined' && wx.getPrivacySetting) {
			wx.getPrivacySetting({
				success: (res) => resolve(!!res.needAuthorization),
				fail: () => resolve(!isPrivacyAgreedLocally())
			})
			return
		}
		// #endif
		resolve(!isPrivacyAgreedLocally())
	})
}

function getErrorMessage(err) {
	return (
		(typeof err === 'string' ? err : err?.errMsg || err?.message || '') || '复制失败'
	)
}

export function isPrivacyClipboardError(err) {
	const msg = getErrorMessage(err)
	return /privacy agreement|errno.?112|api scope is not declared|privacy denied|用户拒绝|用户未同意/i.test(
		msg
	)
}

export function isUndeclaredClipboardError(err) {
	const msg = getErrorMessage(err)
	return /privacy agreement|errno.?112|api scope is not declared/i.test(msg)
}

export function formatClipboardError(err) {
	const msg = getErrorMessage(err)
	if (isUndeclaredClipboardError(err)) {
		return (
			'剪贴板未在隐私协议中声明。\n\n' +
			'请登录 mp.weixin.qq.com → 设置 → 用户隐私保护指引 → 更新，勾选「剪贴板」并提交审核（约 5 分钟生效）。'
		)
	}
	if (/privacy denied|用户拒绝|用户未同意/i.test(msg)) {
		return '需同意隐私指引后才能使用剪贴板'
	}
	return msg
}

export function showClipboardError(err) {
	uni.showModal({
		title: '无法复制',
		content: formatClipboardError(err),
		showCancel: false
	})
}

export function openPrivacyContract() {
	// #ifdef MP-WEIXIN
	if (typeof wx !== 'undefined' && wx.openPrivacyContract) {
		wx.openPrivacyContract()
		return
	}
	// #endif
	uni.navigateTo({ url: '/pages/mine/about?tab=privacy' })
}

export { PRIVACY_AGREE_BUTTON_ID }
