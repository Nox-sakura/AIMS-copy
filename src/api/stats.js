/**
 * stats.js — 统计数据 API 接口层
 *
 * 真实环境：对接 Python 后端 /api/stats 系列接口
 * 演示环境：BASE_URL 为空时自动降级到本地 mock 数据
 */
import {
  weeklyTrend       as mockWeeklyTrend,
  monthlyConsistency as mockMonthlyConsistency,
  gradeDistribution  as mockGradeDistribution,
  kpiStats           as mockKpiStats,
} from '../mock/stats'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 获取本周每日评估趋势数据（Dashboard 折线图） */
export async function getWeeklyTrend() {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/stats/weekly-trend`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取趋势数据失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve([...mockWeeklyTrend])
}

/** 获取近6个月模型一致率（Admin 折线图） */
export async function getMonthlyConsistency() {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/stats/monthly-consistency`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取一致率数据失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve([...mockMonthlyConsistency])
}

/** 获取本月各等级胚胎分布（Admin 柱状图） */
export async function getGradeDistribution() {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/stats/grade-distribution`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取等级分布数据失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve([...mockGradeDistribution])
}

/** 获取 Dashboard KPI 概览数字 */
export async function getKpiStats() {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/stats/kpi`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取 KPI 数据失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve([...mockKpiStats])
}
