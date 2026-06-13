/**
 * 小程序页面内引用 static 资源时，/static 可能被错误解析为相对路径。
 * 文字配图相关页面均在 pages/tools/text-image/ 下，使用 ../../../static/ 指向项目根 static。
 */
export function resolveStaticImageSrc(src) {
	if (!src || typeof src !== 'string') return src
	if (/^https?:\/\//.test(src)) return src

	if (src.startsWith('/static/')) {
		// #ifdef MP-WEIXIN
		return `../../../${src.slice(1)}`
		// #endif
	}

	return src
}

export function resolveTemplatePreviewSrc(tpl) {
	if (tpl?.bg?.type === 'image' && tpl.bg.src) {
		return resolveStaticImageSrc(tpl.bg.src)
	}
	return ''
}
