<template>
	<view class="page">
		<view class="hero">
			<text class="hero__title">更多文案工具</text>
			<text class="hero__sub">文案库 · 防折叠 · 灵感日历</text>
		</view>

		<view class="card" @tap="go('/pages/copywriting/library')">
			<view class="card__icon-wrap card__icon-wrap--green">
				<text class="card__icon">📚</text>
			</view>
			<view class="card__body">
				<text class="card__title">文案参考库</text>
				<text class="card__desc">励志、心灵鸡汤、节日等 1200+ 精选文案</text>
			</view>
			<text class="card__arrow">›</text>
		</view>

		<view class="card" @tap="go('/pages/tools/anti-fold/anti-fold')">
			<view class="card__icon-wrap card__icon-wrap--blue">
				<text class="card__icon">🛡</text>
			</view>
			<view class="card__body">
				<text class="card__title">防折叠</text>
				<text class="card__desc">优化长文案，减少被微信折叠</text>
			</view>
			<text class="card__arrow">›</text>
		</view>

		<view class="card" @tap="go('/pages/tools/inspiration-calendar/inspiration-calendar')">
			<view class="card__icon-wrap card__icon-wrap--purple">
				<text class="card__icon">📅</text>
			</view>
			<view class="card__body">
				<text class="card__title">发圈灵感日历</text>
				<text class="card__desc">节日节气 · 每日发圈灵感</text>
			</view>
			<text class="card__arrow">›</text>
		</view>

		<tab-bar current="pages/copywriting/index" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar/tab-bar.vue'

export default {
	components: { TabBar },
	methods: {
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
.hero {
	padding: 24rpx 8rpx 32rpx;
}
.hero__title {
	font-size: 40rpx;
	font-weight: 700;
	color: #1a1a1a;
	display: block;
}
.hero__sub {
	font-size: 26rpx;
	color: #999;
	margin-top: 8rpx;
	display: block;
}
.card {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx 32rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}
.card--ai {
	border: 2rpx solid #f0e6ff;
}
.card__icon-wrap {
	width: 88rpx;
	height: 88rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
}
.card__icon-wrap--purple {
	background: linear-gradient(135deg, #f3e8ff, #e8d4ff);
}
.card__icon-wrap--green {
	background: linear-gradient(135deg, #e8f8ef, #d4f5e2);
}
.card__icon-wrap--blue {
	background: linear-gradient(135deg, #e8f4ff, #d6ebff);
}
.card__icon {
	font-size: 44rpx;
}
.card__body {
	flex: 1;
}
.card__title {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	display: block;
}
.card__desc {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
	display: block;
}
.card__arrow {
	font-size: 40rpx;
	color: #ccc;
}
</style>
