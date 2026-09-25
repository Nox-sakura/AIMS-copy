/**
 * reports.js — 报告 API 接口层
 *
 * 真实环境：对接 Python 后端 /api/reports 系列接口
 * 演示环境：BASE_URL 为空时自动降级到本地 mock 数据
 */
import { reports as mockData } from '../mock/reports'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 获取报告列表（支持按状态筛选） */
export async function getReports(params = {}) {
  if (BASE_URL) {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${BASE_URL}/api/reports${query ? '?' + query : ''}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取报告列表失败 (${res.status})`)
    return res.json()
  }
  let data = [...mockData]
  if (params.status) data = data.filter(r => r.status === params.status)
  return Promise.resolve(data)
}

/** 根据 ID 获取单条报告详情 */
export async function getReportById(id) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/reports/${id}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取报告详情失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve(mockData.find(r => r.id === id) ?? null)
}

/** 审批通过报告 */
export async function approveReport(id, doctorName) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/reports/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ reviewDoctor: doctorName }),
    })
    if (!res.ok) throw new Error(`审批报告失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve({ id, status: 'approved', reviewDoctor: doctorName })
}

/** 驳回报告 */
export async function rejectReport(id, doctorName, reason) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/reports/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ reviewDoctor: doctorName, reason }),
    })
    if (!res.ok) throw new Error(`驳回报告失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve({ id, status: 'rejected', reviewDoctor: doctorName })
}

/** 修改报告评级 */
export async function modifyReportGrade(id, newGrade) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/reports/${id}/grade`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ grade: newGrade }),
    })
    if (!res.ok) throw new Error(`修改评级失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve({ id, grade: newGrade })
}
