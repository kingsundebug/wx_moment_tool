<template>
	<view class="page">
		<input v-model="title" class="title-input" placeholder="草稿标题（可选）" />
		<textarea
			v-model="content"
			class="content-input"
			placeholder="输入朋友圈文案..."
			maxlength="2000"
		/>
		<text class="count">{{ content.length }}/2000</text>

		<view class="actions">
			<button @tap="copy">复制</button>
			<button @tap="copyAntiFold">防折叠复制</button>
			<button type="primary" @tap="save">保存草稿</button>
		</view>
	</view>
</template>

<script>
import { draftStore } from '@/utils/draft-store.js'
import { copyText, copyWithAntiFold } from '@/utils/anti-fold.js'

export default {
	data() {
		return {
			id: '',
			title: '',
			content: ''
		}
	},
	onLoad(query) {
		if (query.id) {
			this.id = query.id
			this.loadDraft()
		}
	},
	methods: {
		async loadDraft() {
			const draft = await draftStore.get(this.id)
			if (draft) {
				this.title = draft.title
				this.content = draft.content
			}
		},
		async save() {
			const draft = await draftStore.save({
				id: this.id || undefined,
				title: this.title || this.content.slice(0, 20) || '未命名草稿',
				content: this.content,
				source: 'manual'
			})
			this.id = draft.id
			uni.showToast({ title: '已保存', icon: 'success' })
		},
		copy() {
			if (!this.content) return uni.showToast({ title: '内容为空', icon: 'none' })
			copyText(this.content)
		},
		copyAntiFold() {
			if (!this.content) return uni.showToast({ title: '内容为空', icon: 'none' })
			copyWithAntiFold(this.content)
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
}
.title-input {
	background: #fff;
	border-radius: 12rpx;
	padding: 24rpx;
	font-size: 30rpx;
	margin-bottom: 20rpx;
}
.content-input {
	width: 100%;
	height: 480rpx;
	background: #fff;
	border-radius: 12rpx;
	padding: 24rpx;
	font-size: 28rpx;
	box-sizing: border-box;
	line-height: 1.6;
}
.count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: #bbb;
	margin-top: 8rpx;
}
.actions {
	margin-top: 32rpx;
	display: flex;
	gap: 16rpx;
}
.actions button {
	flex: 1;
	font-size: 26rpx;
}
</style>
