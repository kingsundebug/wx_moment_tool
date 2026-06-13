<template>
	<view class="page">
		<view class="input-card">
			<textarea
				v-model="inputText"
				class="textarea"
				placeholder="粘贴抖音/小红书分享链接或文案"
				maxlength="500"
			/>
			<view class="input-actions">
				<button size="mini" @tap="paste">粘贴剪贴板</button>
				<button size="mini" type="primary" :loading="loading" @tap="parse">解析</button>
			</view>
		</view>

		<view v-if="!result && !loading" class="help-card">
			<text class="help-title">使用说明</text>
			<text class="help-item">1. 打开抖音/小红书，点击分享 → 复制链接</text>
			<text class="help-item">2. 回到本页，点击「粘贴剪贴板」</text>
			<text class="help-item">3. 点击「解析」，预览后保存到相册</text>
			<text class="help-item">4. 支持视频和图集，每日解析有限额</text>
		</view>

		<view v-if="result" class="result-card">
			<text class="platform">{{ platformLabel(result.platform) }} · {{ typeLabel(result.type) }}</text>
			<text v-if="result.title" class="title">{{ result.title }}</text>
			<image v-if="result.cover" :src="result.cover" class="cover" mode="aspectFill" />

			<video
				v-if="result.videoUrl"
				:src="result.videoUrl"
				class="video"
				controls
			/>

			<view v-if="result.images && result.images.length" class="images">
				<image
					v-for="(img, i) in result.images"
					:key="i"
					:src="img"
					class="thumb"
					mode="aspectFill"
					@tap="preview(i)"
				/>
			</view>

			<view class="actions">
				<button v-if="result.videoUrl" type="primary" @tap="saveVideo">保存视频</button>
				<button v-if="result.images && result.images.length" type="primary" @tap="saveImages">保存图集</button>
				<button @tap="saveToDraft">存草稿</button>
			</view>
		</view>

		<text class="disclaimer">仅供个人学习使用，请勿用于侵权用途。解析能力受平台规则影响，可能随时失效。</text>
	</view>
</template>

<script>
import { extractUrl } from '@/utils/extract-url.js'
import { callCloud } from '@/utils/cloud.js'
import { draftStore } from '@/utils/draft-store.js'
import { saveMediaToAlbum } from '@/utils/media-download.js'
import { pasteText } from '@/utils/anti-fold.js'

export default {
	data() {
		return {
			inputText: '',
			loading: false,
			result: null
		}
	},
	methods: {
		async paste() {
			try {
				this.inputText = await pasteText()
			} catch {
				// toast handled in pasteText
			}
		},
		async parse() {
			const url = extractUrl(this.inputText)
			if (!url) {
				return uni.showToast({ title: '未识别到有效链接', icon: 'none' })
			}
			this.loading = true
			this.result = null
			try {
				const res = await callCloud('parseMedia', { url })
				if (res.code !== 0) {
					throw new Error(res.message || '解析失败')
				}
				this.result = res.data
			} catch (e) {
				uni.showModal({
					title: '解析失败',
					content: e.message || '请确认云函数 parseMedia 已部署',
					showCancel: false
				})
			} finally {
				this.loading = false
			}
		},
		platformLabel(p) {
			return { douyin: '抖音', xiaohongshu: '小红书' }[p] || p
		},
		typeLabel(t) {
			return { video: '视频', image: '图片', image_list: '图集' }[t] || t
		},
		preview(index) {
			uni.previewImage({
				urls: this.result.images,
				current: this.result.images[index]
			})
		},
		async saveVideo() {
			uni.showLoading({ title: '保存中' })
			try {
				await saveMediaToAlbum(this.result.videoUrl, 'video')
				uni.showToast({ title: '已保存', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: '保存失败，请重试', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
		async saveImages() {
			uni.showLoading({ title: '保存中' })
			try {
				for (const url of this.result.images) {
					await saveMediaToAlbum(url, 'image')
				}
				uni.showToast({ title: '已保存到相册', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: '保存失败', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
		async saveToDraft() {
			if (!this.result) return
			const content = [this.result.title, this.inputText].filter(Boolean).join('\n')
			await draftStore.save({
				content,
				source: 'watermark',
				title: this.result.title || '去水印素材',
				images: (this.result.images || []).map((url) => ({ url }))
			})
			uni.showToast({ title: '已存草稿', icon: 'success' })
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
	padding-bottom: 40rpx;
}
.input-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
}
.textarea {
	width: 100%;
	height: 200rpx;
	font-size: 28rpx;
}
.input-actions {
	display: flex;
	justify-content: flex-end;
	gap: 16rpx;
	margin-top: 16rpx;
}
.result-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
}
.platform {
	font-size: 24rpx;
	color: #07c160;
}
.title {
	display: block;
	font-size: 30rpx;
	margin: 12rpx 0;
	color: #333;
}
.cover {
	width: 100%;
	height: 360rpx;
	border-radius: 12rpx;
	margin: 12rpx 0;
}
.video {
	width: 100%;
	height: 400rpx;
	margin: 12rpx 0;
}
.images {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin: 12rpx 0;
}
.thumb {
	width: calc(33.33% - 8rpx);
	height: 200rpx;
	border-radius: 8rpx;
}
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 20rpx;
}
.disclaimer {
	font-size: 22rpx;
	color: #bbb;
	line-height: 1.5;
	display: block;
}
.help-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 28rpx;
}
.help-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	display: block;
	margin-bottom: 16rpx;
}
.help-item {
	font-size: 26rpx;
	color: #666;
	line-height: 1.8;
	display: block;
}
</style>
