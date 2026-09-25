/**
 * agentToolsPatient.js — 患者助手智能体专属工具函数
 *
 * 与医生端 agentTools.js 独立维护，不互相引用。
 * 所有写操作均需医生主动触发，智能体只返回草稿/数据。
 */
import { patients } from '../../mock/patients'
import { assessments } from '../../mock/assessments'
import { reminders } from '../../mock/reminders'
import { messages } from '../../mock/messages'
import { operationLogs } from '../../mock/operationLogs'

const ROLE_LABEL = {
  embryologist: '胚胎学家',
  senior: '高级医师',
  admin: '管理员',
}

function appendLog(action, target, currentUser) {
  operationLogs.unshift({
    id: 'LOG-' + Date.now(),
    user: currentUser.name,
    role: ROLE_LABEL[currentUser.role] ?? currentUser.role,
    actionType: 'agent_query',
    action,
    target: String(target),
    time: new Date().toLocaleString('sv'),
    ip: 'AI-Agent',
  })
}

/**
 * 查询指定患者的所有提醒
 */
export async function tool_get_reminders(patientId, currentUser) {
  const results = reminders.filter(r => r.patientId === patientId)
  appendLog('AI助手查询患者提醒列表', patientId, currentUser)
  return results
}

/**
 * 创建新提醒（医生确认后调用）
 * active 根据 endDate 自动计算
 */
export async function tool_create_reminder(reminderData, currentUser) {
  const today = new Date().toISOString().slice(0, 10)
  const newReminder = {
    id: 'RMD-' + Date.now(),
    active: reminderData.endDate >= today,
    ...reminderData,
  }
  reminders.unshift(newReminder)
  appendLog('AI助手创建患者提醒', reminderData.title, currentUser)
  return newReminder
}

/**
 * 发送提醒通知到患者小程序（Mock：写入 messages 数组）
 */
export async function tool_send_reminder_notification(reminderId, patientId, currentUser) {
  const reminder = reminders.find(r => r.id === reminderId)
  if (!reminder) return { success: false, error: '提醒不存在' }

  const msgId = 'MSG-' + Date.now()
  messages.unshift({
    id: msgId,
    type: 'reminder',
    title: reminder.title,
    summary: reminder.detail,
    reportId: null,
    time: new Date().toLocaleString('sv'),
    timestamp: Date.now(),
    read: false,
  })
  appendLog('AI助手发送提醒通知到患者小程序', reminderId, currentUser)
  return { success: true, messageId: msgId }
}

/**
 * 调用 LLM 生成提醒内容草稿（不自动写入，需医生确认）
 * type: 'medication' | 'followup'
 */
export async function tool_generate_reminder_draft(type, patientId, currentUser) {
  const typeLabel = type === 'medication' ? '用药提醒' : '随访提醒'

  const SYSTEM_PROMPT = `你是一名 IVF 诊所的医疗助手，帮助医生生成患者提醒内容草稿。
只生成提醒文字，不做诊断。内容须专业、简洁、温和。
禁止推荐具体药物剂量，剂量须由医生填写。
输出格式为 JSON，字段：title（标题）、detail（详情）、times（建议提醒时间数组，格式 HH:mm）。
不要输出 JSON 之外的任何内容，不要用 markdown 代码块包裹。`

  const userPrompt = `请为患者生成一条${typeLabel}草稿。
患者 ID：${patientId}。
要求：标题简短（10字内），详情说明${type === 'medication' ? '用药' : '随访'}注意事项（50字内），给出1-2个建议提醒时间。`

  const response = await fetch('/api/doubao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`豆包 API 请求失败 (${response.status}): ${err}`)
  }
  const data = await response.json()
  const text = data.output?.find(o => o.type === 'message')?.content?.[0]?.text ?? '{}'

  let draft
  try {
    draft = JSON.parse(text)
  } catch {
    draft = { title: typeLabel + '草稿', detail: text, times: [] }
  }

  appendLog('AI助手生成提醒内容草稿', patientId, currentUser)

  return {
    type,
    patientId,
    title: draft.title ?? '',
    detail: draft.detail ?? '',
    times: Array.isArray(draft.times) ? draft.times : [],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  }
}

/**
 * 自由对话：面向医生的患者管理助手
 * context: 当前选中患者的基本信息字符串
 */
export async function tool_chat(userMessage, context, currentUser) {
  const SYSTEM_PROMPT = `你是 IVF 诊所的患者管理助手，协助医生管理患者提醒和随访计划。
你可以：查询患者信息、生成提醒草稿、解答 IVF 流程相关问题。
你不能：直接修改数据（需医生确认）、给出诊断建议、预测治疗结果。
语言：中文，专业且简洁。回答控制在 150 字以内。`

  const fullMessage = context ? `[当前患者信息：${context}]\n\n${userMessage}` : userMessage

  const response = await fetch('/api/doubao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: fullMessage }],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`豆包 API 请求失败 (${response.status}): ${err}`)
  }
  const data = await response.json()
  appendLog('AI助手自由对话（患者管理）', userMessage.slice(0, 30), currentUser)
  return data.output?.find(o => o.type === 'message')?.content?.[0]?.text ?? '暂时无法回复，请稍后重试。'
}

/**
 * 按姓名或 ID 模糊搜索患者
 */
export async function tool_search_patients(query, currentUser) {
  const q = query.toLowerCase()
  const results = patients
    .filter(p => p.name.includes(q) || p.id.toLowerCase().includes(q))
    .map(({ id, name, age, doctor }) => ({ id, name, age, doctor }))
  appendLog('AI助手（患者助手）查询患者', query, currentUser)
  return results
}

/**
 * 查询指定患者的评估报告列表
 */
export async function tool_get_reports(patientId, currentUser) {
  const results = assessments
    .filter(a => a.patientId === patientId)
    .map(({ id, embryoNo, grade, status, assessmentDate, doctor }) =>
      ({ id, embryoNo, grade, status, assessmentDate, doctor })
    )
  appendLog('AI助手（患者助手）查询患者报告', patientId, currentUser)
  return results
}
