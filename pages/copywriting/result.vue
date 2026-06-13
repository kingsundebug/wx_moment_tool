<template>
	<view class="page">
		<view class="size-bar">
			<text class="size-label">设置文字显示大小：</text>
			<view class="size-options">
				<view
					v-for="item in sizeOptions"
					:key="item.key"
					class="size-chip"
					:class="{ active: fontSizeKey === item.key }"
					hover-class="size-chip--hover"
					@tap="fontSizeKey = item.key"
				>
					<text class="size-chip-txt">{{ item.label }}</text>
				</view>
			</view>
		</view>

		<view class="copy-panel">
			<scroll-view scroll-y class="copy-scroll" :scroll-top="scrollTop">
				<view class="copy-inner">
					<text v-if="status === 'loading'" class="copy-placeholder">AI 正在撰写文案…</text>
					<text
						v-else
						class="copy-text"
						:style="{ fontSize: currentFontSize }"
						selectable
					>{{ displayText }}</text>
					<text
						v-if="status === 'streaming'"
						class="copy-cursor"
						:style="{ fontSize: currentFontSize }"
					>|</text>
				</view>
			</scroll-view>
			<text class="word-count">{{ charCount }} 字</text>
		</view>

		<view class="footer">
			<button
				class="btn-native btn-outline"
				:disabled="!fullCopy || status === 'loading' || status === 'streaming'"
				hover-class="btn-hover"
				@tap="onRegenerate"
			>
				重新生成
			</button>
			<button
				class="btn-native btn-primary"
				:disabled="!fullCopy || status === 'loading'"
				hover-class="btn-hover"
				@tap="onCopy"
			>
				复制
			</button>
		</view>
	</view>
</template>

<script>
import {
	generateMomentsCopy,
	streamDisplayText,
	countCopyChars
} from '@/utils/ai-copywriting.js'
import { getAiSession, saveAiSession } from '@/utils/ai-session.js'
import { copyText } from '@/utils/anti-fold.js'

const SIZE_MAP = {
	sm: '24rpx',
	md: '28rpx',
	lg: '32rpx',
	xl: '36rpx',
	xxl: '42rpx'
}

export default {
	data() {
		return {
			sizeOptions: [
				{ key: 'sm', label: '小' },
				{ key: 'md', label: '中' },
				{ key: 'lg', label: '大' },
				{ key: 'xl', label: '特大' },
				{ key: 'xxl', label: '超大' }
			],
			fontSizeKey: 'md',
			session: null,
			displayText: '',
			fullCopy: '',
			status: 'loading',
			scrollTop: 0,
			streamCancel: null
		}
	},
	computed: {
		currentFontSize() {
			return SIZE_MAP[this.fontSizeKey] || SIZE_MAP.md
		},
		charCount() {
			return countCopyChars(this.fullCopy || this.displayText)
		}
	},
	onLoad() {
		const session = getAiSession()
		if (!session || !session.theme) {
			uni.showToast({ title: '请先填写生成设置', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 1200)
			return
		}
		this.session = session
		this.startGenerate(false)
	},
	onUnload() {
		this.cancelStream()
	},
	methods: {
		cancelStream() {
			if (this.streamCancel) {
				this.streamCancel()
				this.streamCancel = null
			}
		},
		buildPayload(regenerate) {
			return {
				theme: this.session.theme,
				content: this.session.content || '',
				mood: this.session.mood || '开心',
				style: this.session.style || '日常',
				extra: this.session.extra || '',
				regenerate: Boolean(regenerate),
				previousCopy: regenerate ? this.fullCopy : ''
			}
		},
		async startGenerate(regenerate) {
			this.cancelStream()
			this.displayText = ''
			this.fullCopy = ''
			this.status = 'loading'

			try {
				const copy = await generateMomentsCopy(this.buildPayload(regenerate))
				this.fullCopy = copy
				saveAiSession({
					...this.session,
					previousCopy: copy
				})
				this.session = getAiSession()
				await this.playStream(copy)
			} catch (e) {
				this.status = 'error'
				uni.showModal({
					title: '生成失败',
					content: e.message || '请检查云函数是否已部署',
					showCancel: false,
					success: () => {
						if (!this.fullCopy) {
							uni.navigateBack()
						}
					}
				})
			}
		},
		async playStream(text) {
			this.status = 'streaming'
			const chunkSize = text.length > 200 ? 2 : 1
			const interval = text.length > 300 ? 18 : 28
			const { promise, cancel } = streamDisplayText(
				text,
				(partial) => {
					this.displayText = partial
					this.scrollTop = partial.length * 2
				},
				{ interval, chunkSize }
			)
			this.streamCancel = cancel
			await promise
			this.streamCancel = null
			this.status = 'done'
		},
		onRegenerate() {
			if (this.status === 'loading' || this.status === 'streaming') {
				return
			}
			this.startGenerate(true)
		},
		onCopy() {
			if (!this.fullCopy) {
				return
			}
			copyText(this.fullCopy)
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

.size-bar {
	flex-shrink: 0;
	margin-bottom: 20rpx;
}

.size-label {
	display: block;
	font-size: 24rpx;
	color: #8c8c8c;
}

.size-options {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.size-chip {
	padding: 10rpx 24rpx;
	background-color: #ffffff;
	border-radius: 999rpx;
	border: 2rpx solid #e8e8e8;
}

.size-chip.active {
	background-color: #e8f8ef;
	border-color: #07c160;
}

.size-chip--hover {
	opacity: 0.85;
}

.size-chip-txt {
	font-size: 24rpx;
	color: #595959;
}

.size-chip.active .size-chip-txt {
	color: #07c160;
	font-weight: 500;
}

.copy-panel {
	position: relative;
	flex: 1;
	min-height: 0;
	margin-bottom: 24rpx;
	padding: 28rpx;
	background-color: #ffffff;
	border-radius: 20rpx;
	overflow: hidden;
}

.copy-scroll {
	height: calc(100vh - 360rpx);
	min-height: 480rpx;
}

.copy-inner {
	padding-bottom: 48rpx;
}

.copy-placeholder {
	font-size: 28rpx;
	line-height: 44rpx;
	color: #bfbfbf;
}

.copy-text {
	display: block;
	line-height: 1.65;
	color: #262626;
	white-space: pre-wrap;
	word-break: break-word;
}

.copy-cursor {
	color: #07c160;
	animation: blink 1s step-end infinite;
}

@keyframes blink {
	50% {
		opacity: 0;
	}
}

.word-count {
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
</style>
