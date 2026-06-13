const ZWSP = '\u200B'

export function antiFold(text, interval = 3) {
	if (!text) return ''
	return text.split('').reduce((acc, char, i) => {
		const sep = (i + 1) % interval === 0 ? ZWSP : ''
		return acc + char + sep
	}, '')
}

/** 直接调用官方剪贴板 API，本地调试无需配置 MP 隐私指引 */
export function copyText(text, toastTitle = '已复制') {
	if (!text) {
		return Promise.resolve()
	}
	return new Promise((resolve, reject) => {
		uni.setClipboardData({
			data: text,
			success: () => {
				// 微信小程序 success 后系统会自动 toast「内容已复制」
				// #ifndef MP-WEIXIN
				uni.showToast({ title: toastTitle, icon: 'success' })
				// #endif
				resolve()
			},
			fail: (err) => {
				uni.showToast({ title: '复制失败', icon: 'none' })
				reject(err)
			}
		})
	})
}

export function pasteText() {
	return new Promise((resolve, reject) => {
		uni.getClipboardData({
			success: (res) => resolve(res.data || ''),
			fail: (err) => {
				uni.showToast({ title: '读取剪贴板失败', icon: 'none' })
				reject(err)
			}
		})
	})
}

export async function copyWithAntiFold(text, interval = 3) {
	await copyText(antiFold(text, interval), '已防折叠复制')
}
