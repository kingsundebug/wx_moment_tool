const cloud = require('wx-server-sdk')
const { detectPlatform, parse } = require('./parsers')
const { fetchVideoBuffer, fetchBuffer, isMp4Buffer } = require('./parsers/http')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const DAILY_LIMIT = 30
const PARSE_LOGS = 'parse_logs'

function isCollectionMissingError(err) {
	const msg = String((err && (err.message || err.errMsg)) || err || '')
	return /502005|DATABASE_COLLECTION_NOT_EXIST|not exist|Db or Table not exist/i.test(msg)
}

async function ensureParseLogsCollection() {
	try {
		await db.createCollection(PARSE_LOGS)
	} catch (e) {
		if (!isCollectionMissingError(e)) {
			const msg = String(e.message || e.errMsg || '')
			if (!/exists|已存在|ResourceExist|502001/i.test(msg)) {
				console.warn('createCollection parse_logs:', msg)
			}
		}
	}
}

async function checkRateLimit(openid) {
	const today = new Date().toISOString().slice(0, 10)
	const col = db.collection(PARSE_LOGS)

	let total = 0
	try {
		const res = await col.where({ _openid: openid, date: today }).count()
		total = res.total
	} catch (e) {
		if (!isCollectionMissingError(e)) throw e
		await ensureParseLogsCollection()
		const res = await col.where({ _openid: openid, date: today }).count()
		total = res.total
	}

	if (total >= DAILY_LIMIT) {
		throw new Error(`今日解析次数已达上限（${DAILY_LIMIT}次）`)
	}
	await col.add({ data: { date: today, createdAt: Date.now() } })
}

async function uploadVideoBuffer(buffer) {
	if (!buffer || buffer.length < 20 * 1024) {
		throw new Error('视频文件无效或过小')
	}
	if (!isMp4Buffer(buffer)) {
		throw new Error('下载内容不是有效 MP4 视频')
	}
	const cloudPath = `media/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`
	const upload = await cloud.uploadFile({
		cloudPath,
		fileContent: buffer
	})
	return { fileID: upload.fileID, size: buffer.length }
}

async function prefetchVideo(data) {
	const candidates = data.videoCandidates || (data.videoUrl ? [data.videoUrl] : [])
	if (!candidates.length) return data
	const { buffer, codec } = await fetchVideoBuffer(candidates)
	const uploaded = await uploadVideoBuffer(buffer)
	data.videoFileID = uploaded.fileID
	data.videoSize = uploaded.size
	data.videoCodec = codec
	return data
}

async function proxyDownload(url, type = 'image', candidates = []) {
	if (!url || !/^https?:\/\//i.test(url)) {
		throw new Error('无效的资源链接')
	}
	let buffer
	let codec = 'unknown'
	if (type === 'video') {
		const res = await fetchVideoBuffer(candidates.length ? candidates : [url])
		buffer = res.buffer
		codec = res.codec
	} else {
		buffer = await fetchBuffer(url)
	}
	if (!buffer || buffer.length < 512) {
		throw new Error('资源为空或已失效，请重新解析')
	}
	const ext = type === 'video' ? 'mp4' : 'jpg'
	const cloudPath = `media/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
	const upload = await cloud.uploadFile({
		cloudPath,
		fileContent: buffer
	})
	return { fileID: upload.fileID, size: buffer.length, codec }
}

exports.main = async (event) => {
	const { action, url, type } = event
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID

	if (action === 'proxyDownload') {
		if (!url) return { code: 400, message: '缺少 url' }
		try {
			const data = await proxyDownload(url, type, event.candidates || [])
			return { code: 0, data }
		} catch (e) {
			console.error('proxyDownload error:', e)
			return { code: 500, message: e.message || '代理下载失败' }
		}
	}

	if (!url) {
		return { code: 400, message: '缺少 url 参数' }
	}

	try {
		await checkRateLimit(openid)
		const platform = detectPlatform(url)
		if (platform === 'unknown') {
			return { code: 400, message: '暂不支持该平台，目前支持抖音、小红书' }
		}
		const data = await parse(platform, url)
		if (data.videoUrl || (data.videoCandidates && data.videoCandidates.length)) {
			await prefetchVideo(data)
		}
		return { code: 0, data }
	} catch (e) {
		console.error('parseMedia error:', e)
		return { code: 500, message: e.message || '解析失败，请稍后重试' }
	}
}
