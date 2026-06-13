const cloud = require('wx-server-sdk')
const { detectPlatform, parse } = require('./parsers')
const { fetchBuffer } = require('./parsers/http')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const DAILY_LIMIT = 30

async function checkRateLimit(openid) {
	const today = new Date().toISOString().slice(0, 10)
	const col = db.collection('parse_logs')
	const { total } = await col.where({ _openid: openid, date: today }).count()
	if (total >= DAILY_LIMIT) {
		throw new Error(`今日解析次数已达上限（${DAILY_LIMIT}次）`)
	}
	await col.add({ data: { date: today, createdAt: Date.now() } })
}

async function proxyDownload(url, type = 'image') {
	const buffer = await fetchBuffer(url)
	const ext = type === 'video' ? 'mp4' : 'jpg'
	const cloudPath = `media/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
	const upload = await cloud.uploadFile({
		cloudPath,
		fileContent: buffer
	})
	return { fileID: upload.fileID }
}

exports.main = async (event) => {
	const { action, url, type } = event
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID

	if (action === 'proxyDownload') {
		if (!url) return { code: 400, message: '缺少 url' }
		try {
			const data = await proxyDownload(url, type)
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
		return { code: 0, data }
	} catch (e) {
		console.error('parseMedia error:', e)
		return { code: 500, message: e.message || '解析失败，请稍后重试' }
	}
}
