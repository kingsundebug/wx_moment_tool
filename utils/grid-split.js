/**
 * 将正方形图片切成 9 张，串行导出避免 canvas 冲突
 */
export function splitImageToGrid(src, canvasId, component, canvasSize = 750) {
	return new Promise((resolve, reject) => {
		uni.getImageInfo({
			src,
			success: (info) => {
				const side = Math.min(info.width, info.height)
				const sx = (info.width - side) / 2
				const sy = (info.height - side) / 2
				const cellSrc = side / 3
				const destCell = Math.floor(canvasSize / 3)
				const urls = new Array(9)

				const exportCell = (index) => {
					if (index >= 9) return resolve(urls)

					const row = Math.floor(index / 3)
					const col = index % 3
					const ctx = uni.createCanvasContext(canvasId, component)

					ctx.clearRect(0, 0, canvasSize, canvasSize)
					ctx.drawImage(
						src,
						sx + col * cellSrc,
						sy + row * cellSrc,
						cellSrc,
						cellSrc,
						0,
						0,
						canvasSize,
						canvasSize
					)

					ctx.draw(false, () => {
						setTimeout(() => {
							uni.canvasToTempFilePath(
								{
									canvasId,
									destWidth: destCell,
									destHeight: destCell,
									success: (res) => {
										urls[index] = res.tempFilePath
										exportCell(index + 1)
									},
									fail: reject
								},
								component
							)
						}, 250)
					})
				}

				exportCell(0)
			},
			fail: reject
		})
	})
}

export async function saveImagesToAlbum(paths) {
	for (const path of paths) {
		await new Promise((resolve, reject) => {
			uni.saveImageToPhotosAlbum({ filePath: path, success: resolve, fail: reject })
		})
	}
}
