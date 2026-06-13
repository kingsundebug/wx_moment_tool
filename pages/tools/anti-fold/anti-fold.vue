<template>
	<view class="page">
		<textarea
			v-model="inputText"
			class="textarea"
			placeholder="粘贴朋友圈长文案..."
			maxlength="2000"
			@input="schedulePreview"
		/>

		<text class="label">防折叠强度</text>
		<view class="tags">
			<text
				v-for="opt in levels"
				:key="opt.value"
				class="tag"
				:class="{ active: interval === opt.value }"
				@tap="selectInterval(opt.value)"
			>{{ opt.label }}</text>
		</view>

		<view v-if="output" class="preview">
			<text class="label">处理后（视觉应与原文一致）</text>
			<text class="preview-text">{{ output }}</text>
		</view>

		<view class="actions">
			<button type="primary" @tap="process">处理并复制</button>
		</view>

		<text class="tip">效果因微信版本而异，不保证 100% 防折叠</text>
	</view>
</template>

<script>
import { antiFold, copyText } from '@/utils/anti-fold.js'

export default {
	data() {
		return {
			inputText: '',
			output: '',
			interval: 3,
			levels: [
				{ label: '轻度', value: 5 },
				{ label: '中度', value: 3 },
				{ label: '强力', value: 2 }
			]
		}
	},
	onUnload() {
		clearTimeout(this._previewTimer)
	},
	methods: {
		selectInterval(value) {
			this.interval = value
			this.updatePreview()
		},
		schedulePreview() {
			clearTimeout(this._previewTimer)
			this._previewTimer = setTimeout(() => this.updatePreview(), 200)
		},
		updatePreview() {
			if (this.inputText.trim()) {
				this.output = antiFold(this.inputText, this.interval)
			} else {
				this.output = ''
			}
		},
		process() {
			if (!this.inputText.trim()) {
				return uni.showToast({ title: '请输入文案', icon: 'none' })
			}
			this.output = antiFold(this.inputText, this.interval)
			copyText(this.output, '已防折叠复制')
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
}
.textarea {
	width: 100%;
	height: 320rpx;
	background: #fff;
	border-radius: 12rpx;
	padding: 24rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}
.label {
	font-size: 26rpx;
	color: #666;
	margin: 24rpx 0 12rpx;
	display: block;
}
.tags {
	display: flex;
	gap: 16rpx;
}
.tag {
	padding: 12rpx 28rpx;
	background: #fff;
	border-radius: 32rpx;
	font-size: 26rpx;
	color: #666;
}
.tag.active {
	background: #07c160;
	color: #fff;
}
.preview {
	background: #fff;
	border-radius: 12rpx;
	padding: 24rpx;
	margin-top: 24rpx;
}
.preview-text {
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
}
.actions {
	margin-top: 32rpx;
}
.tip {
	display: block;
	text-align: center;
	font-size: 22rpx;
	color: #bbb;
	margin-top: 24rpx;
}
</style>
