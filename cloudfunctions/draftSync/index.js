const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const COL = 'drafts'

exports.main = async (event) => {
	const { action } = event
	const openid = cloud.getWXContext().OPENID

	if (!openid) {
		return { code: 401, message: '未登录' }
	}

	try {
		switch (action) {
			case 'list':
				return await list(openid)
			case 'save':
				return await save(openid, event.draft)
			case 'remove':
				return await remove(openid, event.id)
			case 'uploadBatch':
				return await uploadBatch(openid, event.drafts)
			default:
				return { code: 400, message: '未知 action' }
		}
	} catch (e) {
		console.error('draftSync error:', e)
		return { code: 500, message: e.message || '操作失败' }
	}
}

async function list(openid) {
	const { data } = await db
		.collection(COL)
		.where({ _openid: openid })
		.orderBy('updatedAt', 'desc')
		.limit(100)
		.get()
	return { code: 0, data }
}

async function save(openid, draft) {
	if (!draft || !draft.id) {
		return { code: 400, message: '草稿数据无效' }
	}
	const now = Date.now()
	const record = {
		...draft,
		_openid: openid,
		updatedAt: now,
		createdAt: draft.createdAt || now,
		syncStatus: 'synced'
	}
	const exist = await db.collection(COL).where({ _openid: openid, id: draft.id }).get()
	if (exist.data.length) {
		await db.collection(COL).where({ _openid: openid, id: draft.id }).update({ data: record })
	} else {
		await db.collection(COL).add({ data: record })
	}
	return { code: 0, data: record }
}

async function remove(openid, id) {
	if (!id) return { code: 400, message: '缺少 id' }
	await db.collection(COL).where({ _openid: openid, id }).remove()
	return { code: 0 }
}

async function uploadBatch(openid, drafts) {
	if (!Array.isArray(drafts)) return { code: 400, message: 'drafts 必须是数组' }
	const results = []
	for (const draft of drafts) {
		const res = await save(openid, draft)
		results.push(res.data)
	}
	return { code: 0, data: results }
}
