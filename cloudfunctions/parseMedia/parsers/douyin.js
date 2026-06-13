const {
	fetchUrl,
	extractBetween,
	tryParseJson,
	deepFindVideoUrl,
	deepFindImages,
	filterImageUrls,
	normalizeUrl
} = require('./http')

async function parseDouyin(url) {
	const { body } = await fetchUrl(url)

	const renderRaw =
		extractBetween(body, '<script id="RENDER_DATA" type="application/json">', '</script>') ||
		extractBetween(body, 'id="RENDER_DATA" type="application/json">', '</script>')

	const routerRaw = extractBetween(body, 'window._ROUTER_DATA = ', '</script>')

	let data = tryParseJson(renderRaw) || tryParseJson(routerRaw)
	let title = ''
	let videoUrl = ''
	let cover = ''
	let images = []

	if (data) {
		const str = JSON.stringify(data)
		const descMatch = str.match(/"desc"\s*:\s*"((?:\\.|[^"\\]){1,300})"/)
		if (descMatch) title = descMatch[1].replace(/\\n/g, '\n')
		videoUrl = deepFindVideoUrl(data)
		images = filterImageUrls(deepFindImages(data))
		const coverMatch = str.match(/"cover"[^}]*"url_list"\s*:\s*\["([^"]+)"/)
		if (coverMatch) cover = normalizeUrl(coverMatch[1])
	}

	if (!videoUrl) {
		const m =
			body.match(/"playAddr"\s*:\s*"([^"]+)"/) ||
			body.match(/"playApi"\s*:\s*"([^"]+)"/) ||
			body.match(/play_addr[^}]*url_list[^[]*\["([^"]+)"/)
		if (m) videoUrl = normalizeUrl(m[1])
	}

	if (!images.length) {
		const imgMatches = body.match(/https?:\\\/\\\/[^"\\]+?\.(?:jpg|jpeg|png|webp)[^"\\]*/gi) || []
		images = filterImageUrls(imgMatches.map(normalizeUrl))
	}

	if (!videoUrl && !images.length) {
		throw new Error('未能解析抖音内容，请确认链接有效或稍后重试')
	}

	if (!cover && images.length) cover = images[0]

	return {
		platform: 'douyin',
		type: videoUrl ? 'video' : 'image_list',
		title: title || '抖音作品',
		cover,
		videoUrl: videoUrl || undefined,
		images: !videoUrl && images.length ? images.slice(0, 9) : undefined
	}
}

module.exports = { parseDouyin }
