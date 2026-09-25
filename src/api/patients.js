/**
 * patients.js — 患者信息 API 接口层
 *
 * 真实环境：对接 Python 后端 /api/patients 系列接口
 * 演示环境：BASE_URL 为空时自动降级到本地 mock 数据
 */
import { patients as mockData } from '../mock/patients'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 获取患者列表（支持关键词搜索） */
export async function getPatients(params = {}) {
  if (BASE_URL) {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${BASE_URL}/api/patients${query ? '?' + query : ''}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取患者列表失败 (${res.status})`)
    return res.json()
  }
  let data = [...mockData]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    data = data.filter(p => p.name.includes(kw) || p.id.toLowerCase().includes(kw))
  }
  return Promise.resolve(data)
}

/** 根据 ID 获取单个患者详情 */
export async function getPatientById(id) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/patients/${id}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取患者详情失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve(mockData.find(p => p.id === id) ?? null)
}
