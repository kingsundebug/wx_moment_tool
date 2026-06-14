const {
	fetchUrl,
	extractBetween,
	tryParseJson,
	deepFindVideoUrls,
	deepFindImages,
	filterImageUrls,
	normalizeUrl,
	sortVideoCandidates,
	DESKTOP_UA
} = require('./http')

function collectMp4FromBody(body) {
	const urls = []
	const patterns = [
		/https?:\\\/\\\/[^"\\]+\.mp4[^"\\]*/gi,
		/https?:\/\/[^"\\]+\.mp4[^"\\]*/gi,
		/"url_list"\s*:\s*\[\s*"([^"]+\.mp4[^"]*)"/gi
	]
	for (const re of patterns) {
		let m
		while ((m = re.exec(body))) {
			urls.push(normalizeUrl(m[1] || m[0]))
		}
	}
	return urls
}

function collectPlayAddrFromBody(body) {
	const urls = []
	const re = /"play_addr"[\s\S]{0,600}?"url_list"\s*:\s*\[([^\]]+)\]/gi
	let m
	while ((m = re.exec(body))) {
		const block = m[1]
		const items = block.match(/"(https?:[^"]+)"/g) || []
		items.forEach((item) => urls.push(normalizeUrl(item.replace(/^"|"$/g, ''))))
	}
	const dlRe = /"download_addr"[\s\S]{0,600}?"url_list"\s*:\s*\[([^\]]+)\]/gi
	while ((m = dlRe.exec(body))) {
		const block = m[1]
		const items = block.match(/"(https?:[^"]+)"/g) || []
		items.forEach((item) => urls.push(normalizeUrl(item.replace(/^"|"$/g, ''))))
	}
	return urls
}

function extractAwemeId(body, data, finalUrl = '') {
	const sources = [finalUrl, body]
	if (data) sources.push(JSON.stringify(data))

	for (const text of sources) {
		if (!text) continue
		const patterns = [
			/\/video\/(\d{10,})/,
			/\/share\/video\/(\d{10,})/,
			/[?&]modal_id=(\d{10,})/,
			/[?&]aweme_id=(\d{10,})/,
			/"aweme_id"\s*:\s*"(\d{10,})"/,
			/"awemeId"\s*:\s*"(\d{10,})"/,
			/"itemId"\s*:\s*"(\d{10,})"/,
			/"item_id"\s*:\s*"(\d{10,})"/
		]
		for (const p of patterns) {
			const m = String(text).match(p)
			if (m) return m[1]
		}
	}
	return ''
}

function buildDouyinPlayUrls(awemeId) {
	if (!awemeId) return []
	const q = `video_id=${awemeId}&line=0&ratio=720p&watermark=0`
	return [
		`https://www.iesdouyin.com/aweme/v1/play/?${q}`,
		`https://www.douyin.com/aweme/v1/play/?${q}`
	]
}

function extractFromDetailJson(json) {
	const detail = json?.aweme_detail || json?.aweme_details?.[0]
	if (!detail) return { urls: [], title: '', cover: '' }

	const urls = []
	const playList = detail.video?.play_addr?.url_list || []
	const downloadList = detail.video?.download_addr?.url_list || []
	const h264List = detail.video?.play_addr_h264?.url_list || []
	;[...h264List, ...playList, ...downloadList].forEach((u) => {
		if (u) urls.push(normalizeUrl(u))
	})

	const title = detail.desc || detail.share_info?.share_title || ''
	const cover = detail.video?.cover?.url_list?.[0] || detail.video?.origin_cover?.url_list?.[0] || ''

	return { urls, title, cover: normalizeUrl(cover) }
}

function parsePageBody(body) {
	const renderRaw =
		extractBetween(body, '<script id="RENDER_DATA" type="application/json">', '</script>') ||
		extractBetween(body, 'id="RENDER_DATA" type="application/json">', '</script>')
	const routerRaw = extractBetween(body, 'window._ROUTER_DATA = ', '</script>')
	const data = tryParseJson(renderRaw) || tryParseJson(routerRaw)

	let title = ''
	let cover = ''
	let images = []
	const videoCandidates = []

	if (data) {
		const str = JSON.stringify(data)
		const descMatch = str.match(/"desc"\s*:\s*"((?:\\.|[^"\\]){1,300})"/)
		if (descMatch) title = descMatch[1].replace(/\\n/g, '\n')
		videoCandidates.push(...deepFindVideoUrls(data))
		images = filterImageUrls(deepFindImages(data))
		const coverMatch = str.match(/"cover"[^}]*"url_list"\s*:\s*\["([^"]+)"/)
		if (coverMatch) cover = normalizeUrl(coverMatch[1])
	}

	videoCandidates.push(...collectMp4FromBody(body))
	videoCandidates.push(...collectPlayAddrFromBody(body))

	const legacy =
		body.match(/"playAddr"\s*:\s*"([^"]+)"/) ||
		body.match(/"playApi"\s*:\s*"([^"]+)"/) ||
		body.match(/play_addr[^}]*url_list[^[]*\["([^"]+)"/)
	if (legacy) videoCandidates.push(normalizeUrl(legacy[1]))

	return { data, title, cover, images, videoCandidates }
}

async function fetchDouyinDetail(awemeId) {
	const apiUrl =
		`https://www.douyin.com/aweme/v1/web/aweme/detail/?device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=${awemeId}`
	try {
		const { body } = await fetchUrl(apiUrl, 8, apiUrl, { userAgent: DESKTOP_UA })
		const json = tryParseJson(body)
		if (json) return extractFromDetailJson(json)
	} catch (e) {
		console.warn('douyin detail api failed:', e.message)
	}
	return null
}

async function parseDouyin(url) {
	const { body: firstBody, finalUrl } = await fetchUrl(url)
	let { data, title, cover, images, videoCandidates } = parsePageBody(firstBody)

	let awemeId = extractAwemeId(firstBody, data, finalUrl)

	if (awemeId) {
		const detail = await fetchDouyinDetail(awemeId)
		if (detail) {
			if (detail.title) title = detail.title
			if (detail.cover) cover = detail.cover
			videoCandidates.push(...detail.urls)
		}

		const extraPages = [
			`https://www.iesdouyin.com/share/video/${awemeId}/`,
			`https://www.douyin.com/video/${awemeId}`
		]
		for (const pageUrl of extraPages) {
			try {
				const { body } = await fetchUrl(pageUrl)
				const parsed = parsePageBody(body)
				videoCandidates.push(...parsed.videoCandidates)
				if (!title && parsed.title) title = parsed.title
				if (!cover && parsed.cover) cover = parsed.cover
				if (!images.length) images = parsed.images
			} catch (e) {
				console.warn('douyin page fetch failed:', pageUrl, e.message)
			}
		}
	}

	const playUrls = buildDouyinPlayUrls(awemeId)
	const allVideoUrls = sortVideoCandidates([...videoCandidates, ...playUrls].filter(Boolean))
	const videoUrl = allVideoUrls[0] || ''

	if (!videoUrl && !images.length) {
		throw new Error('未能解析抖音内容，请确认链接有效或稍后重试')
	}

	if (!cover && images.length) cover = images[0]

	return {
		platform: 'douyin',
		type: videoUrl || playUrls.length ? 'video' : 'image_list',
		title: title || '抖音作品',
		cover,
		videoUrl: videoUrl || undefined,
		videoCandidates: allVideoUrls,
		awemeId: awemeId || undefined,
		images: !videoUrl && !playUrls.length && images.length ? images.slice(0, 9) : undefined
	}
}

module.exports = { parseDouyin }
