<template>
	<view class="page">
		<view class="header">
			<text class="header__title">朋友圈助手</text>
			<text class="header__sub">文案 · 图片 · 一键发布</text>
		</view>

		<view v-if="recentDraft" class="draft-card" @tap="openDraft(recentDraft.id)">
			<view class="draft-card__top">
				<text class="draft-card__label">继续编辑</text>
				<text class="draft-card__arrow">›</text>
			</view>
			<text class="draft-card__title">{{ recentDraft.title }}</text>
			<text class="draft-card__preview">{{ recentDraft.content }}</text>
		</view>

		<view v-else class="quick-card" @tap="goTab('/pages/copywriting/ai')">
			<text class="quick-card__emoji">✍️</text>
			<view>
				<text class="quick-card__title">不知道发什么？</text>
				<text class="quick-card__desc">试试 AI 帮你写朋友圈文案</text>
			</view>
		</view>

		<view class="section">
			<text class="section__title">图片工具</text>
			<view class="grid">
				<view class="grid-item">
					<tool-card icon="🔲" name="九宫格" desc="一图变九图" color="green" @tap="go('/pages/tools/grid-split/grid-split')" />
				</view>
				<view class="grid-item">
					<tool-card icon="📜" name="拼长图" desc="多图合成" color="blue" @tap="go('/pages/tools/long-stitch/long-stitch')" />
				</view>
				<view class="grid-item">
					<tool-card icon="💧" name="去水印" desc="抖音/小红书" color="orange" @tap="go('/pages/tools/watermark/watermark')" />
				</view>
				<view class="grid-item">
					<tool-card icon="🎨" name="文字配图" desc="生成封面长图" color="purple" @tap="go('/pages/tools/text-image/text-image')" />
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section__title">文案工具</text>
			<view class="grid">
				<view class="grid-item">
					<tool-card icon="🤖" name="AI 文案" desc="智能生成" color="purple" @tap="goTab('/pages/copywriting/ai')" />
				</view>
				<view class="grid-item">
					<tool-card icon="📚" name="文案库" desc="精选参考" color="green" @tap="go('/pages/copywriting/library')" />
				</view>
				<view class="grid-item">
					<tool-card icon="📅" name="灵感日历" desc="今日发什么" color="purple" @tap="go('/pages/tools/inspiration-calendar/inspiration-calendar')" />
				</view>
				<view class="grid-item">
					<tool-card icon="🛡" name="防折叠" desc="长文优化" color="blue" @tap="go('/pages/tools/anti-fold/anti-fold')" />
				</view>
				<view class="grid-item">
					<tool-card icon="✨" name="特殊符号" desc="装饰排版" color="orange" @tap="go('/pages/tools/emoji/emoji')" />
				</view>
			</view>
		</view>

		<tab-bar current="pages/index/index" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar/tab-bar.vue'
import ToolCard from '@/components/tool-card/tool-card.vue'
import { draftStore } from '@/utils/draft-store.js'

export default {
	components: { TabBar, ToolCard },
	data() {
		return { recentDraft: null }
	},
	async onShow() {
		try {
			this.recentDraft = await draftStore.getRecentDraft()
		} catch (e) {
			this.recentDraft = null
		}
	},
	methods: {
		go(url) {
			uni.navigateTo({ url })
		},
		goTab(url) {
			uni.redirectTo({ url })
		},
		openDraft(id) {
			uni.navigateTo({ url: '/pages/draft/edit?id=' + id })
		}
	}
}
</script>

<style scoped>
.page {
	padding: 0 24rpx 140rpx;
	min-height: 100vh;
}
.header {
	padding: 48rpx 8rpx 32rpx;
}
.header__title {
	font-size: 44rpx;
	font-weight: 700;
	color: #1a1a1a;
	display: block;
}
.header__sub {
	font-size: 26rpx;
	color: #999;
	margin-top: 8rpx;
	display: block;
}
.draft-card {
	background: linear-gradient(135deg, #07c160 0%, #05a650 100%);
	border-radius: 20rpx;
	padding: 28rpx 32rpx;
	margin-bottom: 32rpx;
	color: #fff;
	box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.25);
}
.draft-card__top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.draft-card__label {
	font-size: 24rpx;
	opacity: 0.9;
}
.draft-card__arrow {
	font-size: 36rpx;
	opacity: 0.8;
}
.draft-card__title {
	display: block;
	font-size: 32rpx;
	font-weight: 600;
	margin: 12rpx 0 8rpx;
}
.draft-card__preview {
	font-size: 26rpx;
	opacity: 0.85;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
.quick-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx 32rpx;
	margin-bottom: 32rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}
.quick-card__emoji {
	font-size: 56rpx;
	margin-right: 24rpx;
	flex-shrink: 0;
}
.quick-card__title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
	display: block;
}
.quick-card__desc {
	font-size: 24rpx;
	color: #999;
	margin-top: 6rpx;
	display: block;
}
.section {
	margin-bottom: 28rpx;
}
.section__title {
	font-size: 28rpx;
	font-weight: 600;
	color: #666;
	margin-bottom: 20rpx;
	display: block;
	padding-left: 4rpx;
}
.grid {
	display: flex;
	flex-wrap: wrap;
	margin-left: -10rpx;
	margin-right: -10rpx;
}
.grid-item {
	width: 33.33%;
	padding: 10rpx;
	box-sizing: border-box;
}
</style>
