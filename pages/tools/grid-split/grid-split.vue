<template>
	<view class="page">
		<view v-if="!src" class="pick-area" @tap="chooseImage">
			<view class="pick-icon-wrap">
				<text class="pick-icon">📷</text>
			</view>
			<text class="pick-text">选择一张图片</text>
			<text class="pick-hint">自动居中裁剪为正方形，切成 9 张</text>
		</view>

		<view v-else class="preview-area">
			<image :src="src" class="preview" mode="aspectFit" @tap="previewOriginal" />
			<canvas
				canvas-id="gridCanvas"
				class="hidden-canvas"
				:style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"
			/>
			<view v-if="gridUrls.length" class="grid-preview">
				<text class="grid-tip">点击小图可预览</text>
				<view class="grid-wrap">
					<view
						v-for="(url, i) in gridUrls"
						:key="i"
						class="grid-cell"
						@tap="previewGrid(i)"
					>
						<image :src="url" class="grid-item" mode="aspectFill" />
						<text class="grid-num">{{ i + 1 }}</text>
					</view>
				</view>
			</view>
			<view class="actions">
				<button class="btn-secondary" @tap="chooseImage">重选</button>
				<button class="btn-primary" :loading="processing" @tap="split">切九宫格</button>
				<button v-if="gridUrls.length" class="btn-primary" @tap="saveAll">保存全部</button>
			</view>
		</view>
	</view>
</template>

<script>
import { splitImageToGrid, saveImagesToAlbum } from '@/utils/grid-split.js'

export default {
	data() {
		return {
			src: '',
			canvasSize: 750,
			gridUrls: [],
			processing: false
		}
	},
	methods: {
		chooseImage() {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					this.src = res.tempFilePaths[0]
					this.gridUrls = []
				}
			})
		},
		async split() {
			if (!this.src || this.processing) return
			this.processing = true
			try {
				this.gridUrls = await splitImageToGrid(this.src, 'gridCanvas', this, this.canvasSize)
				uni.showToast({ title: '切图完成', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: '切图失败', icon: 'none' })
			} finally {
				this.processing = false
			}
		},
		async saveAll() {
			uni.showLoading({ title: '保存中' })
			try {
				await saveImagesToAlbum(this.gridUrls)
				uni.showToast({ title: '已保存9张', icon: 'success' })
			} catch (e) {
				uni.showModal({
					title: '保存失败',
					content: '请在设置中允许保存到相册',
					showCancel: false
				})
			} finally {
				uni.hideLoading()
			}
		},
		previewOriginal() {
			if (!this.src) return
			uni.previewImage({
				urls: [this.src],
				current: this.src
			})
		},
		previewGrid(index) {
			if (!this.gridUrls.length) return
			uni.previewImage({
				urls: this.gridUrls,
				current: this.gridUrls[index]
			})
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
}
.pick-area {
	background: #fff;
	border-radius: 20rpx;
	height: 440rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.pick-icon-wrap {
	width: 120rpx;
	height: 120rpx;
	background: #e8f8ef;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
}
.pick-icon {
	font-size: 56rpx;
}
.pick-text {
	font-size: 30rpx;
	color: #333;
	font-weight: 500;
}
.pick-hint {
	font-size: 24rpx;
	color: #999;
	margin-top: 12rpx;
}
.preview {
	width: 100%;
	height: 480rpx;
	background: #fff;
	border-radius: 20rpx;
}
.hidden-canvas {
	position: fixed;
	left: -9999px;
	top: -9999px;
}
.grid-preview {
	margin-top: 20rpx;
}
.grid-tip {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 12rpx;
}
.grid-wrap {
	display: flex;
	flex-wrap: wrap;
	margin-left: -4rpx;
	margin-right: -4rpx;
}
.grid-cell {
	position: relative;
	width: 33.33%;
	padding: 4rpx;
	box-sizing: border-box;
}
.grid-item {
	width: 100%;
	height: 200rpx;
	border-radius: 8rpx;
	display: block;
}
.grid-num {
	position: absolute;
	top: 8rpx;
	left: 8rpx;
	background: rgba(0, 0, 0, 0.5);
	color: #fff;
	font-size: 20rpx;
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	text-align: center;
	line-height: 32rpx;
}
.actions {
	margin-top: 24rpx;
	display: flex;
	gap: 16rpx;
}
.btn-primary,
.btn-secondary {
	flex: 1;
	font-size: 26rpx;
	border-radius: 12rpx;
}
.btn-primary {
	background: #07c160 !important;
	color: #fff !important;
}
.btn-secondary {
	background: #f5f6f8 !important;
	color: #666 !important;
}
</style>
