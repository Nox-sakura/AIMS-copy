// api/doubao.js — 豆包 API 代理
// 前端请求 /api/doubao，此函数转发到火山方舟，Key 仅存于服务端环境变量

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const apiKey = process.env.DOUBAO_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing DOUBAO_API_KEY' })
  }

  try {
    // 如果配置了 DOUBAO_MODEL，用服务端环境变量覆盖前端传来的 model 字段
    const body = process.env.DOUBAO_MODEL
      ? { ...req.body, model: process.env.DOUBAO_MODEL }
      : req.body

    const upstream = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    console.error('[api/doubao] upstream error:', err)
    return res.status(502).json({ error: 'Bad Gateway', detail: err.message })
  }
}
