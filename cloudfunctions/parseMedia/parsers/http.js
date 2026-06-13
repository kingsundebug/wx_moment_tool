const https = require('https')
const http = require('http')
const { URL } = require('url')

const UA =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

function fetchUrl(url, redirects = 8) {
	return new Promise((resolve, reject) => {
		let lib
		try {
			lib = url.startsWith('https') ? https : http
		} catch (e) {
			return reject(new Error('无效链接'))
		}

		const req = lib.get(
			url,
			{
				headers: {
					'User-Agent': UA,
					Accept: 'text/html,application/json,*/*',
					'Accept-Language': 'zh-CN,zh;q=0.9'
				}
			},
			(res) => {
				if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
					if (redirects <= 0) return reject(new Error('重定向过多'))
					const next = res.headers.location.startsWith('http')
						? res.headers.location
						: new URL(res.headers.location, url).href
					return resolve(fetchUrl(next, redirects - 1))
				}
				const chunks = []
				res.on('data', (c) => chunks.push(c))
				res.on('end', () =>
					resolve({
						body: Buffer.concat(chunks).toString('utf8'),
						finalUrl: res.responseUrl || url,
						contentType: res.headers['content-type'] || ''
					})
				)
			}
		)
		req.on('error', reject)
		req.setTimeout(20000, () => {
			req.destroy()
			reject(new Error('请求超时'))
		})
	})
}

function fetchBuffer(url, redirects = 8) {
	return new Promise((resolve, reject) => {
		const lib = url.startsWith('https') ? https : http
		const req = lib.get(url, { headers: { 'User-Agent': UA } }, (res) => {
			if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
				if (redirects <= 0) return reject(new Error('重定向过多'))
				const next = res.headers.location.startsWith('http')
					? res.headers.location
					: new URL(res.headers.location, url).href
				return resolve(fetchBuffer(next, redirects - 1))
			}
			const chunks = []
			res.on('data', (c) => chunks.push(c))
			res.on('end', () => resolve(Buffer.concat(chunks)))
		})
		req.on('error', reject)
		req.setTimeout(30000, () => {
			req.destroy()
			reject(new Error('下载超时'))
		})
	})
}

function extractBetween(text, start, end) {
	const i = text.indexOf(start)
	if (i < 0) return ''
	const j = text.indexOf(end, i + start.length)
	if (j < 0) return ''
	return text.slice(i + start.length, j)
}

function tryParseJson(str) {
	if (!str) return null
	try {
		return JSON.parse(str)
	} catch (e) {
		try {
			return JSON.parse(decodeURIComponent(str))
		} catch (e2) {
			return null
		}
	}
}

function normalizeUrl(u) {
	if (!u) return ''
	return String(u)
		.replace(/\\u002F/g, '/')
		.replace(/\\\//g, '/')
		.replace(/\\"/g, '"')
		.trim()
}

function deepFindVideoUrl(obj, depth = 0) {
	if (!obj || depth > 12) return ''
	if (typeof obj === 'string') {
		if (/^https?:\/\/.+\.(mp4|m3u8)/i.test(obj) || obj.includes('video')) return normalizeUrl(obj)
		return ''
	}
	if (Array.isArray(obj)) {
		for (const item of obj) {
			const r = deepFindVideoUrl(item, depth + 1)
			if (r) return r
		}
		return ''
	}
	if (typeof obj === 'object') {
		const candidates = [
			obj.play_addr?.url_list?.[0],
			obj.download_addr?.url_list?.[0],
			obj.playApi,
			obj.play_addr_h264?.url_list?.[0],
			obj.masterUrl,
			obj.url
		]
		for (const c of candidates) {
			const n = normalizeUrl(c)
			if (n.startsWith('http')) return n
		}
		for (const key of Object.keys(obj)) {
			const r = deepFindVideoUrl(obj[key], depth + 1)
			if (r) return r
		}
	}
	return ''
}

function deepFindImages(obj, depth = 0, out = []) {
	if (!obj || depth > 12) return out
	if (typeof obj === 'string') {
		const u = normalizeUrl(obj)
		if (/^https?:\/\/.+\.(jpg|jpeg|png|webp)/i.test(u)) out.push(u)
		return out
	}
	if (Array.isArray(obj)) {
		if (obj.length && obj.every((x) => typeof x === 'string' && /^https?:\/\//.test(x))) {
			obj.forEach((s) => deepFindImages(s, depth + 1, out))
			return out
		}
		obj.forEach((item) => deepFindImages(item, depth + 1, out))
		return out
	}
	if (typeof obj === 'object') {
		if (Array.isArray(obj.url_list)) {
			obj.url_list.forEach((u) => deepFindImages(u, depth + 1, out))
		}
		if (obj.images_list) deepFindImages(obj.images_list, depth + 1, out)
		for (const key of Object.keys(obj)) {
			deepFindImages(obj[key], depth + 1, out)
		}
	}
	return out
}

function uniqueUrls(urls) {
	return [...new Set(urls.filter((u) => u && u.startsWith('http')))]
}

function filterImageUrls(urls) {
	return uniqueUrls(urls).filter(
		(u) =>
			!/avatar|emoji|icon|logo|watermark标记/i.test(u) &&
			!u.includes('imageView2/1_w') &&
			u.length < 500
	)
}

module.exports = {
	fetchUrl,
	fetchBuffer,
	extractBetween,
	tryParseJson,
	normalizeUrl,
	deepFindVideoUrl,
	deepFindImages,
	filterImageUrls,
	uniqueUrls
}
