<template>
	<view
		class="tool-card"
		:class="'tool-card--' + color"
		@tap="$emit('tap')"
	>
		<view class="tool-card__icon-wrap">
			<text class="tool-card__icon">{{ icon }}</text>
		</view>
		<text class="tool-card__name">{{ name }}</text>
		<text v-if="desc" class="tool-card__desc">{{ desc }}</text>
	</view>
</template>

<script>
export default {
	name: 'ToolCard',
	props: {
		icon: String,
		name: String,
		desc: String,
		color: {
			type: String,
			default: 'green'
		}
	},
	emits: ['tap'],
	options: {
		virtualHost: true
	}
}
</script>

<style scoped>
.tool-card {
	width: 100%;
	box-sizing: border-box;
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx 16rpx 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}
.tool-card__icon-wrap {
	width: 88rpx;
	height: 88rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16rpx;
	flex-shrink: 0;
}
.tool-card--green .tool-card__icon-wrap {
	background: linear-gradient(135deg, #e8f8ef, #d4f5e2);
}
.tool-card--blue .tool-card__icon-wrap {
	background: linear-gradient(135deg, #e8f4ff, #d6ebff);
}
.tool-card--orange .tool-card__icon-wrap {
	background: linear-gradient(135deg, #fff4e8, #ffe8d4);
}
.tool-card--purple .tool-card__icon-wrap {
	background: linear-gradient(135deg, #f3e8ff, #e8d4ff);
}
.tool-card__icon {
	font-size: 44rpx;
	line-height: 1;
}
.tool-card__name {
	width: 100%;
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	text-align: center;
	line-height: 1.4;
}
.tool-card__desc {
	width: 100%;
	font-size: 20rpx;
	color: #aaa;
	margin-top: 6rpx;
	text-align: center;
	line-height: 1.4;
}
</style>
