<template>
	<view class="page">
		<view class="section">
			<text class="section-title">草稿同步</text>
			<radio-group @change="onSyncModeChange">
				<label v-for="opt in syncOptions" :key="opt.value" class="radio-row">
					<radio :value="opt.value" :checked="settings.draftSyncMode === opt.value" color="#07c160" />
					<view class="radio-body">
						<text class="radio-title">{{ opt.label }}</text>
						<text class="radio-desc">{{ opt.desc }}</text>
					</view>
				</label>
			</radio-group>
		</view>

		<view class="section">
			<text class="section-title">默认选项</text>
			<view class="switch-row">
				<text>复制时默认防折叠</text>
				<switch :checked="settings.defaultAntiFold" color="#07c160" @change="onAntiFoldChange" />
			</view>
			<view class="picker-row">
				<text>AI 默认情绪</text>
				<picker :range="moods" :value="moodIndex" @change="onMoodChange">
					<text class="picker-val">{{ settings.defaultAiMood }} ›</text>
				</picker>
			</view>
			<view class="picker-row">
				<text>AI 默认风格</text>
				<picker :range="styles" :value="styleIndex" @change="onStyleChange">
					<text class="picker-val">{{ settings.defaultAiStyle }} ›</text>
				</picker>
			</view>
		</view>

		<button
			v-if="settings.draftSyncMode !== 'local'"
			class="btn-sync"
			:loading="syncing"
			@tap="syncNow"
		>立即同步草稿</button>

		<view class="footer-link" @tap="goAbout">查看隐私政策与用户协议 ›</view>
	</view>
</template>

<script>
import { getSettings, saveSettings } from '@/utils/cloud.js'
import { draftStore } from '@/utils/draft-store.js'
import { MOOD_OPTIONS, STYLE_OPTIONS } from '@/utils/ai-copywriting.js'

export default {
	data() {
		return {
			settings: getSettings(),
			syncing: false,
			moods: MOOD_OPTIONS,
			styles: STYLE_OPTIONS,
			syncOptions: [
				{ value: 'local', label: '仅本地存储', desc: '数据保存在手机，无需登录' },
				{ value: 'cloud', label: '云端同步', desc: '草稿保存在云数据库，换机可恢复' },
				{ value: 'hybrid', label: '本地 + 云端双备份', desc: '本地优先，自动同步到云端' }
			]
		}
	},
	computed: {
		moodIndex() {
			return Math.max(0, this.moods.indexOf(this.settings.defaultAiMood))
		},
		styleIndex() {
			return Math.max(0, this.styles.indexOf(this.settings.defaultAiStyle))
		}
	},
	methods: {
		onSyncModeChange(e) {
			this.settings = saveSettings({ draftSyncMode: e.detail.value })
		},
		onAntiFoldChange(e) {
			this.settings = saveSettings({ defaultAntiFold: e.detail.value })
		},
		onMoodChange(e) {
			this.settings = saveSettings({ defaultAiMood: this.moods[e.detail.value] })
		},
		onStyleChange(e) {
			this.settings = saveSettings({ defaultAiStyle: this.styles[e.detail.value] })
		},
		async syncNow() {
			this.syncing = true
			try {
				await draftStore.sync()
				uni.showToast({ title: '同步完成', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: '同步失败', icon: 'none' })
			} finally {
				this.syncing = false
			}
		},
		goAbout() {
			uni.navigateTo({ url: '/pages/mine/about' })
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
}
.section {
	background: #fff;
	border-radius: 16rpx;
	padding: 28rpx;
	margin-bottom: 24rpx;
}
.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	display: block;
	margin-bottom: 20rpx;
}
.radio-row {
	display: flex;
	align-items: flex-start;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.radio-row:last-child {
	border-bottom: none;
}
.radio-body {
	margin-left: 16rpx;
	flex: 1;
}
.radio-title {
	font-size: 28rpx;
	color: #333;
	display: block;
}
.radio-desc {
	font-size: 24rpx;
	color: #999;
	margin-top: 6rpx;
	display: block;
}
.switch-row,
.picker-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
	font-size: 28rpx;
}
.picker-row:last-child,
.switch-row:last-child {
	border-bottom: none;
}
.picker-val {
	color: #07c160;
}
.btn-sync {
	background: #07c160;
	color: #fff;
	border-radius: 12rpx;
	margin-top: 16rpx;
}
.footer-link {
	text-align: center;
	font-size: 26rpx;
	color: #07c160;
	margin-top: 32rpx;
	padding: 16rpx;
}
</style>
