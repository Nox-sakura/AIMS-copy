/**
 * agentTools.js — AI 临床助手工具函数
 *
 * 四个工具函数模拟异步数据查询，每次调用后向 operationLogs 追加日志。
 * 依赖：patients / assessments / concepts / operationLogs（均为 mock 数组）
 */
import { patients } from '../../mock/patients'
import { assessments } from '../../mock/assessments'
import { concepts } from '../../mock/concepts'
import { operationLogs } from '../../mock/operationLogs'

const ROLE_LABEL = {
  embryologist: '胚胎学家',
  senior: '主任医师',
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
 * 按姓名或 ID 模糊搜索患者
 */
export async function tool_search_patients(query, currentUser) {
  const q = query.toLowerCase()
  const results = patients
    .filter(p => p.name.includes(q) || p.id.toLowerCase().includes(q))
    .map(({ id, name, age, doctor }) => ({ id, name, age, doctor }))
  appendLog('AI助手查询患者信息', query, currentUser)
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
  appendLog('AI助手查询评估报告列表', patientId, currentUser)
  return results
}

/** 保留原有界面和兼容接口。 */
export async function tool_get_report_detail(reportId, currentUser) {
  const assessment = assessments.find(a => a.id === reportId)
  if (!assessment) return null
  const enrichedScores = assessment.conceptScores.map(cs => {
    const concept = concepts.find(c => c.id === cs.id)
    return { ...cs, nameCn: concept?.name ?? cs.id, nameEn: concept?.nameEn ?? cs.id }
  })
  appendLog('AI助手读取报告详情', reportId, currentUser)
  return { ...assessment, conceptScores: enrichedScores }
}

const CHAT_SYSTEM_PROMPT = `你是一名辅助 IVF 胚胎学家的临床智能助手。你可以回答关于 IVF、胚胎学、辅助生殖技术的问题，也可以协助查询患者信息和评估报告（用户可通过指令触发）。回答简洁专业，不做最终诊断建议。`

/**
 * 通用对话：将用户消息发送给 LLM，返回自然语言回复
 */
export async function tool_chat(userMessage) {
  const response = await fetch('/api/doubao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: CHAT_SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userMessage }],
        },
      ],
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`豆包 API 请求失败 (${response.status}): ${err}`)
  }
  const data = await response.json()
  const messageOutput = data.output?.find(o => o.type === 'message')
  return messageOutput?.content?.[0]?.text ?? '暂时无法回复，请稍后重试。'
}

/**
 * 对比指定患者本次周期所有胚胎的概念得分
 */
export async function tool_compare_embryos(patientId, cycleNo, currentUser) {
  const cycleAssessments = assessments.filter(
    a => a.patientId === patientId && a.cycleNo === cycleNo
  )
  const embryos = cycleAssessments.map(a => {
    const enrichedScores = a.conceptScores.map(cs => {
      const concept = concepts.find(c => c.id === cs.id)
      return { ...cs, nameCn: concept?.name ?? cs.id, nameEn: concept?.nameEn ?? cs.id }
    })
    return { ...a, conceptScores: enrichedScores }
  })
  appendLog('AI助手对比周期胚胎概念得分', `${patientId} 第${cycleNo}周期`, currentUser)
  return {
    patientName: cycleAssessments[0]?.patientName ?? '未知',
    patientId,
    cycleNo,
    embryos,
  }
}

const SUMMARY_SYSTEM_PROMPT = `你是一名辅助 IVF 胚胎学家的 AI 助手，只生成评估总结草稿，不做最终诊断。

分级标准（第3天卵裂期胚胎）：
- Grade 1：卵裂球均一，碎片化 <5%
- Grade 2：碎片化 5–20%
- Grade 3：碎片化 20–50%
- Grade 4：碎片化 >50% 或多核

概念名称使用以下界面标签，禁止自行创造：
symmetrical blastomeres, clear cytoplasm, uniform cell size, intact zona pellucida, rapid cleavage rate, minimal metabolic debris, smooth membrane boundaries, minor fragmentation, pronounced vacuolation, disorganized cell structures

输出格式：自然语言段落，150 字以内，以"本胚胎评估结果为 Grade X，……"开头。
末尾必须附加："【草稿仅供参考，最终结论须由主治医师确认。】"`

/**
 * 调用 Anthropic API 生成评估总结草稿
 */
export async function tool_generate_summary(reportDetail, currentUser) {
  const conceptList = reportDetail.conceptScores
    .map(cs => `${cs.nameEn}（${cs.nameCn}）: ${cs.score}`)
    .join('，')

  const userPrompt = `胚胎编号：${reportDetail.embryoNo}
患者ID：${reportDetail.patientId}
AI评级：${reportDetail.grade}（${reportDetail.gradeLabel}）
各概念得分：${conceptList}

请根据以上信息生成评估总结草稿。`

  const response = await fetch('/api/doubao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SUMMARY_SYSTEM_PROMPT }],
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
  const messageOutput = data.output?.find(o => o.type === 'message')
  const text = messageOutput?.content?.[0]?.text ?? '无法生成总结，请稍后重试。'
  appendLog('AI助手生成评估总结草稿', reportDetail.id, currentUser)
  return text
}
