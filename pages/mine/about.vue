<template>
	<view class="page">
		<view class="tabs">
			<text
				class="tab"
				:class="{ active: tab === 'privacy' }"
				@tap="tab = 'privacy'"
			>隐私政策</text>
			<text
				class="tab"
				:class="{ active: tab === 'terms' }"
				@tap="tab = 'terms'"
			>用户协议</text>
		</view>

		<scroll-view scroll-y class="content">
			<view v-if="tab === 'privacy'" class="article">
				<text class="h1">隐私政策</text>
				<text class="p">更新日期：2026年6月13日</text>
				<text class="p">生效日期：2026年6月13日</text>

				<text class="h2">一、我们收集的信息</text>
				<text class="p">为提供核心功能，我们可能收集或使用以下信息：</text>
				<text class="p">1. 您主动输入的文案内容（用于 AI 生成、草稿保存）；</text>
				<text class="p">2. 您选择的本地图片（用于九宫格切图、拼长图，仅在设备本地处理）；</text>
				<text class="p">3. 您粘贴的分享链接（用于去水印解析，通过云函数处理）；</text>
				<text class="p">4. 微信 openid（用于云草稿同步、解析次数限制，由微信云开发提供）。</text>

				<text class="h2">二、信息的使用</text>
				<text class="p">收集的信息仅用于实现小程序功能，包括文案生成、图片处理、草稿存储与同步，不会用于与功能无关的目的。</text>

				<text class="h2">三、信息存储</text>
				<text class="p">草稿可选择仅保存在本地设备，或同步至微信云数据库。本地数据您可随时删除；云端数据可在「我的草稿」中删除。</text>

				<text class="h2">四、第三方服务</text>
				<text class="p">AI 文案功能使用微信云开发 AI 能力；去水印解析通过云函数访问第三方平台公开链接。我们不会向无关第三方出售您的个人信息。</text>

				<text class="h2">五、您的权利</text>
				<text class="p">您有权拒绝授权非必要权限，但可能无法使用对应功能。您可在微信设置中管理相册等授权。</text>

				<text class="h2">六、联系我们</text>
				<text class="p">如有隐私相关问题，请通过小程序「我的」页面反馈。</text>
			</view>

			<view v-else class="article">
				<text class="h1">用户协议</text>
				<text class="p">欢迎使用「朋友圈助手」小程序。使用前请仔细阅读本协议。</text>

				<text class="h2">一、服务说明</text>
				<text class="p">本小程序提供朋友圈文案参考、AI 文案生成、图片处理（九宫格、拼长图）、链接解析等工具服务。</text>

				<text class="h2">二、使用规范</text>
				<text class="p">1. 您应合法使用本服务，不得利用本工具侵犯他人著作权、肖像权等合法权益；</text>
				<text class="p">2. 去水印功能仅供个人学习交流，请勿用于商业用途或非法传播他人作品；</text>
				<text class="p">3. AI 生成内容仅供参考，发布前请自行甄别；</text>
				<text class="p">4. 防折叠功能效果因微信版本而异，我们不保证特定效果。</text>

				<text class="h2">三、免责声明</text>
				<text class="p">因第三方平台规则变更导致解析失败、因网络原因导致的服务中断，我们不承担由此产生的损失。图片处理均在本地或您的云空间完成，请自行备份重要数据。</text>

				<text class="h2">四、协议变更</text>
				<text class="p">我们可能适时修订本协议，修订后继续使用即视为同意。</text>
			</view>
		</scroll-view>

		<!-- #ifdef MP-WEIXIN -->
		<button v-if="tab === 'privacy'" class="link-btn" @tap="openWxPrivacy">查看微信官方隐私指引</button>
		<!-- #endif -->
	</view>
</template>

<script>
import { openPrivacyContract } from '@/utils/privacy.js'

export default {
	data() {
		return {
			tab: 'privacy'
		}
	},
	onLoad(query) {
		if (query.tab === 'terms') this.tab = 'terms'
	},
	methods: {
		openWxPrivacy() {
			openPrivacyContract()
		}
	}
}
</script>

<style scoped>
.page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #f5f6f8;
}
.tabs {
	display: flex;
	background: #fff;
	padding: 0 24rpx;
	border-bottom: 1rpx solid #eee;
}
.tab {
	flex: 1;
	text-align: center;
	padding: 28rpx 0;
	font-size: 28rpx;
	color: #999;
}
.tab.active {
	color: #07c160;
	font-weight: 600;
	border-bottom: 4rpx solid #07c160;
}
.content {
	flex: 1;
	padding: 24rpx;
	box-sizing: border-box;
}
.article {
	background: #fff;
	border-radius: 16rpx;
	padding: 32rpx;
}
.h1 {
	font-size: 36rpx;
	font-weight: 700;
	color: #1a1a1a;
	display: block;
	margin-bottom: 16rpx;
}
.h2 {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
	display: block;
	margin: 28rpx 0 12rpx;
}
.p {
	font-size: 26rpx;
	color: #666;
	line-height: 1.8;
	display: block;
	margin-bottom: 8rpx;
}
.link-btn {
	margin: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
	background: #fff !important;
	color: #07c160 !important;
	font-size: 28rpx;
	border-radius: 12rpx;
}
</style>
