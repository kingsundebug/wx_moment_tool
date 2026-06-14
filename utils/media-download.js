import { callCloud } from '@/utils/cloud.js'

const DOWNLOAD_TIMEOUT = 120000
const MIN_VIDEO_SIZE = 20 * 1024

function withTimeout(promise, ms, message) {
	return Promise.race([
		promise,
		new Promise((_, reject) => {
			setTimeout(() => reject(new Error(message)), ms)
		})
	])
}

export function validateLocalFile(filePath, minSize = MIN_VIDEO_SIZE) {
	return new Promise((resolve, reject) => {
		uni.getFileInfo({
			filePath,
			success: (res) => {
				if (!res.size || res.size < minSize) {
					reject(new Error(`文件无效（${res.size || 0} 字节）`))
				} else {
					resolve(filePath)
				}
			},
			fail: () => reject(new Error('无法读取本地文件'))
		})
	})
}

function needsProxy(url) {
	if (!url) return true
	return /douyin|douyinvod|snssdk|ixigua|xiaohongshu|xhs|xhscdn|amemv/i.test(url)
}

function directDownload(url) {
	return new Promise((resolve, reject) => {
		uni.downloadFile({
			url,
			timeout: 60000,
			success: (res) => {
				if (res.statusCode === 200 && res.tempFilePath) {
					resolve(res.tempFilePath)
				} else {
					reject(new Error(`下载失败 (${res.statusCode || 'unknown'})`))
				}
			},
			fail: reject
		})
	})
}

export async function downloadFromCloudFile(fileID, minSize = MIN_VIDEO_SIZE) {
	// #ifdef MP-WEIXIN
	const dl = await new Promise((resolve, reject) => {
		wx.cloud.downloadFile({
			fileID,
			success: resolve,
			fail: reject
		})
	})
	return validateLocalFile(dl.tempFilePath, minSize)
	// #endif
	// #ifndef MP-WEIXIN
	throw new Error('仅支持微信小程序')
	// #endif
}

async function proxyDownload(url, type = 'image', candidates = []) {
	const res = await callCloud('parseMedia', {
		action: 'proxyDownload',
		url,
		type,
		candidates
	})
	if (res.code !== 0) throw new Error(res.message || '代理下载失败')
	return downloadFromCloudFile(res.data.fileID, type === 'video' ? MIN_VIDEO_SIZE : 512)
}

export async function downloadMedia(url, type = 'image', candidates = []) {
	const task =
		// #ifdef MP-WEIXIN
		type === 'video' || needsProxy(url)
			? proxyDownload(url, type, candidates)
			: directDownload(url)
				.then((path) => validateLocalFile(path, 512))
				.catch(() => proxyDownload(url, type, candidates))
		// #endif
		// #ifndef MP-WEIXIN
		directDownload(url)
		// #endif

	return withTimeout(task, DOWNLOAD_TIMEOUT, '下载超时，请稍后重试')
}

export async function saveMediaToAlbum(url, type = 'image', candidates = []) {
	const path = await downloadMedia(url, type, candidates)
	return new Promise((resolve, reject) => {
		const saveFn = type === 'video' ? uni.saveVideoToPhotosAlbum : uni.saveImageToPhotosAlbum
		saveFn({ filePath: path, success: resolve, fail: reject })
	})
}
