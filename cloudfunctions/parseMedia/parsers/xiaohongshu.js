const {
	fetchUrl,
	extractBetween,
	tryParseJson,
	deepFindVideoUrls,
	deepFindImages,
	filterImageUrls,
	normalizeUrl,
	pickBestVideoUrl,
	sortVideoCandidates
} = require('./http')

function collectH264FromText(text) {
	const urls = []
	const re = /"h264"[\s\S]{0,3000}?"masterUrl"\s*:\s*"([^"]+)"/gi
	let m
	while ((m = re.exec(text))) {
		urls.push(normalizeUrl(m[1]))
	}
	const re2 = /"h264"[\s\S]{0,3000}?"url"\s*:\s*"([^"]+\.mp4[^"]*)"/gi
	while ((m = re2.exec(text))) {
		urls.push(normalizeUrl(m[1]))
	}
	return urls
}

function collectGenericVideoFromText(text) {
	const urls = []
	const patterns = [
		/"masterUrl"\s*:\s*"([^"]+)"/g,
		/"streamUrl"\s*:\s*"([^"]+)"/g,
		/"originVideoKey"\s*:\s*"([^"]+)"/g
	]
	for (const re of patterns) {
		let m
		while ((m = re.exec(text))) {
			const u = normalizeUrl(m[1])
			if (u.startsWith('http')) urls.push(u)
		}
	}
	return urls
}

async function parseXiaohongshu(url) {
	const { body } = await fetchUrl(url)

	const stateRaw =
		extractBetween(body, 'window.__INITIAL_STATE__=', '</script>') ||
		extractBetween(body, 'window.__INITIAL_STATE__ =', '</script>')

	let title = ''
	let cover = ''
	let images = []
	const videoCandidates = []

	const state = tryParseJson(stateRaw)
	if (state) {
		const str = JSON.stringify(state)
		const titleMatch = str.match(/"title"\s*:\s*"((?:\\.|[^"\\]){1,200})"/)
		if (titleMatch) title = titleMatch[1]
		videoCandidates.push(...collectH264FromText(str))
		videoCandidates.push(...deepFindVideoUrls(state))
		images = filterImageUrls(deepFindImages(state))
	}

	videoCandidates.push(...collectH264FromText(body))
	videoCandidates.push(...collectGenericVideoFromText(body))

	if (!title) {
		const htmlTitle = body.match(/<title>([^<]+)<\/title>/)
		if (htmlTitle) title = htmlTitle[1].replace(/- 小红书$/, '').trim()
	}

	const sorted = sortVideoCandidates(videoCandidates)
	const videoUrl = sorted[0] || ''

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
		videoCandidates: sorted.length ? sorted : undefined,
		images: images.length ? images.slice(0, 18) : undefined
	}
}

module.exports = { parseXiaohongshu }
