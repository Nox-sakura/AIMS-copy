/** 保留原有界面和兼容接口。 */
import { concepts as mockData } from '../mock/concepts'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 获取全部概念定义（用于前端展示映射） */
export async function getConcepts() {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/concepts`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取概念列表失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve([...mockData])
}

/** 保留原有界面和兼容接口。 */
export async function getConceptScores(assessmentId) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/assessments/${assessmentId}/concepts`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取概念得分失败 (${res.status})`)
    return res.json()
  }
  // 演示模式：从 mock 数据中找对应评估的 conceptScores
  const { assessments } = await import('../mock/assessments')
  const assessment = assessments.find(a => a.id === assessmentId)
  return Promise.resolve(assessment?.conceptScores ?? [])
}
