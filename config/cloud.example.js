// 复制此文件为 cloud.js 并填入你的云开发环境 ID
export const CLOUD_ENV_ID = 'your-env-id'

// AI 模型配置（云函数 generateMomentsCopy 环境变量，也可在此保留供参考）
// 默认使用微信云开发 AI：AI_PROVIDER=hunyuan-exp, AI_MODEL=hunyuan-2.0-instruct-20251111
// 若配置 LLM_API_KEY 则走外部 API（DeepSeek 等）
export const AI_PROVIDER = 'hunyuan-exp'
export const AI_MODEL = 'hunyuan-2.0-instruct-20251111'
