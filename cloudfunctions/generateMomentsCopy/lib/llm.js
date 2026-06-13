const axios = require('axios')
const cloud = require('wx-server-sdk')

const DEFAULT_BASE = 'https://api.deepseek.com/anthropic'
const DEFAULT_MODEL = 'deepseek-v4-flash'
const TIMEOUT_MS = 55000
const ANTHROPIC_VERSION = '2023-06-01'

/**
 * @returns {{ apiKey: string, baseUrl: string, model: string, useAnthropic: boolean, cloudProvider: string, cloudModel: string }}
 */
function getLlmConfig() {
	const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY || ''
	const baseUrl = (
		process.env.LLM_BASE_URL ||
		process.env.DEEPSEEK_BASE_URL ||
		DEFAULT_BASE
	).replace(/\/$/, '')
	const model = process.env.LLM_MODEL || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL
	const useAnthropic =
		/\/anthropic$/i.test(baseUrl) ||
		process.env.LLM_API_FORMAT === 'anthropic'
	const cloudProvider = process.env.AI_PROVIDER || 'hunyuan-exp'
	const cloudModel =
		process.env.AI_MODEL || 'hunyuan-2.0-instruct-20251111'
	return { apiKey, baseUrl, model, useAnthropic, cloudProvider, cloudModel }
}

/**
 * @param {string} text
 */
function trimQuotes(text) {
	return (text || '').trim().replace(/^["「『]|["」』]$/g, '')
}

/**
 * @param {Array<{ role: string, content: string }>} messages
 */
function splitAnthropicMessages(messages) {
	let system
	const apiMessages = []
	for (const m of messages) {
		if (m.role === 'system') {
			system = m.content
			continue
		}
		apiMessages.push({
			role: m.role === 'assistant' ? 'assistant' : 'user',
			content: [{ type: 'text', text: m.content }]
		})
	}
	return { system, messages: apiMessages }
}

/**
 * @param {unknown} data
 * @returns {string}
 */
function extractAnthropicText(data) {
	const blocks = data && data.content
	if (!Array.isArray(blocks)) {
		return ''
	}
	return blocks
		.filter((b) => b && b.type === 'text' && b.text)
		.map((b) => String(b.text))
		.join('\n')
		.trim()
}

/**
 * @param {unknown} res
 */
function extractCloudAiText(res) {
	const choice =
		res &&
		res.choices &&
		res.choices[0] &&
		res.choices[0].message &&
		res.choices[0].message.content
	return trimQuotes(choice ? String(choice) : '')
}

/**
 * @param {Array<{ role: string, content: string }>} messages
 * @returns {Promise<string>}
 */
async function chatCompletionAnthropic(messages) {
	const { apiKey, baseUrl, model } = getLlmConfig()
	const { system, messages: apiMessages } = splitAnthropicMessages(messages)
	const body = {
		model,
		max_tokens: 1024,
		temperature: 0.85,
		messages: apiMessages
	}
	if (system) {
		body.system = system
	}

	const res = await axios.post(`${baseUrl}/v1/messages`, body, {
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': ANTHROPIC_VERSION,
			'Content-Type': 'application/json'
		},
		timeout: TIMEOUT_MS
	})

	const trimmed = extractAnthropicText(res.data)
	if (!trimmed) {
		const err = new Error('EMPTY_RESPONSE')
		err.code = 'GENERATE_FAILED'
		throw err
	}
	return trimQuotes(trimmed)
}

/**
 * @param {Array<{ role: string, content: string }>} messages
 * @returns {Promise<string>}
 */
async function chatCompletionOpenAI(messages) {
	const { apiKey, baseUrl, model } = getLlmConfig()
	const res = await axios.post(
		`${baseUrl}/v1/chat/completions`,
		{
			model,
			messages,
			temperature: 0.85,
			max_tokens: 1024
		},
		{
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			timeout: TIMEOUT_MS
		}
	)

	const text = res.data && res.data.choices && res.data.choices[0]
		? res.data.choices[0].message && res.data.choices[0].message.content
		: ''
	const trimmed = trimQuotes(text)
	if (!trimmed) {
		const err = new Error('EMPTY_RESPONSE')
		err.code = 'GENERATE_FAILED'
		throw err
	}
	return trimmed
}

/**
 * 使用微信云开发 AI（无需外部 API Key）
 * @param {Array<{ role: string, content: string }>} messages
 */
async function chatCompletionCloudAi(messages) {
	const { cloudProvider, cloudModel } = getLlmConfig()
	if (!cloud.extend || !cloud.extend.AI) {
		const err = new Error('LLM_NOT_CONFIGURED')
		err.code = 'LLM_NOT_CONFIGURED'
		throw err
	}

	const model = cloud.extend.AI.createModel(cloudProvider)
	const res = await model.generateText({
		model: cloudModel,
		messages,
		temperature: 0.85,
		max_tokens: 1024
	})

	const trimmed = extractCloudAiText(res)
	if (!trimmed) {
		const err = new Error('EMPTY_RESPONSE')
		err.code = 'GENERATE_FAILED'
		throw err
	}
	return trimmed
}

/**
 * @param {Array<{ role: string, content: string }>} messages
 * @returns {Promise<string>}
 */
async function chatCompletion(messages) {
	const { apiKey, useAnthropic } = getLlmConfig()
	if (apiKey) {
		if (useAnthropic) {
			return chatCompletionAnthropic(messages)
		}
		return chatCompletionOpenAI(messages)
	}
	return chatCompletionCloudAi(messages)
}

module.exports = { chatCompletion, getLlmConfig }
