<template>
	<view class="page">
		<view class="mode-tabs">
			<view
				class="mode-tab"
				:class="{ active: mode === 'short' }"
				@tap="switchMode('short')"
			>
				<text class="mode-tab__title">短文字配图</text>
				<text class="mode-tab__desc">小红书封面风格</text>
			</view>
			<view
				class="mode-tab"
				:class="{ active: mode === 'long' }"
				@tap="switchMode('long')"
			>
				<text class="mode-tab__title">长文字长图</text>
				<text class="mode-tab__desc">笔记 / 摘抄长图</text>
			</view>
		</view>

		<view class="panel">
			<text class="label">输入文字</text>
			<textarea
				v-model="inputText"
				class="textarea"
				:placeholder="mode === 'short' ? shortPlaceholder : longPlaceholder"
				:maxlength="maxChars"
				:show-confirm-bar="false"
			/>
			<text class="counter">{{ inputText.length }} / {{ maxChars }}</text>
		</view>

		<view class="panel">
			<text class="label">选择模板</text>
			<scroll-view scroll-x class="tpl-scroll" :show-scrollbar="false">
				<view
					v-for="tpl in currentTemplates"
					:key="tpl.id"
					class="tpl-card"
					:class="{ active: selectedId === tpl.id }"
					@tap="selectTemplate(tpl.id)"
				>
					<view class="tpl-preview">
						<image
							v-if="tpl.bg?.type === 'image'"
							:src="resolveTemplatePreviewSrc(tpl)"
							class="tpl-preview__img"
							mode="aspectFill"
						/>
						<view v-else class="tpl-preview__fill" :style="previewStyle(tpl)">
							<text class="tpl-preview__text" :style="{ color: tpl.textColor }">Aa</text>
						</view>
					</view>
					<text class="tpl-name">{{ tpl.name }}</text>
				</view>
			</scroll-view>
		</view>

		<button class="btn-primary" @tap="onGenerate">生成图片</button>
	</view>
</template>

<script>
import templatesData from '@/static/text-image/templates.json'
import { SHORT_MAX_CHARS, LONG_MAX_CHARS } from '@/utils/text-image.js'
import { saveTextImageSession } from '@/utils/text-image-session.js'
import { resolveTemplatePreviewSrc } from '@/utils/text-image-path.js'

export default {
	data() {
		return {
			mode: 'short',
			inputText: '',
			shortTemplates: templatesData.short || [],
			longTemplates: templatesData.long || [],
			selectedId: '',
			shortPlaceholder: '写一句金句或标题，如：今日份快乐已送达 ☀️',
			longPlaceholder: '粘贴长文案、读书笔记或日记，将自动排版生成长图…'
		}
	},
	computed: {
		currentTemplates() {
			return this.mode === 'short' ? this.shortTemplates : this.longTemplates
		},
		maxChars() {
			return this.mode === 'short' ? SHORT_MAX_CHARS : LONG_MAX_CHARS
		},
		activeTemplate() {
			return this.currentTemplates.find((t) => t.id === this.selectedId) || this.currentTemplates[0]
		}
	},
	onLoad() {
		const list = this.shortTemplates
		const firstImage = list.find((t) => t.bg?.type === 'image')
		this.selectedId = firstImage?.id || list[0]?.id || ''
	},
	methods: {
		switchMode(mode) {
			if (this.mode === mode) return
			this.mode = mode
			const list = mode === 'short' ? this.shortTemplates : this.longTemplates
			const firstImage = list.find((t) => t.bg?.type === 'image')
			this.selectedId = firstImage?.id || list[0]?.id || ''
		},
		selectTemplate(id) {
			this.selectedId = id
		},
		resolveTemplatePreviewSrc(tpl) {
			return resolveTemplatePreviewSrc(tpl)
		},
		previewStyle(tpl) {
			if (tpl.bg?.type === 'gradient' && tpl.bg.colors?.length) {
				return {
					background: `linear-gradient(180deg, ${tpl.bg.colors.join(', ')})`
				}
			}
			return { background: tpl.bg?.color || '#f5f6f8' }
		},
		onGenerate() {
			const tpl = this.activeTemplate
			if (!tpl) {
				return uni.showToast({ title: '请选择模板', icon: 'none' })
			}
			if (!this.inputText.trim()) {
				return uni.showToast({ title: '请输入文字', icon: 'none' })
			}

			saveTextImageSession({
				mode: this.mode,
				inputText: this.inputText.trim(),
				templateId: tpl.id
			})
			uni.navigateTo({ url: '/pages/tools/text-image/result' })
		}
	}
}
</script>

<style scoped>
.page {
	padding: 24rpx;
	padding-bottom: 48rpx;
	min-height: 100vh;
	box-sizing: border-box;
	background-color: #f5f6f8;
}

.mode-tabs {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.mode-tab {
	flex: 1;
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx 20rpx;
	border: 2rpx solid transparent;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.mode-tab.active {
	border-color: #07c160;
	background: #f6ffed;
}

.mode-tab__title {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
}

.mode-tab__desc {
	display: block;
	font-size: 22rpx;
	color: #999;
	margin-top: 6rpx;
}

.mode-tab.active .mode-tab__title {
	color: #07c160;
}

.panel {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
	margin-bottom: 16rpx;
}

.textarea {
	width: 100%;
	height: 240rpx;
	padding: 20rpx;
	box-sizing: border-box;
	font-size: 28rpx;
	color: #333;
	background: #f5f6f8;
	border-radius: 12rpx;
}

.counter {
	display: block;
	text-align: right;
	font-size: 22rpx;
	color: #bbb;
	margin-top: 8rpx;
}

.tpl-scroll {
	white-space: nowrap;
	margin: 0 -8rpx;
}

.tpl-card {
	display: inline-block;
	width: 160rpx;
	margin: 0 8rpx;
	vertical-align: top;
}

.tpl-card.active .tpl-preview {
	box-shadow: 0 0 0 4rpx #07c160;
}

.tpl-preview {
	width: 160rpx;
	height: 200rpx;
	border-radius: 12rpx;
	overflow: hidden;
}

.tpl-preview__fill {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.tpl-preview__img {
	width: 100%;
	height: 100%;
}

.tpl-preview__text {
	font-size: 40rpx;
	font-weight: 600;
}

.tpl-name {
	display: block;
	text-align: center;
	font-size: 22rpx;
	color: #666;
	margin-top: 10rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.btn-primary {
	background: #07c160 !important;
	color: #fff !important;
	border-radius: 12rpx;
}
</style>
