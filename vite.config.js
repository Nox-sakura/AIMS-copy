// vite.config.js — Vite 构建配置
// 使用 @vitejs/plugin-react 支持 JSX 快速刷新（HMR）
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      // 豆包 API 本地代理中间件（等同于 api/doubao.js Vercel 函数）
      {
        name: 'doubao-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/doubao', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end('Method Not Allowed')
              return
            }
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const apiKey = env.DOUBAO_API_KEY
                if (!apiKey) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: 'Server misconfiguration: missing DOUBAO_API_KEY' }))
                  return
                }
                const parsed = JSON.parse(body)
                const payload = env.DOUBAO_MODEL
                  ? { ...parsed, model: env.DOUBAO_MODEL }
                  : parsed

                const upstream = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey,
                  },
                  body: JSON.stringify(payload),
                })
                const data = await upstream.json()
                res.statusCode = upstream.status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(data))
              } catch (err) {
                console.error('[doubao-api-middleware] error:', err)
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Bad Gateway', detail: err.message }))
              }
            })
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // 分级后端代理
        '/api/mca': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.warn('[vite proxy /api/mca] 后端离线，将使用前端仿真', err.message)
            })
          },
        },
      },
    },
  }
})
