const {
	fetchUrl,
	extractBetween,
	tryParseJson,
	deepFindVideoUrl,
	deepFindImages,
	filterImageUrls,
	normalizeUrl
} = require('./http')

async function parseXiaohongshu(url) {
	const { body } = await fetchUrl(url)

	const stateRaw =
		extractBetween(body, 'window.__INITIAL_STATE__=', '</script>') ||
		extractBetween(body, 'window.__INITIAL_STATE__ =', '</script>')

	let title = ''
	let videoUrl = ''
	let cover = ''
	let images = []

	const state = tryParseJson(stateRaw)
	if (state) {
		const str = JSON.stringify(state)
		const titleMatch = str.match(/"title"\s*:\s*"((?:\\.|[^"\\]){1,200})"/)
		if (titleMatch) title = titleMatch[1]
		videoUrl = deepFindVideoUrl(state)
		images = filterImageUrls(deepFindImages(state))
	}

	if (!title) {
		const htmlTitle = body.match(/<title>([^<]+)<\/title>/)
		if (htmlTitle) title = htmlTitle[1].replace(/- 小红书$/, '').trim()
	}

	if (!videoUrl) {
		const m = body.match(/"masterUrl"\s*:\s*"([^"]+)"/) || body.match(/"originVideoKey"\s*:\s*"([^"]+)"/)
		if (m) videoUrl = normalizeUrl(m[1])
	}

	if (!images.length) {
		const patterns = [
			/https?:\\\/\\\/sns-webpic[^"\\]+/gi,
			/https?:\\\/\\\/ci\.xiaohongshu\.com[^"\\]+/gi,
			/https?:\/\/sns-webpic[^"'\s]+/gi
		]
		for (const p of patterns) {
			const m = body.match(p)
			if (m) {
				images = filterImageUrls(m.map(normalizeUrl))
				if (images.length) break
			}
		}
	}

	if (!videoUrl && !images.length) {
		throw new Error('未能解析小红书内容，请确认链接有效或稍后重试')
	}

	if (!cover && images.length) cover = images[0]

	return {
		platform: 'xiaohongshu',
		type: videoUrl ? 'video' : 'image_list',
		title: title || '小红书笔记',
		cover,
		videoUrl: videoUrl || undefined,
		images: images.length ? images.slice(0, 18) : undefined
	}
}

module.exports = { parseXiaohongshu }
