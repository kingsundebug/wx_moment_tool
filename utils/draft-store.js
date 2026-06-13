import { getSettings } from '@/utils/cloud.js'

function genId() {
	return 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function loadLocalDrafts() {
	try {
		const raw = uni.getStorageSync('drafts')
		return raw ? JSON.parse(raw) : []
	} catch (e) {
		return []
	}
}

function saveLocalDrafts(list) {
	uni.setStorageSync('drafts', JSON.stringify(list))
}

function normalizeDraft(draft) {
	const now = Date.now()
	return {
		id: draft.id || genId(),
		title: draft.title || (draft.content || '').slice(0, 20) || '未命名草稿',
		content: draft.content || '',
		antiFoldApplied: !!draft.antiFoldApplied,
		images: draft.images || [],
		source: draft.source || 'manual',
		createdAt: draft.createdAt || now,
		updatedAt: now,
		syncStatus: draft.syncStatus || 'local_only'
	}
}

async function cloudAction(action, payload = {}) {
	const { callCloud } = await import('@/utils/cloud.js')
	const res = await callCloud('draftSync', { action, ...payload })
	if (res && res.code !== undefined && res.code !== 0) {
		throw new Error(res.message || '云同步失败')
	}
	return res
}

export const draftStore = {
	async list() {
		const { draftSyncMode } = getSettings()
		if (draftSyncMode === 'cloud') {
			const res = await cloudAction('list')
			return res.data || []
		}
		const local = loadLocalDrafts()
		if (draftSyncMode === 'hybrid') {
			const pending = local.filter((d) => d.syncStatus === 'pending')
			if (pending.length) {
				// 后台尝试同步，不阻塞列表
				this.sync().catch(() => {})
			}
		}
		return local.sort((a, b) => b.updatedAt - a.updatedAt)
	},

	async get(id) {
		const list = await this.list()
		return list.find((d) => d.id === id) || null
	},

	async save(draft) {
		const item = normalizeDraft(draft)
		const { draftSyncMode } = getSettings()

		if (draftSyncMode === 'local') {
			const list = loadLocalDrafts()
			const idx = list.findIndex((d) => d.id === item.id)
			if (idx >= 0) list[idx] = item
			else list.unshift(item)
			saveLocalDrafts(list)
			return item
		}

		if (draftSyncMode === 'cloud') {
			const res = await cloudAction('save', { draft: item })
			return res.data
		}

		// hybrid
		item.syncStatus = 'pending'
		const list = loadLocalDrafts()
		const idx = list.findIndex((d) => d.id === item.id)
		if (idx >= 0) list[idx] = item
		else list.unshift(item)
		saveLocalDrafts(list)
		this.sync().catch(() => {})
		return item
	},

	async remove(id) {
		const { draftSyncMode } = getSettings()
		if (draftSyncMode === 'local') {
			const list = loadLocalDrafts().filter((d) => d.id !== id)
			saveLocalDrafts(list)
			return
		}
		await cloudAction('remove', { id })
		const list = loadLocalDrafts().filter((d) => d.id !== id)
		saveLocalDrafts(list)
	},

	async getRecentDraft() {
		const { draftSyncMode } = getSettings()
		if (draftSyncMode === 'cloud' || draftSyncMode === 'hybrid') {
			const list = await this.list()
			return list[0] || null
		}
		const list = loadLocalDrafts()
		return list.sort((a, b) => b.updatedAt - a.updatedAt)[0] || null
	},

	async sync() {
		const { draftSyncMode } = getSettings()
		if (draftSyncMode === 'local') return

		const local = loadLocalDrafts()
		const pending = local.filter((d) => d.syncStatus === 'pending')
		if (pending.length) {
			await cloudAction('uploadBatch', { drafts: pending })
			const updated = local.map((d) =>
				d.syncStatus === 'pending' ? { ...d, syncStatus: 'synced' } : d
			)
			saveLocalDrafts(updated)
		}

		if (draftSyncMode === 'hybrid' || draftSyncMode === 'cloud') {
			const res = await cloudAction('list')
			const cloudList = res.data || []
			if (draftSyncMode === 'cloud') {
				saveLocalDrafts(cloudList)
				return cloudList
			}
			// hybrid 合并：云端较新覆盖本地
			const map = new Map(local.map((d) => [d.id, d]))
			cloudList.forEach((c) => {
				const l = map.get(c.id)
				if (!l || c.updatedAt > l.updatedAt) map.set(c.id, { ...c, syncStatus: 'synced' })
			})
			const merged = [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt)
			saveLocalDrafts(merged)
			return merged
		}
	}
}

export async function getRecentDraft() {
	return draftStore.getRecentDraft()
}
