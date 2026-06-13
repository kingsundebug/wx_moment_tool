const { parseDouyin } = require('./douyin')
const { parseXiaohongshu } = require('./xiaohongshu')

function detectPlatform(url) {
	if (/douyin\.com|iesdouyin\.com|v\.douyin/i.test(url)) return 'douyin'
	if (/xiaohongshu\.com|xhslink\.com/i.test(url)) return 'xiaohongshu'
	return 'unknown'
}

async function parse(platform, url) {
	if (platform === 'douyin') return parseDouyin(url)
	if (platform === 'xiaohongshu') return parseXiaohongshu(url)
	throw new Error('不支持的平台')
}

module.exports = { detectPlatform, parse }
