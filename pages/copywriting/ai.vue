<template>
	<view class="page">
		<view class="head-card">
			<view class="head-icon tone-green">
				<text class="glyph">圈</text>
			</view>
			<view class="head-body">
				<text class="head-title">AI 文案</text>
				<text class="head-desc">填写主题与风格，AI 帮你写配文</text>
			</view>
		</view>

		<view class="shortcuts">
			<view class="shortcut" hover-class="shortcut--hover" @tap="go('/pages/copywriting/library')">
				<text class="shortcut__icon">📚</text>
				<text class="shortcut__text">文案库</text>
			</view>
			<view class="shortcut" hover-class="shortcut--hover" @tap="go('/pages/tools/inspiration-calendar/inspiration-calendar')">
				<text class="shortcut__icon">📅</text>
				<text class="shortcut__text">灵感日历</text>
			</view>
			<view class="shortcut" hover-class="shortcut--hover" @tap="go('/pages/tools/anti-fold/anti-fold')">
				<text class="shortcut__icon">🛡</text>
				<text class="shortcut__text">防折叠</text>
			</view>
		</view>

		<view class="panel">
			<view class="field">
				<text class="label">主题 <text class="req">*</text></text>
				<input
					v-model="form.theme"
					class="input"
					placeholder="例如：周末露营、新车提车、健身打卡"
					placeholder-class="ph"
					maxlength="80"
				/>
			</view>

			<view class="field">
				<text class="label">内容要点</text>
				<textarea
					v-model="form.content"
					class="textarea"
					placeholder="想提到的事：天气、同行的人、吃了什么、发生了什么…"
					placeholder-class="ph"
					maxlength="500"
					:show-confirm-bar="false"
				/>
			</view>

			<view class="picker-row">
				<text class="picker-label">希望情绪</text>
				<picker :range="moodOptions" :value="moodIndex" @change="onMoodChange">
					<view class="picker-val">
						<text>{{ form.mood }}</text>
						<text class="picker-arrow">›</text>
					</view>
				</picker>
			</view>

			<view class="picker-row">
				<text class="picker-label">文字风格</text>
				<picker :range="styleOptions" :value="styleIndex" @change="onStyleChange">
					<view class="picker-val">
						<text>{{ form.style }}</text>
						<text class="picker-arrow">›</text>
					</view>
				</picker>
			</view>

			<view class="field">
				<text class="label">补充要求</text>
				<textarea
					v-model="form.extra"
					class="textarea textarea-sm"
					placeholder="可选：字数、要不要 emoji、避免某些词…"
					placeholder-class="ph"
					maxlength="200"
					:show-confirm-bar="false"
				/>
			</view>

			<button
				class="btn-native btn-primary"
				hover-class="btn-hover"
				@tap="onGenerate"
			>
				生成文案
			</button>
		</view>

		<text class="legal">文案由 AI 生成，发布前请自行核对</text>

		<tab-bar current="pages/copywriting/ai" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar/tab-bar.vue'
import { MOOD_OPTIONS, STYLE_OPTIONS } from '@/utils/ai-copywriting.js'
import { saveAiSession } from '@/utils/ai-session.js'
import { getSettings } from '@/utils/cloud.js'

export default {
	components: { TabBar },
	data() {
		return {
			moodOptions: MOOD_OPTIONS,
			styleOptions: STYLE_OPTIONS,
			form: {
				theme: '',
				content: '',
				mood: '开心',
				style: '日常',
				extra: ''
			}
		}
	},
	computed: {
		moodIndex() {
			return Math.max(0, this.moodOptions.indexOf(this.form.mood))
		},
		styleIndex() {
			return Math.max(0, this.styleOptions.indexOf(this.form.style))
		}
	},
	onLoad(options) {
		const s = getSettings()
		this.form.mood = s.defaultAiMood || '开心'
		this.form.style = s.defaultAiStyle || '日常'
		if (options && options.theme) {
			this.form.theme = decodeURIComponent(options.theme)
		}
	},
	methods: {
		go(url) {
			uni.navigateTo({ url })
		},
		onMoodChange(e) {
			this.form.mood = this.moodOptions[e.detail.value]
		},
		onStyleChange(e) {
			this.form.style = this.styleOptions[e.detail.value]
		},
		onGenerate() {
			if (!this.form.theme.trim()) {
				return uni.showToast({ title: '请先填写主题', icon: 'none' })
			}
			saveAiSession({
				theme: this.form.theme.trim(),
				content: this.form.content.trim(),
				mood: this.form.mood,
				style: this.form.style,
				extra: this.form.extra.trim(),
				previousCopy: ''
			})
			uni.navigateTo({ url: '/pages/copywriting/result' })
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	padding: 24rpx 32rpx 140rpx;
	box-sizing: border-box;
	background-color: #f5f6f8;
}

.shortcuts {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.shortcut {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx 8rpx;
	background: #fff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.shortcut--hover {
	opacity: 0.85;
}

.shortcut__icon {
	font-size: 36rpx;
	line-height: 1;
}

.shortcut__text {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #666;
}

.head-card {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 28rpx;
	background-color: #f6ffed;
	border-radius: 20rpx;
}

.head-icon {
	display: flex;
	width: 96rpx;
	height: 96rpx;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	border-radius: 24rpx;
}

.tone-green {
	background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
}

.glyph {
	font-size: 40rpx;
	font-weight: 600;
	color: #ffffff;
}

.head-body {
	flex: 1;
	margin-left: 24rpx;
}

.head-title {
	display: block;
	font-size: 34rpx;
	font-weight: 600;
	color: #141414;
}

.head-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 36rpx;
	color: #595959;
}

.panel {
	margin-top: 24rpx;
	padding: 28rpx;
	background-color: #ffffff;
	border-radius: 20rpx;
}

.field {
	margin-bottom: 28rpx;
}

.label {
	display: block;
	margin-bottom: 16rpx;
	font-size: 28rpx;
	font-weight: 500;
	color: #141414;
}

.req {
	color: #ff4d4f;
}

.input {
	width: 100%;
	height: 80rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	font-size: 28rpx;
	color: #141414;
	background-color: #f5f6f8;
	border-radius: 16rpx;
}

.textarea {
	width: 100%;
	height: 180rpx;
	padding: 20rpx;
	box-sizing: border-box;
	font-size: 28rpx;
	color: #141414;
	background-color: #f5f6f8;
	border-radius: 16rpx;
}

.textarea-sm {
	height: 120rpx;
}

.ph {
	color: #bfbfbf;
}

.picker-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 28rpx;
	padding: 24rpx 20rpx;
	background-color: #f5f6f8;
	border-radius: 16rpx;
}

.picker-label {
	font-size: 28rpx;
	font-weight: 500;
	color: #141414;
}

.picker-val {
	display: flex;
	align-items: center;
	font-size: 28rpx;
	color: #07c160;
}

.picker-arrow {
	margin-left: 8rpx;
	font-size: 32rpx;
	line-height: 1;
	color: #bfbfbf;
}

.btn-native {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 88rpx;
	margin-top: 8rpx;
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

.btn-hover {
	opacity: 0.85;
}

.legal {
	display: block;
	margin-top: 32rpx;
	font-size: 22rpx;
	color: #bfbfbf;
	text-align: center;
}
</style>
