import { callCloud } from '@/utils/cloud.js'

export async function downloadMedia(url, type = 'image') {
	try {
		return await directDownload(url)
	} catch (e) {
		// #ifdef MP-WEIXIN
		const res = await callCloud('parseMedia', { action: 'proxyDownload', url, type })
		if (res.code !== 0) throw new Error(res.message || '代理下载失败')
		const dl = await new Promise((resolve, reject) => {
			wx.cloud.downloadFile({
				fileID: res.data.fileID,
				success: resolve,
				fail: reject
			})
		})
		return dl.tempFilePath
		// #endif
		// #ifndef MP-WEIXIN
		throw e
		// #endif
	}
}

function directDownload(url) {
	return new Promise((resolve, reject) => {
		uni.downloadFile({
			url,
			success: (res) => {
				if (res.statusCode === 200) resolve(res.tempFilePath)
				else reject(new Error('下载失败'))
			},
			fail: reject
		})
	})
}

export async function saveMediaToAlbum(url, type = 'image') {
	const path = await downloadMedia(url, type)
	return new Promise((resolve, reject) => {
		const saveFn = type === 'video' ? uni.saveVideoToPhotosAlbum : uni.saveImageToPhotosAlbum
		saveFn({ filePath: path, success: resolve, fail: reject })
	})
}
