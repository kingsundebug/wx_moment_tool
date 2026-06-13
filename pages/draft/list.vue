<template>
	<view class="page">
		<view v-if="!drafts.length" class="empty">
			<view class="empty__icon-wrap">
				<text class="empty__icon">📝</text>
			</view>
			<text class="empty__title">暂无草稿</text>
			<text class="empty__desc">AI 文案、文案库等内容可一键保存到这里</text>
			<button class="empty__btn" type="primary" @tap="createNew">新建草稿</button>
		</view>

		<view v-for="item in drafts" :key="item.id" class="card" @tap="edit(item.id)">
			<view class="card-head">
				<text class="title">{{ item.title }}</text>
				<text class="time">{{ formatTime(item.updatedAt) }}</text>
			</view>
			<text class="preview">{{ item.content || '（无正文）' }}</text>
			<view class="card-foot">
				<text class="source">{{ sourceLabel(item.source) }}</text>
				<text class="delete" @tap.stop="remove(item.id)">删除</text>
			</view>
		</view>

		<view v-if="drafts.length" class="fab" @tap="createNew">+</view>
	</view>
</template>

<script>
import { draftStore } from '@/utils/draft-store.js'

export default {
	data() {
		return {
			drafts: []
		}
	},
	onShow() {
		this.load()
	},
	methods: {
		async load() {
			try {
				this.drafts = await draftStore.list()
			} catch (e) {
				this.drafts = []
			}
		},
		formatTime(ts) {
			const d = new Date(ts)
			return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
		},
		sourceLabel(s) {
			const map = { ai: 'AI', library: '文案库', manual: '手动', watermark: '去水印' }
			return map[s] || '草稿'
		},
		edit(id) {
			uni.navigateTo({ url: '/pages/draft/edit?id=' + id })
		},
		createNew() {
			uni.navigateTo({ url: '/pages/draft/edit' })
		},
		remove(id) {
			uni.showModal({
				title: '确认删除',
				content: '删除后无法恢复',
				success: async (res) => {
					if (res.confirm) {
						try {
							await draftStore.remove(id)
							this.load()
						} catch (e) {
							uni.showToast({ title: e.message || '删除失败', icon: 'none' })
						}
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
	min-height: 100vh;
}
.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 160rpx 48rpx 80rpx;
}
.empty__icon-wrap {
	width: 120rpx;
	height: 120rpx;
	background: #e8f8ef;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 32rpx;
}
.empty__icon {
	font-size: 56rpx;
	line-height: 1;
}
.empty__title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}
.empty__desc {
	font-size: 26rpx;
	color: #999;
	line-height: 1.6;
	text-align: center;
	margin-bottom: 48rpx;
}
.empty__btn {
	width: 320rpx;
	height: 80rpx;
	line-height: 80rpx;
	padding: 0;
	font-size: 28rpx;
	border-radius: 40rpx;
	background: #07c160 !important;
}
.empty__btn::after {
	border: none;
}
.card {
	background: #fff;
	border-radius: 16rpx;
	padding: 28rpx;
	margin-bottom: 20rpx;
}
.card-head {
	display: flex;
	justify-content: space-between;
	margin-bottom: 12rpx;
}
.title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
}
.time {
	font-size: 24rpx;
	color: #bbb;
}
.preview {
	font-size: 26rpx;
	color: #666;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
.card-foot {
	margin-top: 16rpx;
	display: flex;
	justify-content: space-between;
	font-size: 24rpx;
}
.source {
	color: #07c160;
}
.delete {
	color: #f56c6c;
}
.fab {
	position: fixed;
	right: 40rpx;
	bottom: 80rpx;
	width: 96rpx;
	height: 96rpx;
	background: #07c160;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 56rpx;
	box-shadow: 0 4rpx 20rpx rgba(7, 193, 96, 0.4);
}
</style>
