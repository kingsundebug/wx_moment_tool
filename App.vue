<script>
import { initCloud } from '@/utils/cloud.js'
import PrivacyPopup from '@/components/privacy-popup/privacy-popup.vue'

export default {
	components: { PrivacyPopup },
	onLaunch() {
		initCloud()
	}
}
</script>

<template>
	<privacy-popup />
</template>

<style>
page {
	background-color: #f5f6f8;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

button[type='primary'] {
	background-color: #07c160 !important;
}

button::after {
	border: none;
}
</style>
