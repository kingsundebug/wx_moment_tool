const https = require('https')
const http = require('http')
const { URL } = require('url')

const UA =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const DESKTOP_UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function fetchUrl(url, redirects = 8, currentUrl = url, options = {}) {
	const userAgent = options.userAgent || UA
	return new Promise((resolve, reject) => {
		let lib
		try {
			lib = url.startsWith('https') ? https : http
		} catch (e) {
			return reject(new Error('无效链接'))
		}

		const referer = /douyin|iesdouyin/i.test(url)
			? 'https://www.douyin.com/'
			: /xiaohongshu|xhs/i.test(url)
				? 'https://www.xiaohongshu.com/'
				: undefined

		const req = lib.get(
			url,
			{
				headers: {
					'User-Agent': userAgent,
					Accept: 'text/html,application/json,*/*',
					'Accept-Language': 'zh-CN,zh;q=0.9',
					...(referer ? { Referer: referer } : {})
				}
			},
			(res) => {
				if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
					if (redirects <= 0) return reject(new Error('重定向过多'))
					const next = res.headers.location.startsWith('http')
						? res.headers.location
						: new URL(res.headers.location, currentUrl).href
					return resolve(fetchUrl(next, redirects - 1, next, options))
				}
				const chunks = []
				res.on('data', (c) => chunks.push(c))
				res.on('end', () =>
					resolve({
						body: Buffer.concat(chunks).toString('utf8'),
						finalUrl: currentUrl,
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

function isMp4Buffer(buf) {
	if (!buf || buf.length < 12) return false
	return buf.slice(4, 8).toString('ascii') === 'ftyp'
}

function fetchBuffer(url, redirects = 8, currentUrl = url) {
	return new Promise((resolve, reject) => {
		const lib = url.startsWith('https') ? https : http
		const referer = /xiaohongshu|xhs/i.test(url)
			? 'https://www.xiaohongshu.com/'
			: 'https://www.douyin.com/'
		const req = lib.get(
			url,
			{
				headers: {
					'User-Agent': UA,
					Referer: referer,
					Accept: '*/*',
					'Accept-Encoding': 'identity',
					Range: 'bytes=0-'
				}
			},
			(res) => {
				if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
					if (redirects <= 0) return reject(new Error('重定向过多'))
					const next = res.headers.location.startsWith('http')
						? res.headers.location
						: new URL(res.headers.location, currentUrl).href
					return resolve(fetchBuffer(next, redirects - 1, next))
				}
				if (res.statusCode !== 200 && res.statusCode !== 206) {
					return reject(new Error(`下载失败 HTTP ${res.statusCode}`))
				}
				const chunks = []
				res.on('data', (c) => chunks.push(c))
				res.on('end', () => resolve(Buffer.concat(chunks)))
			}
		)
		req.on('error', reject)
		req.setTimeout(45000, () => {
			req.destroy()
			reject(new Error('下载超时'))
		})
	})
}

function analyzeMp4Buffer(buf) {
	if (!buf || buf.length < 12) {
		return { hasVideoTrack: false, hasAudioTrack: false, isH264: false, isHevc: false }
	}
	const isH264 = buf.includes(Buffer.from('avc1')) || buf.includes(Buffer.from('avc3'))
	const isHevc = buf.includes(Buffer.from('hvc1')) || buf.includes(Buffer.from('hev1'))
	const hasVideoTrack = buf.includes(Buffer.from('vide')) || isH264 || isHevc
	const hasAudioTrack = buf.includes(Buffer.from('soun')) || buf.includes(Buffer.from('mp4a'))
	return { hasVideoTrack, hasAudioTrack, isH264, isHevc }
}

function sortVideoCandidates(urls) {
	return [...new Set((urls || []).map(normalizeUrl).filter(isValidVideoUrl))].sort(
		(a, b) => scoreVideoUrl(b) - scoreVideoUrl(a)
	)
}

async function fetchVideoBuffer(candidateUrls) {
	const list = sortVideoCandidates(candidateUrls)
	if (!list.length) throw new Error('没有可用的视频地址')

	let lastErr = null
	let hevcFallback = null

	for (const url of list) {
		try {
			let buffer = await fetchBuffer(url)

			const text = buffer.slice(0, 200).toString('utf8')
			if (text.trim().startsWith('{')) {
				const json = tryParseJson(buffer.toString('utf8'))
				const inner = pickBestVideoUrl(deepFindVideoUrls(json))
				if (inner && inner !== url) {
					buffer = await fetchBuffer(inner)
				}
			}

			if (!isMp4Buffer(buffer)) {
				lastErr = new Error(`非有效视频文件(${buffer.length}字节)`)
				continue
			}
			if (buffer.length < 50 * 1024) {
				lastErr = new Error(`视频过小(${buffer.length}字节)，可能未获取到真实地址`)
				continue
			}

			const info = analyzeMp4Buffer(buffer)
			if (info.hasAudioTrack && !info.hasVideoTrack) {
				lastErr = new Error('仅解析到音频流，无画面')
				continue
			}

			if (info.isH264) {
				return { buffer, codec: 'h264' }
			}

			if (info.isHevc) {
				if (!hevcFallback) hevcFallback = buffer
				continue
			}

			if (info.hasVideoTrack) {
				return { buffer, codec: 'unknown' }
			}

			lastErr = new Error('未检测到视频轨道')
		} catch (e) {
			lastErr = e
		}
	}

	if (hevcFallback) {
		return { buffer: hevcFallback, codec: 'hevc' }
	}

	throw lastErr || new Error('无法下载有效视频')
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

function isValidVideoUrl(u) {
	if (!u || typeof u !== 'string') return false
	const url = normalizeUrl(u)
	if (!url.startsWith('http')) return false
	if (/playwm|\.mp3(\?|$)|ies-music|\/music\//i.test(url)) return false
	if (/video_id=https?:\/\//i.test(url)) return false
	if (/aweme\/v1\/playwm/i.test(url)) return false
	if (/aweme\/v1\/play\/?\?/i.test(url)) return true
	return true
}

function scoreVideoUrl(u) {
	const url = normalizeUrl(u)
	if (!isValidVideoUrl(url)) return -1
	if (/h265|hevc|265|hvc/i.test(url)) return -20
	if (/h264|avc1|avc/i.test(url)) return 98
	if (/\.mp4(\?|$)/i.test(url)) return 100
	if (/douyinvod|zjcdn|bytecdn|tos-cn|ixigua|amemv\.com/i.test(url)) return 90
	if (/aweme\/v1\/play\/?\?/i.test(url)) return 85
	if (/\.m3u8/i.test(url)) return 50
	if (/video/i.test(url)) return 10
	return 0
}

function pickBestVideoUrl(urls) {
	let best = ''
	let bestScore = -1
	for (const raw of urls) {
		const url = normalizeUrl(raw)
		const score = scoreVideoUrl(url)
		if (score > bestScore) {
			bestScore = score
			best = url
		}
	}
	return best
}

function deepFindVideoUrls(obj, depth = 0, out = []) {
	if (!obj || depth > 14) return out
	if (typeof obj === 'string') {
		const u = normalizeUrl(obj)
		if (isValidVideoUrl(u) || /\.mp4|m3u8|douyinvod|play_addr/i.test(u)) {
			out.push(u)
		}
		return out
	}
	if (Array.isArray(obj)) {
		obj.forEach((item) => deepFindVideoUrls(item, depth + 1, out))
		return out
	}
	if (typeof obj === 'object') {
		if (Array.isArray(obj.h264)) {
			obj.h264.forEach((stream) => {
				if (stream && stream.masterUrl) out.push(normalizeUrl(stream.masterUrl))
				if (stream && stream.url) out.push(normalizeUrl(stream.url))
			})
		}
		if (obj.h264 && obj.h264.masterUrl) {
			out.push(normalizeUrl(obj.h264.masterUrl))
		}
		const candidates = [
			obj.play_addr_h264?.url_list?.[0],
			obj.play_addr?.url_list?.[0],
			obj.play_addr?.url_list?.[1],
			obj.download_addr?.url_list?.[0],
			obj.playApi,
			obj.masterUrl,
			obj.url
		]
		candidates.forEach((c) => {
			if (c) out.push(normalizeUrl(c))
		})
		for (const key of Object.keys(obj)) {
			if (key === 'h265' || key === 'hevc') continue
			deepFindVideoUrls(obj[key], depth + 1, out)
		}
	}
	return out
}

function deepFindVideoUrl(obj, depth = 0) {
	return pickBestVideoUrl(deepFindVideoUrls(obj, depth))
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
	fetchVideoBuffer,
	isMp4Buffer,
	analyzeMp4Buffer,
	sortVideoCandidates,
	extractBetween,
	tryParseJson,
	normalizeUrl,
	isValidVideoUrl,
	pickBestVideoUrl,
	deepFindVideoUrls,
	deepFindVideoUrl,
	deepFindImages,
	filterImageUrls,
	uniqueUrls,
	UA,
	DESKTOP_UA
}
