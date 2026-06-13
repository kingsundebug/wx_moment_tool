<template>
	<view class="page">
		<view class="stats-card">
			<view class="stat">
				<text class="stat__num">{{ draftCount }}</text>
				<text class="stat__label">草稿</text>
			</view>
			<view class="stat-divider" />
			<view class="stat">
				<text class="stat__num">{{ syncLabel }}</text>
				<text class="stat__label">同步模式</text>
			</view>
		</view>

		<view class="menu-list">
			<view class="menu-item" @tap="go('/pages/draft/list')">
				<text class="menu-icon">📝</text>
				<view class="menu-body">
					<text class="menu-text">我的草稿</text>
					<text class="menu-desc">管理未发布的朋友圈内容</text>
				</view>
				<text class="arrow">›</text>
			</view>
			<view class="menu-item" @tap="go('/pages/mine/settings')">
				<text class="menu-icon">⚙️</text>
				<view class="menu-body">
					<text class="menu-text">设置</text>
					<text class="menu-desc">草稿同步、默认防折叠等</text>
				</view>
				<text class="arrow">›</text>
			</view>
			<view class="menu-item" @tap="go('/pages/mine/about')">
				<text class="menu-icon">📄</text>
				<view class="menu-body">
					<text class="menu-text">隐私与协议</text>
					<text class="menu-desc">隐私政策、用户协议</text>
				</view>
				<text class="arrow">›</text>
			</view>
		</view>

		<view class="tip">朋友圈助手 v1.0.0</view>

		<tab-bar current="pages/mine/index" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar/tab-bar.vue'
import { getSettings } from '@/utils/cloud.js'
import { draftStore } from '@/utils/draft-store.js'

const SYNC_LABELS = {
	local: '本地',
	cloud: '云端',
	hybrid: '双备份'
}

export default {
	components: { TabBar },
	data() {
		return {
			draftCount: 0,
			syncLabel: '本地'
		}
	},
	onShow() {
		this.loadStats()
	},
	methods: {
		async loadStats() {
			const s = getSettings()
			this.syncLabel = SYNC_LABELS[s.draftSyncMode] || '本地'
			try {
				const list = await draftStore.list()
				this.draftCount = list.length
			} catch (e) {
				this.draftCount = 0
			}
		},
		go(url) {
			uni.navigateTo({ url })
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx 24rpx 140rpx;
}
.stats-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 32rpx;
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}
.stat {
	flex: 1;
	text-align: center;
}
.stat__num {
	font-size: 40rpx;
	font-weight: 700;
	color: #07c160;
	display: block;
}
.stat__label {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
	display: block;
}
.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: #eee;
}
.menu-list {
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
}
.menu-item {
	display: flex;
	align-items: center;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid #f5f5f5;
}
.menu-item:last-child {
	border-bottom: none;
}
.menu-icon {
	font-size: 44rpx;
	margin-right: 24rpx;
}
.menu-body {
	flex: 1;
}
.menu-text {
	font-size: 30rpx;
	color: #333;
	font-weight: 500;
	display: block;
}
.menu-desc {
	font-size: 24rpx;
	color: #999;
	margin-top: 6rpx;
	display: block;
}
.arrow {
	color: #ccc;
	font-size: 36rpx;
}
.tip {
	text-align: center;
	color: #bbb;
	font-size: 24rpx;
	margin-top: 48rpx;
}
</style>
