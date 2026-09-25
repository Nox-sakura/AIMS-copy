/**
 * concepts.js — 概念评分 API 接口层
 *
 * 真实环境：对接 Python 后端 /api/concepts 接口（MCA 模型输出）
 * 演示环境：BASE_URL 为空时返回 mock 概念数据
 */
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

/** 根据评估 ID 获取该评估的概念得分详情（MCA 模型解释层输出） */
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
