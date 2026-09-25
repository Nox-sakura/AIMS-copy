/**
 * formatDoctor — 通用医生姓名+职称格式化工具
 * 输入姓名，从 users mock 查询职称，返回"姓名（职称）"格式
 */
import { users } from '../mock/users'

export function formatDoctorWithTitle(name) {
  if (!name) return '—'
  const found = users.find(u => u.name === name)
  if (found?.title) return `${found.name}（${found.title}）`
  return name
}
