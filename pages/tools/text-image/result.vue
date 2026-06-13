<template>
	<view class="page">
		<view class="preview-panel">
			<scroll-view scroll-y class="preview-scroll">
				<view class="preview-inner">
					<view v-if="status === 'loading'" class="preview-placeholder">
						<text class="preview-placeholder__text">正在生成图片…</text>
						<text class="preview-placeholder__hint">{{ loadingHint }}</text>
					</view>
					<image
						v-else-if="resultPath"
						:src="resultPath"
						class="preview-img"
						:class="{ 'preview-img--show': status === 'done' }"
						mode="widthFix"
						@tap="previewImage"
					/>
				</view>
			</scroll-view>
			<text class="meta-count">{{ charCount }} 字</text>
		</view>

		<view class="footer">
			<button
				class="btn-native btn-outline"
				:disabled="status === 'loading'"
				hover-class="btn-hover"
				@tap="onRegenerate"
			>
				重新生成
			</button>
			<button
				class="btn-native btn-primary"
				:disabled="!resultPath || status === 'loading'"
				hover-class="btn-hover"
				@tap="onSave"
			>
				保存到相册
			</button>
		</view>

		<canvas
			canvas-id="textImageCanvas"
			id="textImageCanvas"
			class="offscreen-canvas"
			:width="canvasW"
			:height="canvasH"
			:style="{ width: canvasW + 'px', height: canvasH + 'px' }"
		/>
	</view>
</template>

<script>
import templatesData from '@/static/text-image/templates.json'
import {
	renderTextImage,
	saveTextImage,
	calcCanvasSize
} from '@/utils/text-image.js'
import { getTextImageSession } from '@/utils/text-image-session.js'

const LOADING_HINTS = ['排版文字中', '绘制背景', '渲染模板', '导出图片']

export default {
	data() {
		return {
			session: null,
			template: null,
			resultPath: '',
			status: 'loading',
			loadingHint: '排版文字中',
			canvasW: 750,
			canvasH: 1000,
			hintTimer: null
		}
	},
	computed: {
		charCount() {
			return (this.session?.inputText || '').replace(/\s/g, '').length
		}
	},
	onLoad() {
		const session = getTextImageSession()
		if (!session || !session.inputText || !session.templateId) {
			uni.showToast({ title: '请先填写配图设置', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 1200)
			return
		}

		const list =
			session.mode === 'short' ? templatesData.short || [] : templatesData.long || []
		const template = list.find((t) => t.id === session.templateId)
		if (!template) {
			uni.showToast({ title: '模板不存在', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 1200)
			return
		}

		this.session = session
		this.template = template
		this.startGenerate()
	},
	onUnload() {
		this.stopHintRotation()
	},
	methods: {
		stopHintRotation() {
			if (this.hintTimer) {
				clearInterval(this.hintTimer)
				this.hintTimer = null
			}
		},
		startHintRotation() {
			this.stopHintRotation()
			let index = 0
			this.loadingHint = LOADING_HINTS[0]
			this.hintTimer = setInterval(() => {
				index = (index + 1) % LOADING_HINTS.length
				this.loadingHint = LOADING_HINTS[index]
			}, 900)
		},
		async startGenerate() {
			this.status = 'loading'
			this.resultPath = ''
			this.startHintRotation()

			try {
				const size = calcCanvasSize(
					this.session.inputText,
					this.template,
					this.session.mode
				)
				this.canvasW = size.width
				this.canvasH = size.height
				await this.$nextTick()
				await new Promise((r) => setTimeout(r, 300))

				const res = await renderTextImage(
					this.session.inputText,
					this.template,
					this.session.mode,
					{
						canvasId: 'textImageCanvas',
						component: this
					}
				)
				this.resultPath = res.tempFilePath
				this.status = 'done'
			} catch (e) {
				this.status = 'error'
				uni.showModal({
					title: '生成失败',
					content: e.message || '请稍后重试',
					showCancel: false,
					success: () => {
						if (!this.resultPath) {
							uni.navigateBack()
						}
					}
				})
			} finally {
				this.stopHintRotation()
			}
		},
		onRegenerate() {
			if (this.status === 'loading') {
				return
			}
			this.startGenerate()
		},
		previewImage() {
			if (!this.resultPath) return
			uni.previewImage({ urls: [this.resultPath] })
		},
		async onSave() {
			if (!this.resultPath) return
			try {
				await saveTextImage(this.resultPath)
				uni.showToast({ title: '已保存到相册', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: '请授权相册权限', icon: 'none' })
			}
		}
	}
}
</script>

<style scoped>
.page {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	padding: 24rpx 32rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	background-color: #f5f6f8;
}

.preview-panel {
	position: relative;
	flex: 1;
	min-height: 0;
	margin-bottom: 24rpx;
	padding: 28rpx;
	background-color: #ffffff;
	border-radius: 20rpx;
	overflow: hidden;
}

.preview-scroll {
	height: calc(100vh - 280rpx);
	min-height: 520rpx;
}

.preview-inner {
	display: flex;
	justify-content: center;
	padding-bottom: 48rpx;
}

.preview-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 400rpx;
	width: 100%;
}

.preview-placeholder__text {
	font-size: 28rpx;
	color: #8c8c8c;
}

.preview-placeholder__hint {
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #bfbfbf;
}

.preview-img {
	display: block;
	width: 100%;
	border-radius: 12rpx;
	background: #f5f6f8;
	opacity: 0;
	transition: opacity 0.35s ease;
}

.preview-img--show {
	opacity: 1;
}

.meta-count {
	position: absolute;
	right: 28rpx;
	bottom: 20rpx;
	font-size: 22rpx;
	color: #bfbfbf;
}

.footer {
	flex-shrink: 0;
	display: flex;
	gap: 16rpx;
	padding-bottom: env(safe-area-inset-bottom);
}

.btn-native {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	padding: 0;
	font-size: 30rpx;
	font-weight: 500;
	line-height: 88rpx;
	border: none;
	border-radius: 44rpx;
}

.btn-native::after {
	border: none;
}

.btn-primary {
	color: #ffffff;
	background-color: #07c160;
}

.btn-primary[disabled] {
	color: #ffffff;
	background-color: #91d5a8;
}

.btn-outline {
	color: #07c160;
	background-color: #ffffff;
	border: 2rpx solid #07c160;
}

.btn-outline[disabled] {
	color: #91d5a8;
	border-color: #91d5a8;
}

.btn-hover {
	opacity: 0.85;
}

.offscreen-canvas {
	position: fixed;
	left: -9999px;
	top: 0;
	width: 1px;
	height: 1px;
	opacity: 0;
	pointer-events: none;
}
</style>
