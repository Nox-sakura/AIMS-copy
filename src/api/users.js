/**
 * users.js — 用户与认证 API 接口层
 *
 * 真实环境：对接 Python 后端 /api/auth 及 /api/users 接口
 * 演示环境：BASE_URL 为空时返回 mock 用户数据
 */
import { users as mockData } from '../mock/users'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 用户登录（返回 token 和用户信息） */
export async function login(credentials) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (!res.ok) throw new Error(`登录失败 (${res.status})`)
    return res.json()
  }
  // 演示模式：直接返回第一个用户
  return Promise.resolve({ token: 'demo-token', user: mockData[0] })
}

/** 获取所有用户列表（管理员专用） */
export async function getUsers() {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`获取用户列表失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve([...mockData])
}

/** 审批用户注册申请 */
export async function approveUser(userId) {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    })
    if (!res.ok) throw new Error(`审批用户失败 (${res.status})`)
    return res.json()
  }
  return Promise.resolve({ id: userId, status: 'active' })
}
