<template>
	<view class="page">
		<view v-if="!paths.length" class="empty" @tap="chooseImages">
			<view class="empty__icon-wrap">
				<text class="empty__icon">🖼</text>
			</view>
			<text class="empty__title">选择 2～9 张图片</text>
			<text class="empty__hint">按顺序纵向拼接成长图</text>
		</view>

		<template v-else>
			<view class="toolbar">
				<button class="toolbar__btn" size="mini" @tap="chooseImages">添加 ({{ paths.length }}/9)</button>
				<button class="toolbar__btn" size="mini" @tap="clear">清空</button>
			</view>

			<view class="settings">
				<view class="setting-row">
					<text class="setting-label">间距</text>
					<slider
						:value="gap"
						min="0"
						max="30"
						step="2"
						activeColor="#07c160"
						block-size="16"
						@changing="onGapChange"
						@change="onGapChange"
					/>
					<text class="setting-val">{{ gap }}px</text>
				</view>
				<view class="setting-row">
					<text class="setting-label">背景</text>
					<view class="bg-options">
						<view
							v-for="c in bgOptions"
							:key="c.value"
							class="bg-opt"
							:class="{ active: bgColor === c.value }"
							:style="{ background: c.value, border: c.border }"
							@tap="bgColor = c.value"
						/>
					</view>
				</view>
			</view>

			<view class="list">
				<view v-for="(p, i) in paths" :key="p + i" class="row">
					<text class="row-index">{{ i + 1 }}</text>
					<image :src="p" class="thumb" mode="aspectFill" />
					<view class="row-actions">
						<button size="mini" :disabled="i === 0" @tap="move(i, -1)">↑</button>
						<button size="mini" :disabled="i === paths.length - 1" @tap="move(i, 1)">↓</button>
						<button size="mini" @tap="remove(i)">删</button>
					</view>
				</view>
			</view>

			<canvas
				canvas-id="stitchCanvas"
				class="hidden-canvas"
				:style="{ width: canvasW + 'px', height: canvasH + 'px' }"
			/>

			<button
				v-if="paths.length >= 2"
				class="btn-primary"
				:loading="processing"
				@tap="stitch"
			>拼长图</button>
		</template>

		<view v-if="resultPath" class="result-section">
			<text class="result-label">拼接预览</text>
			<image :src="resultPath" class="result" mode="widthFix" />
			<button class="btn-primary" @tap="save">保存到相册</button>
		</view>
	</view>
</template>

<script>
import { calcStitchHeight, stitchImages, saveStitchResult } from '@/utils/long-stitch.js'

export default {
	data() {
		return {
			paths: [],
			canvasW: 750,
			canvasH: 750,
			resultPath: '',
			processing: false,
			gap: 0,
			bgColor: '#ffffff',
			bgOptions: [
				{ value: '#ffffff', border: '1rpx solid #eee' },
				{ value: '#f5f6f8', border: 'none' },
				{ value: '#1a1a1a', border: 'none' }
			]
		}
	},
	methods: {
		chooseImages() {
			if (this.paths.length >= 9) {
				return uni.showToast({ title: '最多 9 张', icon: 'none' })
			}
			uni.chooseImage({
				count: 9 - this.paths.length,
				success: (res) => {
					this.paths = this.paths.concat(res.tempFilePaths).slice(0, 9)
					this.resultPath = ''
				}
			})
		},
		clear() {
			this.paths = []
			this.resultPath = ''
		},
		onGapChange(e) {
			this.gap = e.detail.value
			this.resultPath = ''
		},
		move(i, delta) {
			const j = i + delta
			if (j < 0 || j >= this.paths.length) return
			const arr = [...this.paths]
			;[arr[i], arr[j]] = [arr[j], arr[i]]
			this.paths = arr
			this.resultPath = ''
		},
		remove(i) {
			this.paths.splice(i, 1)
			this.resultPath = ''
		},
		async stitch() {
			if (this.paths.length < 2 || this.processing) return
			this.processing = true
			try {
				const layout = await calcStitchHeight(this.paths, {
					canvasW: this.canvasW,
					gap: this.gap
				})
				this.canvasH = layout.height
				await this.$nextTick()
				const res = await stitchImages(this.paths, {
					canvasId: 'stitchCanvas',
					component: this,
					canvasW: this.canvasW,
					gap: this.gap,
					bgColor: this.bgColor,
					layout
				})
				this.resultPath = res.tempFilePath
				uni.showToast({ title: '拼接完成', icon: 'success' })
			} catch (e) {
				uni.showModal({
					title: '拼接失败',
					content: e.message || '请减少图片数量后重试',
					showCancel: false
				})
			} finally {
				this.processing = false
			}
		},
		async save() {
			try {
				await saveStitchResult(this.resultPath)
				uni.showToast({ title: '已保存', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: '请授权相册权限', icon: 'none' })
			}
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
	padding-bottom: 40rpx;
}
.empty {
	background: #fff;
	border-radius: 20rpx;
	height: 420rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.empty__icon-wrap {
	width: 120rpx;
	height: 120rpx;
	background: #e8f4ff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
}
.empty__icon {
	font-size: 56rpx;
}
.empty__title {
	font-size: 30rpx;
	color: #333;
	font-weight: 500;
}
.empty__hint {
	font-size: 24rpx;
	color: #999;
	margin-top: 12rpx;
}
.toolbar {
	display: flex;
	gap: 16rpx;
	margin-bottom: 20rpx;
}
.toolbar__btn {
	background: #fff !important;
	color: #333 !important;
}
.settings {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}
.setting-row {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}
.setting-row:last-child {
	margin-bottom: 0;
}
.setting-label {
	font-size: 26rpx;
	color: #666;
	width: 80rpx;
	flex-shrink: 0;
}
.setting-row slider {
	flex: 1;
	margin: 0 16rpx;
}
.setting-val {
	font-size: 24rpx;
	color: #999;
	width: 64rpx;
	text-align: right;
}
.bg-options {
	display: flex;
	gap: 20rpx;
}
.bg-opt {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
}
.bg-opt.active {
	box-shadow: 0 0 0 4rpx #07c160;
}
.list {
	background: #fff;
	border-radius: 16rpx;
	padding: 8rpx 16rpx;
	margin-bottom: 24rpx;
}
.row {
	display: flex;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.row:last-child {
	border-bottom: none;
}
.row-index {
	width: 40rpx;
	font-size: 24rpx;
	color: #07c160;
	font-weight: 600;
}
.thumb {
	width: 100rpx;
	height: 100rpx;
	border-radius: 8rpx;
	margin-right: 16rpx;
}
.row-actions {
	margin-left: auto;
	display: flex;
	gap: 8rpx;
}
.hidden-canvas {
	position: fixed;
	left: -9999px;
	top: -9999px;
}
.btn-primary {
	background: #07c160 !important;
	color: #fff !important;
	border-radius: 12rpx;
	margin-bottom: 20rpx;
}
.result-section {
	margin-top: 8rpx;
}
.result-label {
	font-size: 26rpx;
	color: #666;
	display: block;
	margin-bottom: 12rpx;
}
.result {
	width: 100%;
	border-radius: 12rpx;
	margin-bottom: 20rpx;
	background: #fff;
}
</style>
