const URL_REG = /https?:\/\/[^\s\u4e00-\u9fa5]+/gi

export function extractUrl(text) {
	if (!text) return ''
	const match = String(text).match(URL_REG)
	return match ? match[0].replace(/[，。！？、]+$/, '') : ''
}

export function detectPlatform(url) {
	if (!url) return 'unknown'
	if (/douyin\.com|iesdouyin\.com|v\.douyin/i.test(url)) return 'douyin'
	if (/xiaohongshu\.com|xhslink\.com/i.test(url)) return 'xiaohongshu'
	return 'unknown'
}
