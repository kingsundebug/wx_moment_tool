const MAX_CANVAS_HEIGHT = 12000

function getImageInfo(src) {
	return new Promise((resolve, reject) => {
		uni.getImageInfo({ src, success: resolve, fail: reject })
	})
}

/**
 * 根据图片路径预计算 canvas 高度
 */
export async function calcStitchHeight(paths, { canvasW = 750, gap = 0 } = {}) {
	if (!paths || paths.length < 2) {
		throw new Error('至少需要 2 张图片')
	}

	const infos = await Promise.all(paths.map(getImageInfo))
	let totalH = 0
	const scaled = infos.map((info) => {
		const drawH = Math.round((info.height / info.width) * canvasW)
		totalH += drawH + gap
		return { drawH }
	})
	totalH -= gap

	if (totalH > MAX_CANVAS_HEIGHT) {
		throw new Error(`图片总高度过大，请减少图片数量（当前约 ${totalH}px）`)
	}

	return { height: totalH, scaled }
}

/**
 * 纵向拼接多张图片
 */
export async function stitchImages(
	paths,
	{ canvasId, component, canvasW = 750, gap = 0, bgColor = '#ffffff', layout } = {}
) {
	if (!paths || paths.length < 2) {
		throw new Error('至少需要 2 张图片')
	}

	const { height: totalH, scaled } =
		layout || (await calcStitchHeight(paths, { canvasW, gap }))

	const ctx = uni.createCanvasContext(canvasId, component)
	ctx.setFillStyle(bgColor)
	ctx.fillRect(0, 0, canvasW, totalH)

	let y = 0
	scaled.forEach((item, idx) => {
		ctx.drawImage(paths[idx], 0, y, canvasW, item.drawH)
		y += item.drawH + gap
	})

	await new Promise((resolve) => {
		ctx.draw(false, () => setTimeout(resolve, 500))
	})

	const res = await new Promise((resolve, reject) => {
		uni.canvasToTempFilePath(
			{
				canvasId,
				destWidth: canvasW,
				destHeight: totalH,
				success: resolve,
				fail: reject
			},
			component
		)
	})

	return {
		tempFilePath: res.tempFilePath,
		width: canvasW,
		height: totalH
	}
}

export async function saveStitchResult(tempFilePath) {
	return new Promise((resolve, reject) => {
		uni.saveImageToPhotosAlbum({
			filePath: tempFilePath,
			success: resolve,
			fail: reject
		})
	})
}
