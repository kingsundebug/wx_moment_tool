<template>
	<view class="copy-card">
		<text class="copy-card__text">{{ text }}</text>
		<view v-if="tags && tags.length" class="copy-card__tags">
			<text v-for="t in tags" :key="t" class="copy-card__tag">{{ t }}</text>
		</view>
		<view class="copy-card__actions">
			<button class="copy-card__btn" size="mini" @tap="$emit('copy')">复制</button>
			<button class="copy-card__btn copy-card__btn--primary" size="mini" @tap="$emit('draft')">草稿</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CopyCard',
	props: {
		text: String,
		tags: {
			type: Array,
			default: () => []
		}
	},
	emits: ['copy', 'draft']
}
</script>

<style scoped>
.copy-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}
.copy-card__text {
	font-size: 28rpx;
	color: #333;
	line-height: 1.7;
	display: block;
}
.copy-card__tags {
	margin-top: 16rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}
.copy-card__tag {
	font-size: 22rpx;
	color: #07c160;
	background: #e8f8ef;
	padding: 4rpx 16rpx;
	border-radius: 8rpx;
}
.copy-card__actions {
	margin-top: 20rpx;
	display: flex;
	gap: 12rpx;
}
.copy-card__btn {
	flex: 1;
	font-size: 24rpx !important;
	background: #f5f6f8 !important;
	color: #666 !important;
	border: none !important;
}
.copy-card__btn--primary {
	background: #07c160 !important;
	color: #fff !important;
}
</style>
