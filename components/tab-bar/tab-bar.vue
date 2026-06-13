<template>
	<view class="tab-bar">
		<view
			v-for="item in tabs"
			:key="item.path"
			class="tab-item"
			:class="{ active: current === item.path }"
			@tap="switchTab(item.path)"
		>
			<view class="tab-dot" :class="{ 'tab-dot--on': current === item.path }" />
			<text class="tab-text">{{ item.text }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TabBar',
	props: {
		current: { type: String, default: 'pages/index/index' }
	},
	data() {
		return {
			tabs: [
				{ path: 'pages/index/index', text: '工具' },
				{ path: 'pages/copywriting/ai', text: 'AI 文案' },
				{ path: 'pages/mine/index', text: '我的' }
			]
		}
	},
	methods: {
		switchTab(path) {
			if (path === this.current) return
			uni.redirectTo({ url: '/' + path })
		}
	}
}
</script>

<style scoped>
.tab-bar {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: calc(16rpx + env(safe-area-inset-bottom));
	height: 100rpx;
	background: rgba(255, 255, 255, 0.96);
	border-radius: 50rpx;
	box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.08);
	display: flex;
	z-index: 999;
	backdrop-filter: blur(10px);
}
.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #999;
}
.tab-item.active {
	color: #07c160;
}
.tab-dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	margin-bottom: 6rpx;
	background: transparent;
}
.tab-dot--on {
	background: #07c160;
}
.tab-text {
	font-size: 24rpx;
	font-weight: 500;
}
</style>
