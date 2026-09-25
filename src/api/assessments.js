/**
 * assessments.js — 评估记录 API 接口层
 *
 * 真实环境：通过 fetch 请求 Python 后端 /api/assessments 系列接口
 * 演示环境：BASE_URL 为空时自动降级，返回本地 mock 数据
 */
import { assessments as mockData } from '../mock/assessments'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 获取评估列表 */
export async function getAssessments() {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/assessments`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取评估列表失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve([...mockData])
}

/** 根据 ID 获取单条评估详情 */
export async function getAssessmentById(id) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/assessments/${id}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取评估详情失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve(mockData.find(a => a.id === id) ?? null)
}

/** 提交新建评估 */
export async function submitAssessment(payload) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`提交评估失败 (${res.status})`)
    return res.json()
  }
  // 演示模式：模拟提交成功，返回新 ID
  return Promise.resolve({ id: `ASS-DEMO-${Date.now()}`, status: 'pending', ...payload })
}

/** 更新评估状态（如：pending → completed） */
export async function updateAssessmentStatus(id, status) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/assessments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error(`更新评估状态失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve({ id, status })
}
