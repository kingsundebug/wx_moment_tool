<template>
	<view v-if="visible" class="privacy-mask" @touchmove.stop.prevent>
		<view class="privacy-dialog" @tap.stop>
			<text class="privacy-title">用户隐私保护提示</text>
			<text class="privacy-content">
				感谢你使用朋友圈助手。在使用相册、剪贴板、AI 文案等功能前，请阅读并同意
				<text class="privacy-link" @tap="openContract">《用户隐私保护指引》</text>
				。我们将按照指引收集和使用相关信息，以提供文案生成、图片处理、草稿保存等服务。
			</text>
			<view class="privacy-actions">
				<button class="btn-disagree" @tap="onDisagree">不同意</button>
				<!-- #ifdef MP-WEIXIN -->
				<button
					id="privacy-agree-btn"
					class="btn-agree"
					open-type="agreePrivacyAuthorization"
					@agreeprivacyauthorization="onAgree"
				>同意并继续</button>
				<!-- #endif -->
				<!-- #ifndef MP-WEIXIN -->
				<button class="btn-agree" @tap="onAgree">同意并继续</button>
				<!-- #endif -->
			</view>
		</view>
	</view>
</template>

<script>
import {
	checkNeedPrivacyAuth,
	setPrivacyAgreedLocally,
	openPrivacyContract,
	registerPrivacyPopup,
	resolvePrivacyAuthorization
} from '@/utils/privacy.js'

export default {
	name: 'PrivacyPopup',
	data() {
		return {
			visible: false
		}
	},
	mounted() {
		registerPrivacyPopup(() => {
			this.visible = true
		})
		this.check()
	},
	methods: {
		async check() {
			const need = await checkNeedPrivacyAuth()
			this.visible = need
		},
		openContract() {
			openPrivacyContract()
		},
		onAgree() {
			setPrivacyAgreedLocally()
			resolvePrivacyAuthorization(true)
			this.visible = false
			this.$emit('agreed')
		},
		onDisagree() {
			resolvePrivacyAuthorization(false)
			this.visible = true
			uni.showModal({
				title: '提示',
				content: '需同意隐私指引后才能使用完整功能',
				showCancel: false
			})
		}
	}
}
</script>

<style scoped>
.privacy-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.55);
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
}
.privacy-dialog {
	width: 100%;
	background: #fff;
	border-radius: 24rpx;
	padding: 40rpx 36rpx 32rpx;
}
.privacy-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #1a1a1a;
	display: block;
	margin-bottom: 24rpx;
}
.privacy-content {
	font-size: 28rpx;
	color: #666;
	line-height: 1.7;
	display: block;
}
.privacy-link {
	color: #07c160;
}
.privacy-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 36rpx;
}
.btn-disagree,
.btn-agree {
	flex: 1;
	font-size: 28rpx;
	border-radius: 12rpx;
	margin: 0;
	padding: 0;
	height: 80rpx;
	line-height: 80rpx;
}
.btn-disagree {
	background: #f5f6f8 !important;
	color: #666 !important;
}
.btn-agree {
	background: #07c160 !important;
	color: #fff !important;
}
</style>
