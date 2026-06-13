import { resolveStaticImageSrc } from '@/utils/text-image-path.js'

const MAX_LONG_HEIGHT = 12000
const SHORT_MAX_CHARS = 80
const LONG_MAX_CHARS = 3000

function loadLocalImage(src) {
	const resolvedSrc = resolveStaticImageSrc(src)
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('背景图加载超时')), 8000)
		uni.getImageInfo({
			src: resolvedSrc,
			success: (res) => {
				clearTimeout(timer)
				resolve(res.path)
			},
			fail: (err) => {
				clearTimeout(timer)
				reject(new Error(err?.errMsg || '背景图加载失败'))
			}
		})
	})
}

async function flushCanvas(ctx, reserve = false, delayMs = 80) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('图片渲染超时，请重试')), 10000)
		ctx.draw(reserve, () => {
			clearTimeout(timer)
			setTimeout(resolve, delayMs)
		})
	})
}

function waitCanvasDraw(ctx, delayMs = 300) {
	return flushCanvas(ctx, false, delayMs)
}

function exportCanvas(canvasId, width, height, component) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('导出图片超时，请重试')), 10000)
		uni.canvasToTempFilePath(
			{
				canvasId,
				x: 0,
				y: 0,
				width,
				height,
				destWidth: width,
				destHeight: height,
				fileType: 'png',
				success: (res) => {
					clearTimeout(timer)
					resolve(res)
				},
				fail: (err) => {
					clearTimeout(timer)
					reject(new Error(err?.errMsg || '导出图片失败'))
				}
			},
			component
		)
	})
}

async function drawBackground(ctx, w, h, bg) {
	if (bg.type === 'image') {
		const path = await loadLocalImage(bg.src)
		ctx.drawImage(path, 0, 0, w, h)
		if (bg.overlay) {
			ctx.setFillStyle(bg.overlay)
			ctx.fillRect(0, 0, w, h)
		}
		return
	}

	if (bg.type === 'gradient' && bg.colors && bg.colors.length >= 2) {
		const grd = bg.vertical
			? ctx.createLinearGradient(0, 0, 0, h)
			: ctx.createLinearGradient(0, 0, w, 0)
		bg.colors.forEach((color, i) => {
			const stop = bg.colors.length === 1 ? 0 : i / (bg.colors.length - 1)
			grd.addColorStop(stop, color)
		})
		ctx.setFillStyle(grd)
	} else {
		ctx.setFillStyle(bg.color || '#ffffff')
	}
	ctx.fillRect(0, 0, w, h)
}

function wrapLines(ctx, text, maxWidth, fontSize) {
	ctx.setFontSize(fontSize)
	const lines = []
	const paragraphs = String(text).split('\n')

	for (const para of paragraphs) {
		if (!para) {
			lines.push('')
			continue
		}
		let line = ''
		for (let i = 0; i < para.length; i++) {
			const ch = para[i]
			const test = line + ch
			let width = 0
			try {
				width = ctx.measureText(test).width
			} catch (e) {
				width = test.length * fontSize * 0.55
			}
			if (width > maxWidth && line) {
				lines.push(line)
				line = ch
			} else {
				line = test
			}
		}
		if (line) lines.push(line)
	}
	return lines
}

function getDecorationOffset(template) {
	const deco = template.decoration
	if (deco === 'quote') return 80
	if (deco === 'tag') return 56
	if (deco === 'header') return 88
	if (deco === 'line') return 40
	return 24
}

function drawDecoration(ctx, template, w, startY) {
	const deco = template.decoration
	const accent = template.accentColor || template.textColor

	if (deco === 'quote') {
		ctx.setFillStyle(accent)
		ctx.setFontSize(120)
		ctx.setTextAlign('left')
		ctx.fillText('“', template.padding, startY + 20)
		return startY + 60
	}

	if (deco === 'line') {
		ctx.setStrokeStyle(accent)
		ctx.setLineWidth(3)
		const lineW = 80
		const x = template.align === 'center' ? (w - lineW) / 2 : template.padding
		ctx.beginPath()
		ctx.moveTo(x, startY)
		ctx.lineTo(x + lineW, startY)
		ctx.stroke()
		return startY + 32
	}

	if (deco === 'tag' && template.tagText) {
		ctx.setFillStyle(accent)
		ctx.setFontSize(24)
		ctx.setTextAlign('center')
		ctx.fillText(template.tagText, w / 2, startY + 24)
		return startY + 48
	}

	if (deco === 'header' && template.headerText) {
		ctx.setFillStyle(accent)
		ctx.setFontSize(28)
		ctx.setTextAlign('left')
		ctx.fillText(template.headerText, template.padding, startY + 28)
		ctx.setStrokeStyle(accent)
		ctx.setLineWidth(4)
		ctx.beginPath()
		ctx.moveTo(template.padding, startY + 44)
		ctx.lineTo(template.padding + 48, startY + 44)
		ctx.stroke()
		return startY + 72
	}

	return startY + 16
}

function measureTextWidth(ctx, text, fontSize) {
	ctx.setFontSize(fontSize)
	try {
		return ctx.measureText(text).width
	} catch (e) {
		return text.length * fontSize * 0.55
	}
}

function findBestFontSize(ctx, text, maxWidth, maxHeight, minSize = 28, maxSize = 160) {
	let low = minSize
	let high = maxSize
	let best = minSize

	while (low <= high) {
		const mid = Math.floor((low + high) / 2)
		const lineHeight = Math.round(mid * 1.42)
		const lines = wrapLines(ctx, text, maxWidth, mid)
		const blockHeight = lines.length * lineHeight
		const fitsWidth = lines.every((line) => measureTextWidth(ctx, line, mid) <= maxWidth)
		const fitsHeight = blockHeight <= maxHeight

		if (fitsWidth && fitsHeight) {
			best = mid
			low = mid + 1
		} else {
			high = mid - 1
		}
	}

	return best
}

function drawShortTextFill(ctx, lines, template, w, h, fontSize, lineHeight) {
	const blockHeight = lines.length * lineHeight
	const startY = (h - blockHeight) / 2 + lineHeight * 0.82
	const slantStep = fontSize * 0.12

	ctx.setFillStyle(template.textColor)
	ctx.setFontSize(fontSize)
	ctx.setTextAlign('center')

	lines.forEach((line, index) => {
		const x = w / 2 + (index - (lines.length - 1) / 2) * slantStep
		const y = startY + index * lineHeight
		ctx.fillText(line, x, y)
	})
}
function drawTextBlock(ctx, lines, template, w, startY) {
	const { textColor, fontSize, lineHeight, align, padding } = template
	ctx.setFillStyle(textColor)
	ctx.setFontSize(fontSize)
	ctx.setTextAlign(align === 'center' ? 'center' : 'left')

	let y = startY
	const x = align === 'center' ? w / 2 : padding

	lines.forEach((line) => {
		ctx.fillText(line, x, y)
		y += lineHeight
	})

	return y
}

export function calcCanvasSize(text, template, mode) {
	const w = template.width || 750
	const padding = template.padding || 56
	const fontSize = template.fontSize || 30
	const lineHeight = template.lineHeight || 48
	const maxWidth = w - padding * 2

	const charPerLine = Math.max(8, Math.floor(maxWidth / (fontSize * 0.55)))
	const paragraphs = String(text).split('\n')
	let lineCount = 0
	paragraphs.forEach((para) => {
		if (!para) {
			lineCount += 1
			return
		}
		lineCount += Math.max(1, Math.ceil(para.length / charPerLine))
	})

	const decoOffset = getDecorationOffset(template)
	const textH = lineCount * lineHeight
	const bottomPad = padding + 40

	if (mode === 'short') {
		return { width: w, height: template.height || 1000 }
	}

	let h = decoOffset + textH + bottomPad
	h = Math.max(template.minHeight || 1200, h)
	if (h > MAX_LONG_HEIGHT) {
		throw new Error(`文字过长，请删减内容（当前约 ${h}px）`)
	}
	return { width: w, height: h }
}

export async function renderTextImage(text, template, mode, { canvasId, component } = {}) {
	const trimmed = String(text || '').trim()
	if (!trimmed) {
		throw new Error('请输入文字内容')
	}
	if (mode === 'short' && trimmed.length > SHORT_MAX_CHARS) {
		throw new Error(`短文字建议不超过 ${SHORT_MAX_CHARS} 字`)
	}
	if (mode === 'long' && trimmed.length > LONG_MAX_CHARS) {
		throw new Error(`长文字建议不超过 ${LONG_MAX_CHARS} 字`)
	}

	const { width, height } = calcCanvasSize(trimmed, template, mode)
	const ctx = uni.createCanvasContext(canvasId, component)

	await drawBackground(ctx, width, height, template.bg).catch((err) => {
		if (template.bg?.type === 'image') {
			ctx.setFillStyle('#F5F6F8')
			ctx.fillRect(0, 0, width, height)
			console.warn('背景图加载失败，已使用默认底色', err)
			return
		}
		throw err
	})

	const padding = template.padding || 56

	if (mode === 'short') {
		const maxWidth = width - padding * 2
		const maxHeight = height - padding * 2
		const fontSize = findBestFontSize(ctx, trimmed, maxWidth, maxHeight)
		const lineHeight = Math.round(fontSize * 1.42)
		const lines = wrapLines(ctx, trimmed, maxWidth, fontSize)
		drawShortTextFill(ctx, lines, template, width, height, fontSize, lineHeight)
	} else {
		const contentStart = drawDecoration(ctx, template, width, padding)
		const maxWidth = width - padding * 2
		const lines = wrapLines(ctx, trimmed, maxWidth, template.fontSize)
		drawTextBlock(ctx, lines, template, width, contentStart)

		if (template.decoration === 'line') {
			const accent = template.accentColor || template.textColor
			ctx.setStrokeStyle(accent)
			ctx.setLineWidth(3)
			const lineW = 80
			const x = template.align === 'center' ? (width - lineW) / 2 : padding
			const bottomY = height - padding
			ctx.beginPath()
			ctx.moveTo(x, bottomY)
			ctx.lineTo(x + lineW, bottomY)
			ctx.stroke()
		}
	}

	await waitCanvasDraw(ctx)

	const res = await exportCanvas(canvasId, width, height, component)

	return {
		tempFilePath: res.tempFilePath,
		width,
		height
	}
}

export async function saveTextImage(tempFilePath) {
	return new Promise((resolve, reject) => {
		uni.saveImageToPhotosAlbum({
			filePath: tempFilePath,
			success: resolve,
			fail: reject
		})
	})
}

export { SHORT_MAX_CHARS, LONG_MAX_CHARS }
