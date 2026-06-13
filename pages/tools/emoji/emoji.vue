<template>
	<view class="page">
		<scroll-view scroll-x class="tabs" :show-scrollbar="false">
			<text
				v-for="group in groups"
				:key="group.id"
				class="tab"
				:class="{ active: activeId === group.id }"
				@tap="switchGroup(group.id)"
			>{{ group.icon }} {{ group.name }}</text>
		</scroll-view>

		<view class="section">
			<text class="category">{{ currentGroup.name }}</text>
			<text class="hint">点击复制，可粘贴到小红书/朋友圈文案</text>
			<view class="grid">
				<view
					v-for="(item, idx) in currentGroup.items"
					:key="idx"
					class="item"
					:class="{ 'item--long': item.length > 4 }"
					@tap="copy(item)"
				>
					<text class="item-text">{{ item }}</text>
				</view>
			</view>
		</view>

		<view class="combo-section">
			<text class="category">一键复制 · 小红书风格组合</text>
			<view
				v-for="(combo, idx) in combos"
				:key="idx"
				class="combo-card"
				@tap="copy(combo.text)"
			>
				<text class="combo-text">{{ combo.text }}</text>
				<text class="combo-label">{{ combo.label }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import groups from '@/static/emoji/groups.json'
import { copyText } from '@/utils/anti-fold.js'

export default {
	data() {
		return {
			groups,
			activeId: groups[0]?.id || 'xhs-must',
			combos: [
				{ label: '探店开头', text: '✨📍今日探店｜' },
				{ label: '氛围结尾', text: '♡̷ ₍ᐢ. ̫.ᐢ₎ ♡̷' },
				{ label: '日常记录', text: '☁️⋆｡日常碎片 ✧.*' },
				{ label: '旅行打卡', text: '✈️₊˚📍周末出逃计划' },
				{ label: '美食分享', text: '🍰☕️ 今日份快乐' },
				{ label: '分隔装饰', text: '⋆｡°✩ ₊˚⊹ ─── ✧.*' },
				{ label: '可爱收尾', text: '⸜(｡˃ ᵕ ˂ )⸝ ♡' },
				{ label: 'ins 风', text: '🤍🫧✨ clean fit' }
			]
		}
	},
	computed: {
		currentGroup() {
			return this.groups.find((g) => g.id === this.activeId) || this.groups[0]
		}
	},
	methods: {
		switchGroup(id) {
			this.activeId = id
		},
		copy(text) {
			copyText(text, '已复制')
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
	padding-bottom: 40rpx;
}
.tabs {
	white-space: nowrap;
	margin-bottom: 24rpx;
}
.tab {
	display: inline-block;
	padding: 14rpx 24rpx;
	margin-right: 12rpx;
	background: #fff;
	border-radius: 32rpx;
	font-size: 24rpx;
	color: #666;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.tab.active {
	background: #ff2442;
	color: #fff;
	box-shadow: 0 4rpx 16rpx rgba(255, 36, 66, 0.25);
}
.section,
.combo-section {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx;
	margin-bottom: 20rpx;
}
.category {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}
.hint {
	font-size: 22rpx;
	color: #999;
	display: block;
	margin-bottom: 20rpx;
}
.grid {
	display: flex;
	flex-wrap: wrap;
	margin-left: -8rpx;
	margin-right: -8rpx;
}
.item {
	min-width: 80rpx;
	padding: 16rpx 20rpx;
	margin: 8rpx;
	background: #fafafa;
	border-radius: 12rpx;
	box-sizing: border-box;
}
.item--long {
	width: calc(50% - 16rpx);
}
.item-text {
	font-size: 30rpx;
	color: #333;
	line-height: 1.4;
	word-break: break-all;
}
.combo-card {
	background: linear-gradient(135deg, #fff5f5, #fff);
	border: 1rpx solid #ffe0e0;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
}
.combo-card:last-child {
	margin-bottom: 0;
}
.combo-text {
	font-size: 28rpx;
	color: #333;
	display: block;
	line-height: 1.5;
}
.combo-label {
	font-size: 22rpx;
	color: #ff2442;
	margin-top: 8rpx;
	display: block;
}
</style>
