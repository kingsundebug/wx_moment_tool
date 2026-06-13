<template>
	<view class="page">
		<scroll-view scroll-x class="tabs" :show-scrollbar="false">
			<text
				v-for="cat in categories"
				:key="cat.id"
				class="tab"
				:class="{ active: activeId === cat.id }"
				@tap="switchCategory(cat.id)"
			>{{ cat.icon }} {{ cat.name }}</text>
		</scroll-view>

		<view v-if="loading" class="empty">加载中...</view>
		<view v-else-if="!items.length" class="empty">暂无文案</view>

		<copy-card
			v-for="item in items"
			:key="item.id"
			:text="item.text"
			:tags="item.tags"
			@copy="copy(item.text)"
			@draft="saveDraft(item.text)"
		/>

		<view v-if="hasMore" class="load-more" @tap="loadMore">加载更多</view>
	</view>
</template>

<script>
import categories from '@/static/copywriting/categories.json'
import CopyCard from '@/components/copy-card/copy-card.vue'
import { copyText } from '@/utils/anti-fold.js'
import { draftStore } from '@/utils/draft-store.js'

const PAGE_SIZE = 25

const CATEGORY_LOADERS = {
	motivation: () => import('@/static/copywriting/motivation.json'),
	'chicken-soup': () => import('@/static/copywriting/chicken-soup.json'),
	love: () => import('@/static/copywriting/love.json'),
	work: () => import('@/static/copywriting/work.json'),
	festival: () => import('@/static/copywriting/festival.json'),
	life: () => import('@/static/copywriting/life.json')
}

const categoryCache = {}

export default {
	components: { CopyCard },
	data() {
		return {
			categories,
			activeId: 'motivation',
			allItems: [],
			items: [],
			page: 1,
			loading: false
		}
	},
	computed: {
		hasMore() {
			return this.items.length < this.allItems.length
		}
	},
	onLoad(options) {
		let categoryId = 'motivation'
		if (options && options.category) {
			const id = decodeURIComponent(options.category)
			if (CATEGORY_LOADERS[id]) categoryId = id
		}
		this.switchCategory(categoryId)
	},
	methods: {
		async switchCategory(id) {
			this.activeId = id
			this.page = 1
			this.items = []
			this.loading = true
			try {
				if (!categoryCache[id]) {
					const loader = CATEGORY_LOADERS[id]
					if (!loader) {
						this.allItems = []
						return
					}
					const mod = await loader()
					categoryCache[id] = mod.default || mod
				}
				this.allItems = categoryCache[id]
				this.items = this.allItems.slice(0, PAGE_SIZE)
			} catch (e) {
				this.allItems = []
				uni.showToast({ title: '加载失败', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		loadMore() {
			this.page += 1
			this.items = this.allItems.slice(0, this.page * PAGE_SIZE)
		},
		copy(text) {
			copyText(text)
		},
		async saveDraft(content) {
			await draftStore.save({
				content,
				source: 'library',
				title: content.slice(0, 20)
			})
			uni.showToast({ title: '已存草稿', icon: 'success' })
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
}
.tabs {
	white-space: nowrap;
	margin-bottom: 24rpx;
}
.tab {
	display: inline-block;
	padding: 16rpx 28rpx;
	margin-right: 16rpx;
	background: #fff;
	border-radius: 32rpx;
	font-size: 26rpx;
	color: #666;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.tab.active {
	background: #07c160;
	color: #fff;
	box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.3);
}
.empty {
	text-align: center;
	color: #999;
	padding: 80rpx 0;
}
.load-more {
	text-align: center;
	color: #07c160;
	font-size: 28rpx;
	padding: 32rpx 0 48rpx;
}
</style>
